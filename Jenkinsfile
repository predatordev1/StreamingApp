pipeline {
    agent any
    
    triggers {
        githubPush()
    }
    environment {
    AWS_ACCOUNT_ID = "975050024946"
    AWS_REGION     = "us-east-1"
    IMAGE_TAG      = "v${BUILD_NUMBER}"
    ECR_URL        = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    }
    stages {
        stage('Verify AWS Access and login to ECR Repos') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                sh '''
                    aws sts get-caller-identity
                    aws ecr describe-repositories --region $AWS_REGION
                    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL
                '''
                }
            }
        }
        stage('Clone Github Repo') {
            steps {
                sh '''
                    rm -rf StreamingApp/
                    git clone -b main https://github.com/predatordev1/StreamingApp.git
                '''
            }
        }
        stage('Image Building for backend admin Services') {
            steps {
                sh '''
                    cd StreamingApp/backend
                    docker build -t adminservice -f adminService/Dockerfile .
                '''
            }
        }
        stage('Image Building for backend auth Services') {
            steps {
                sh '''
                    cd StreamingApp/backend
                    docker build -t authservice -f authService/Dockerfile .
                '''
            }
        }
        stage('Image Building for backend chat Services') {
            steps {
                sh '''
                    cd StreamingApp/backend
                    docker build -t chatservice -f chatService/Dockerfile .
                '''
            }
        }
        stage('Image Building for backend streaming Services') {
            steps {
                sh '''
                    cd StreamingApp/backend
                    docker build -t streamingservice -f streamingService/Dockerfile .
                '''
            }
        }
        stage('Image Building for  frontend Services') {
            steps {
                sh '''
                    cd StreamingApp/frontend
                    docker build -t frontend .
                '''
            }
        }
        stage('Testing for both frontend and backend Services') {
            steps {
                sh '''
                    cd StreamingApp/
                    docker compose up -d
                    sleep 30   # wait for services to be healthy
                    docker compose down
                '''
            }
        }
        stage('Tagging of docker Images') {
            steps {
                sh '''
                docker tag adminservice $ECR_URL/dev-streaming-app-backend:adminservice-$IMAGE_TAG
                docker tag authservice $ECR_URL/dev-streaming-app-backend:authservice-$IMAGE_TAG
                docker tag chatservice $ECR_URL/dev-streaming-app-backend:chatservice-$IMAGE_TAG
                docker tag streamingservice $ECR_URL/dev-streaming-app-backend:streamingservice-$IMAGE_TAG
                docker tag frontend $ECR_URL/dev-streaming-app-frontend:frontend-$IMAGE_TAG
                '''
            }
        }
        stage('Pushing of docker Images to ECR Repos') {
            steps {
                sh '''
                docker push $ECR_URL/dev-streaming-app-backend:adminservice-$IMAGE_TAG
                docker push $ECR_URL/dev-streaming-app-backend:authservice-$IMAGE_TAG
                docker push $ECR_URL/dev-streaming-app-backend:streamingservice-$IMAGE_TAG
                docker push $ECR_URL/dev-streaming-app-backend:chatservice-$IMAGE_TAG
                docker push $ECR_URL/dev-streaming-app-frontend:frontend-$IMAGE_TAG
                '''
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
            echo "All Microservices tested and pushed to ECR successfully!"

            emailext(
                to: 'devendra8182@gmail.com',
                subject: "Pipeline Status: ${currentBuild.result}",
                body: "Build ${env.BUILD_NUMBER} - ${currentBuild.result}",
            )
        }
        failure {
            echo "Pipeline failed, skipping Pushing docker images to ECR"
            emailext (
                subject: "FAILURE: Streaming CICD pipeline status",
                body: "Pipeline failed. Please check Jenkins console output for details.",
                to: "devendra8182@gmail.com"
            )
        }
    }
}
