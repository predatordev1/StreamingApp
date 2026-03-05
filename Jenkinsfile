pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID = "975050024946"
        AWS_REGION     = "us-east-1"
        IMAGE_TAG      = "v${BUILD_NUMBER}"
        ECR_URL        = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        AWS_CREDS_ID   = 'aws-credentials'
    }

    stages {

        stage('Install Prerequisites') {
            steps {
                sh '''
                    if command -v apk > /dev/null 2>&1; then
                        apk add --no-cache aws-cli git curl
                    elif command -v apt-get > /dev/null 2>&1; then
                        apt-get update -y && apt-get install -y awscli git curl
                    elif command -v yum > /dev/null 2>&1; then
                        yum install -y awscli git curl
                    else
                        echo "No supported package manager found"
                        exit 1
                    fi
                '''
            }
        }

        stage('Verify AWS Access and Login to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: "${AWS_CREDS_ID}",
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    sh '''
                        echo "Verifying AWS credentials..."
                        aws sts get-caller-identity

                        echo "Listing ECR repositories..."
                        aws ecr describe-repositories --region $AWS_REGION || true

                        echo "Logging in to ECR..."
                        aws ecr get-login-password --region $AWS_REGION \
                            | docker login --username AWS --password-stdin $ECR_REGISTRY
                        
                        echo "ECR login successful."
                    '''
                }
            }
        }

        stage('Build All Services') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: "${AWS_CREDS_ID}",
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    script {
                        withEnv([
                            "DOCKER_REGISTRY=${ECR_REGISTRY}",
                            "TAG=${IMAGE_TAG}"
                        ]) {
                            sh '''
                                echo "Building all services..."
                                echo "DOCKER_REGISTRY: ${DOCKER_REGISTRY}"
                                echo "TAG: ${TAG}"
                                docker-compose -f docker-compose.yml build
                                echo "Build completed successfully for tag: ${TAG}"
                            '''
                        }
                    }
                }
            }
        }

        stage('Push All Services to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: "${AWS_CREDS_ID}",
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    script {
                        echo "Re-authenticating to ECR before push..."
                        sh """
                            aws ecr get-login-password --region ${AWS_REGION} \
                                | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        """

                        def services = ['auth', 'streaming', 'admin', 'chat', 'frontend']

                        for (String service : services) {
                            echo "Pushing service: ${service}"
                            sh """
                                echo "Pushing ${ECR_REGISTRY}/${service}:${IMAGE_TAG} ..."
                                docker push ${ECR_REGISTRY}/${service}:${IMAGE_TAG}
                                echo "Successfully pushed ${ECR_REGISTRY}/${service}:${IMAGE_TAG}"
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up local Docker images..."
            sh '''
                docker rmi adminservice   || true
                docker rmi authservice    || true
                docker rmi chatservice    || true
                docker rmi streamingservice || true
                docker rmi frontend       || true

                docker rmi $ECR_REGISTRY/admin:$IMAGE_TAG     || true
                docker rmi $ECR_REGISTRY/auth:$IMAGE_TAG      || true
                docker rmi $ECR_REGISTRY/chat:$IMAGE_TAG      || true
                docker rmi $ECR_REGISTRY/streaming:$IMAGE_TAG || true
                docker rmi $ECR_REGISTRY/frontend:$IMAGE_TAG  || true

                docker system prune -f
            '''
        }

        success {
            echo "All microservices built and pushed to ECR successfully!"
            emailext(
                to: 'devendra8182@gmail.com',
                subject: "SUCCESS: Streaming CI/CD Pipeline - Build #${env.BUILD_NUMBER}",
                body: """
                    Build #${env.BUILD_NUMBER} completed successfully.

                    Image Tag : ${env.IMAGE_TAG}
                    ECR Registry : ${env.ECR_REGISTRY}
                    Services Pushed : auth, streaming, admin, chat, frontend

                    View build: ${env.BUILD_URL}
                """
            )
        }

        failure {
            echo "Pipeline failed. Images were NOT pushed to ECR."
            emailext(
                to: 'devendra8182@gmail.com',
                subject: "FAILURE: Streaming CI/CD Pipeline - Build #${env.BUILD_NUMBER}",
                body: """
                    Build #${env.BUILD_NUMBER} FAILED.

                    Please check the Jenkins console output for details:
                    ${env.BUILD_URL}console
                """
            )
        }
    }
}