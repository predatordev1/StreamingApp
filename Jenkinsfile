pipeline {
    agent {
        docker {
            image 'docker:dind'
            args '-v /var/run/docker.sock:/var/run/docker.sock -u root:root'
        }
    }

    environment {
        AWS_ACCOUNT_ID = "975050024946"
        AWS_REGION     = "us-east-1"
        IMAGE_TAG      = "v${BUILD_NUMBER}"
        ECR_URL        = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        AWS_CREDS_ID = 'aws-credentials'
    }

    stages {
        stage('Install Prerequisites') {
            steps {
                sh 'apk add --no-cache aws-cli git'
            }
        }
        stage('Verify AWS Access and Login to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    sh '''
                        aws sts get-caller-identity
                        aws ecr describe-repositories --region $AWS_REGION || true
                        aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL
                    '''
                }
            }
        }

        stage('Build All Services') {
            steps {
                script {
                    withEnv([
                        "DOCKER_REGISTRY=${ECR_REGISTRY}",
                        "TAG=${IMAGE_TAG}"
                    ]) {
                        sh 'docker-compose -f docker-compose.yml build'
                        sh 'echo "Build completed successfully for tag: ${IMAGE_TAG}"'
                        sh 'echo "DOCKER_REGIßSTRY: ${DOCKER_REGISTRY}"'
                        sh 'echo "TAG: ${TAG}"'
                    }
                }
            }
        }
        
        stage('Push All Services to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding', 
                    credentialsId: env.AWS_CREDS_ID
                ]]) {
                    script {
                        sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
                        def services = ['auth', 'streaming', 'admin', 'chat', 'frontend']                        
                        for (String service : services) {
                            sh "echo 'Pushing ${ECR_REGISTRY}/${service}:${IMAGE_TAG}'"
                            sh "docker push ${ECR_REGISTRY}/${service}:${IMAGE_TAG}"
                            sh "echo 'Pushed ${ECR_REGISTRY}/${service}:${IMAGE_TAG}'"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            sh '''
                docker rmi adminservice authservice chatservice streamingservice frontend || true
                docker rmi $ECR_URL/dev-streaming-app-backend:adminservice-$IMAGE_TAG || true
                docker rmi $ECR_URL/dev-streaming-app-backend:authservice-$IMAGE_TAG || true
                docker rmi $ECR_URL/dev-streaming-app-backend:chatservice-$IMAGE_TAG || true
                docker rmi $ECR_URL/dev-streaming-app-backend:streamingservice-$IMAGE_TAG || true
                docker rmi $ECR_URL/dev-streaming-app-frontend:frontend-$IMAGE_TAG || true
                docker system prune -f
            '''
        }
        success {
            echo "All microservices tested and pushed to ECR successfully!"
            emailext(
                to: 'devendra8182@gmail.com',
                subject: "Pipeline Status: ${currentBuild.result}",
                body: "Build ${env.BUILD_NUMBER} - ${currentBuild.result}"
            )
        }
        failure {
            echo "Pipeline failed, skipping push to ECR"
            emailext(
                to: "devendra8182@gmail.com",
                subject: "FAILURE: Streaming CICD pipeline status",
                body: "Pipeline failed. Please check Jenkins console output for details."
            )
        }
    }
}
