# CloudWatch Monitoring & Centralized Logging Setup
## Streaming App on Amazon EKS

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [IAM Permissions](#2-iam-permissions)
3. [Install CloudWatch Container Insights](#3-install-cloudwatch-container-insights)
4. [Centralized Logging with Fluent Bit](#4-centralized-logging-with-fluent-bit)
5. [Verify Logs in CloudWatch](#5-verify-logs-in-cloudwatch)
6. [CloudWatch Alarms](#6-cloudwatch-alarms)
7. [SNS Email Alerts](#7-sns-email-alerts)
8. [CloudWatch Dashboard](#8-cloudwatch-dashboard)
9. [Querying Logs with Logs Insights](#9-querying-logs-with-cloudwatch-logs-insights)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Ensure the following are in place before starting:

| Requirement | Check Command |
|---|---|
| AWS CLI configured | `aws sts get-caller-identity` |
| kubectl connected to cluster | `kubectl get nodes` |
| Helm installed | `helm version` |
| EKS cluster running | `aws eks list-clusters` |

Set these environment variables — used throughout this guide:

```bash
export CLUSTER_NAME=<your-eks-cluster-name>
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=975050024946
export APP_NAMESPACE=streaming-app
export ALERT_EMAIL=devendra8182@gmail.com
```

---

## 2. IAM Permissions

Worker nodes need permission to write metrics and logs to CloudWatch.

### 2.1 Find Your Node Group Role

```bash
aws eks list-nodegroups \
  --cluster-name $CLUSTER_NAME \
  --region $AWS_REGION

NODE_ROLE=$(aws eks describe-nodegroup \
  --cluster-name $CLUSTER_NAME \
  --nodegroup-name <your-nodegroup-name> \
  --region $AWS_REGION \
  --query 'nodegroup.nodeRole' \
  --output text | cut -d'/' -f2)

echo "Node Role: $NODE_ROLE"
```

### 2.2 Attach Required Policies

```bash
# CloudWatch Agent policy
aws iam attach-role-policy \
  --role-name $NODE_ROLE \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

# EKS Worker Node policy
aws iam attach-role-policy \
  --role-name $NODE_ROLE \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy

# Verify
aws iam list-attached-role-policies \
  --role-name $NODE_ROLE \
  --query 'AttachedPolicies[*].PolicyName'
```

---

## 3. Install CloudWatch Container Insights

Automatically collects CPU, memory, disk, and network metrics from every pod.

### 3.1 Install via EKS Addon

```bash
aws eks create-addon \
  --cluster-name $CLUSTER_NAME \
  --addon-name amazon-cloudwatch-observability \
  --region $AWS_REGION

# Wait for addon to become ACTIVE (~2 minutes)
aws eks wait addon-active \
  --cluster-name $CLUSTER_NAME \
  --addon-name amazon-cloudwatch-observability \
  --region $AWS_REGION

# Confirm status
aws eks describe-addon \
  --cluster-name $CLUSTER_NAME \
  --addon-name amazon-cloudwatch-observability \
  --region $AWS_REGION \
  --query 'addon.status'
```

### 3.2 Verify CloudWatch Agent Pods

```bash
kubectl get pods -n amazon-cloudwatch
# Expected: cloudwatch-agent-xxxxx   1/1   Running   0
```

### 3.3 Verify in AWS Console

1. Go to **CloudWatch → Metrics → ContainerInsights**
2. You should see: `pod_cpu_utilization`, `pod_memory_utilization`, `pod_number_of_container_restarts`

---

## 4. Centralized Logging with Fluent Bit

Fluent Bit runs as a DaemonSet on every node and ships all container logs to CloudWatch Logs.

### 4.1 Create Namespace and ConfigMap

```bash
kubectl create namespace amazon-cloudwatch

kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-cluster-info
  namespace: amazon-cloudwatch
data:
  cluster.name: ${CLUSTER_NAME}
  http.port:    "2020"
  http.server:  "On"
  logs.region:  ${AWS_REGION}
  read.head:    "Off"
  read.tail:    "On"
EOF
```

### 4.2 Deploy Fluent Bit DaemonSet

```bash
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/fluent-bit/fluent-bit.yaml

# Watch pods come up (one per node)
kubectl get pods -n amazon-cloudwatch -w
```

### 4.3 Verify Fluent Bit is Shipping Logs

```bash
kubectl logs -n amazon-cloudwatch \
  $(kubectl get pod -n amazon-cloudwatch \
    -l k8s-app=fluent-bit \
    -o jsonpath='{.items[0].metadata.name}') \
  --tail=30
```

Good output contains:
```
[info] [output:cloudwatch_logs] plugin has been initialised
[info] started log group: /aws/containerinsights/<cluster>/application
```

### 4.4 CloudWatch Log Groups Created

| Log Group | Contains |
|---|---|
| `/aws/containerinsights/<cluster>/application` | All pod/container logs |
| `/aws/containerinsights/<cluster>/host` | EC2 node system logs |
| `/aws/containerinsights/<cluster>/performance` | Performance metrics as logs |
| `/aws/containerinsights/<cluster>/dataplane` | Kubernetes dataplane logs |

---

## 5. Verify Logs in CloudWatch

### 5.1 Check Logs Per Service via kubectl

```bash
# Single service
kubectl logs -n $APP_NAMESPACE \
  -l component=auth-service \
  --tail=50 --follow

# All backend services at once
for SVC in auth-service streaming-service admin-service chat-service; do
  echo "=== $SVC ==="
  kubectl logs -n $APP_NAMESPACE -l component=$SVC --tail=10
done
```

### 5.2 Find Logs in CloudWatch Console

1. Go to **CloudWatch → Log Groups**
2. Open `/aws/containerinsights/<cluster-name>/application`
3. Each pod has its own log stream:
   ```
   streaming-app.auth-service-deployment-xxxxx.auth-service
   streaming-app.admin-service-deployment-xxxxx.admin-service
   ```

---

## 6. CloudWatch Alarms

### 6.1 Pod Restart Alarm

Triggers when any pod restarts more than 5 times in 5 minutes:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "streaming-app-pod-restarts" \
  --alarm-description "Alert: Pod restart count too high" \
  --namespace ContainerInsights \
  --metric-name pod_number_of_container_restarts \
  --dimensions \
      Name=ClusterName,Value=$CLUSTER_NAME \
      Name=Namespace,Value=$APP_NAMESPACE \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions $SNS_ARN \
  --ok-actions $SNS_ARN \
  --region $AWS_REGION
```

### 6.2 High CPU Alarm

Triggers when average pod CPU exceeds 80% for 10 minutes:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "streaming-app-high-cpu" \
  --alarm-description "Alert: CPU usage above 80%" \
  --namespace ContainerInsights \
  --metric-name pod_cpu_utilization \
  --dimensions \
      Name=ClusterName,Value=$CLUSTER_NAME \
      Name=Namespace,Value=$APP_NAMESPACE \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions $SNS_ARN \
  --ok-actions $SNS_ARN \
  --region $AWS_REGION
```

### 6.3 High Memory Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "streaming-app-high-memory" \
  --alarm-description "Alert: Memory usage above 80%" \
  --namespace ContainerInsights \
  --metric-name pod_memory_utilization \
  --dimensions \
      Name=ClusterName,Value=$CLUSTER_NAME \
      Name=Namespace,Value=$APP_NAMESPACE \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions $SNS_ARN \
  --ok-actions $SNS_ARN \
  --region $AWS_REGION
```

### 6.4 Node CPU Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "streaming-app-node-cpu" \
  --alarm-description "Alert: Node CPU above 85%" \
  --namespace ContainerInsights \
  --metric-name node_cpu_utilization \
  --dimensions Name=ClusterName,Value=$CLUSTER_NAME \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions $SNS_ARN \
  --ok-actions $SNS_ARN \
  --region $AWS_REGION
```

### 6.5 Verify All Alarms

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix "streaming-app" \
  --region $AWS_REGION \
  --query 'MetricAlarms[*].{Name:AlarmName,State:StateValue}' \
  --output table
```

---

## 7. SNS Email Alerts

### 7.1 Create SNS Topic and Subscribe

```bash
# Create topic
SNS_ARN=$(aws sns create-topic \
  --name streaming-app-alerts \
  --region $AWS_REGION \
  --query 'TopicArn' \
  --output text)

echo "SNS ARN: $SNS_ARN"

# Subscribe email
aws sns subscribe \
  --topic-arn $SNS_ARN \
  --protocol email \
  --notification-endpoint $ALERT_EMAIL \
  --region $AWS_REGION
```

> Check your email and click the confirmation link. Alarms will not send emails until confirmed.

### 7.2 Verify Subscription

```bash
aws sns list-subscriptions-by-topic \
  --topic-arn $SNS_ARN \
  --region $AWS_REGION \
  --query 'Subscriptions[*].{Endpoint:Endpoint,Status:SubscriptionArn}' \
  --output table
```

Status should show a full ARN, not `PendingConfirmation`.

### 7.3 Test the Alert

```bash
# Manually trigger alarm
aws cloudwatch set-alarm-state \
  --alarm-name "streaming-app-pod-restarts" \
  --state-value ALARM \
  --state-reason "Manual test" \
  --region $AWS_REGION

# Reset after confirming email received
aws cloudwatch set-alarm-state \
  --alarm-name "streaming-app-pod-restarts" \
  --state-value OK \
  --state-reason "Manual test reset" \
  --region $AWS_REGION
```

---

## 8. CloudWatch Dashboard

### 8.1 Create Dashboard via Console

1. Go to **CloudWatch → Dashboards → Create Dashboard**
2. Name it `StreamingApp-Overview`
3. Add these widgets:

| Widget | Metric | Stat |
|---|---|---|
| Pod CPU | `pod_cpu_utilization` | Average |
| Pod Memory | `pod_memory_utilization` | Average |
| Pod Restarts | `pod_number_of_container_restarts` | Sum |
| Node CPU | `node_cpu_utilization` | Average |
| Network RX | `pod_network_rx_bytes` | Average |
| Alarm Status | All 4 streaming-app alarms | — |

For all metrics use namespace `ContainerInsights` with dimensions:
- `ClusterName` = your cluster name
- `Namespace` = `streaming-app`

---

## 9. Querying Logs with CloudWatch Logs Insights

Go to **CloudWatch → Logs Insights**, select log group:
`/aws/containerinsights/<cluster-name>/application`

### Logs for a specific service
```
fields @timestamp, log, kubernetes.pod_name
| filter kubernetes.labels.component = "auth-service"
| sort @timestamp desc
| limit 100
```

### All errors across all services
```
fields @timestamp, log, kubernetes.pod_name
| filter kubernetes.namespace_name = "streaming-app"
| filter log like /error|Error|ERROR|exception/
| sort @timestamp desc
| limit 200
```

### Error count per service
```
fields kubernetes.labels.component
| filter log like /error|Error|ERROR/
| stats count(*) as error_count by kubernetes.labels.component
| sort error_count desc
```

### MongoDB connection issues
```
fields @timestamp, log, kubernetes.pod_name
| filter log like /MongoDB|mongo|MONGO/
| sort @timestamp desc
| limit 50
```

### Logs for a specific time range
```
fields @timestamp, log, kubernetes.pod_name
| filter kubernetes.labels.component = "streaming-service"
| filter @timestamp >= 1700000000000
| sort @timestamp desc
| limit 100
```

---

## 10. Troubleshooting

### Fluent Bit not shipping logs

```bash
# Check pod status
kubectl get pods -n amazon-cloudwatch

# Check for errors
kubectl logs -n amazon-cloudwatch \
  -l k8s-app=fluent-bit --tail=50 | grep -i error

# Restart Fluent Bit
kubectl rollout restart daemonset/fluent-bit -n amazon-cloudwatch
```

### No metrics in CloudWatch

```bash
# Check CloudWatch agent pods
kubectl get pods -n amazon-cloudwatch | grep cloudwatch-agent

# Check agent logs
kubectl logs -n amazon-cloudwatch \
  $(kubectl get pod -n amazon-cloudwatch \
    -l name=cloudwatch-agent \
    -o jsonpath='{.items[0].metadata.name}') --tail=30

# Verify IAM policies
aws iam list-attached-role-policies --role-name $NODE_ROLE
```

### Alarms not sending emails

```bash
# Check subscription status
aws sns list-subscriptions-by-topic \
  --topic-arn $SNS_ARN --region $AWS_REGION

# Check alarm state and reason
aws cloudwatch describe-alarms \
  --alarm-name-prefix "streaming-app" \
  --region $AWS_REGION \
  --query 'MetricAlarms[*].{Name:AlarmName,State:StateValue,Reason:StateReason}'
```

### Container Insights addon unhealthy

```bash
aws eks describe-addon \
  --cluster-name $CLUSTER_NAME \
  --addon-name amazon-cloudwatch-observability \
  --region $AWS_REGION \
  --query 'addon.{Status:status,Issues:health.issues}'
```

---
