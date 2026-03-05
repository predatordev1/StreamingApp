pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID   = "975050024946"
        AWS_REGION       = "us-east-1"
        IMAGE_TAG        = "v${BUILD_NUMBER}"
        ECR_REGISTRY     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        AWS_CREDS_ID     = 'aws-credentials'
        COMPOSE_PROJECT  = 'streamingapp'
    }

    stages {

        stage('Install Prerequisites') {
            steps {
                sh '''
                    if command -v aws > /dev/null 2>&1; then
                        echo "aws-cli already installed: $(aws --version)"
                    else
                        echo "Installing aws-cli and dependencies..."
                        if command -v apk > /dev/null 2>&1; then
                            apk add --no-cache aws-cli git curl
                        elif command -v apt-get > /dev/null 2>&1; then
                            apt-get update -y && apt-get install -y awscli git curl
                        elif command -v yum > /dev/null 2>&1; then
                            yum install -y awscli git curl
                        else
                            echo "ERROR: No supported package manager found"
                            exit 1
                        fi
                    fi
                    echo "--- Tool versions ---"
                    aws --version
                    git --version
                    docker --version
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
                        // Build with a fixed project name so image names are always predictable:
                        //   docker-compose -p streamingapp  =>  streamingapp-auth
                        //                                       streamingapp-streaming
                        //                                       streamingapp-admin
                        //                                       streamingapp-chat
                        //                                       streamingapp-frontend
                        sh """
                            echo "Building all services with project name: ${COMPOSE_PROJECT}"
                            docker compose -p ${COMPOSE_PROJECT} -f docker-compose.yml build
                            echo "Build completed for tag: ${IMAGE_TAG}"

                            echo "--- Images produced by docker-compose ---"
                            docker images | grep ${COMPOSE_PROJECT}
                        """

                        // Map: compose-produced name  =>  ECR repository name
                        // docker-compose v2 uses hyphen:  {project}-{service}
                        // docker-compose v1 uses underscore: {project}_{service}
                        // We detect which separator was used at runtime
                        def services = ['auth', 'streaming', 'admin', 'chat', 'frontend']

                        for (String svc : services) {
                            sh """
                                # Try Compose v2 name first (hyphen), fall back to v1 (underscore)
                                if docker image inspect ${COMPOSE_PROJECT}-${svc} > /dev/null 2>&1; then
                                    LOCAL_IMAGE="${COMPOSE_PROJECT}-${svc}"
                                elif docker image inspect ${COMPOSE_PROJECT}_${svc} > /dev/null 2>&1; then
                                    LOCAL_IMAGE="${COMPOSE_PROJECT}_${svc}"
                                else
                                    echo "ERROR: Could not find local image for service '${svc}'."
                                    echo "Available images:"
                                    docker images
                                    exit 1
                                fi

                                echo "Tagging \$LOCAL_IMAGE -> ${ECR_REGISTRY}/${svc}:${IMAGE_TAG}"
                                docker tag \$LOCAL_IMAGE ${ECR_REGISTRY}/${svc}:${IMAGE_TAG}
                                echo "Tagged successfully."
                            """
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
                        sh """
                            echo "Re-authenticating to ECR..."
                            aws ecr get-login-password --region ${AWS_REGION} \
                                | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        """

                        def services = ['auth', 'streaming', 'admin', 'chat', 'frontend']

                        for (String svc : services) {
                            sh """
                                echo "Pushing ${ECR_REGISTRY}/${svc}:${IMAGE_TAG} ..."
                                docker push ${ECR_REGISTRY}/${svc}:${IMAGE_TAG}
                                echo "Successfully pushed ${svc}"
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
                # Remove compose-built images (both v1 and v2 naming conventions)
                docker rmi ${COMPOSE_PROJECT}-auth      || true
                docker rmi ${COMPOSE_PROJECT}-streaming || true
                docker rmi ${COMPOSE_PROJECT}-admin     || true
                docker rmi ${COMPOSE_PROJECT}-chat      || true
                docker rmi ${COMPOSE_PROJECT}-frontend  || true
                docker rmi ${COMPOSE_PROJECT}_auth      || true
                docker rmi ${COMPOSE_PROJECT}_streaming || true
                docker rmi ${COMPOSE_PROJECT}_admin     || true
                docker rmi ${COMPOSE_PROJECT}_chat      || true
                docker rmi ${COMPOSE_PROJECT}_frontend  || true

                # Remove ECR-tagged images
                docker rmi ${ECR_REGISTRY}/auth:${IMAGE_TAG}      || true
                docker rmi ${ECR_REGISTRY}/streaming:${IMAGE_TAG} || true
                docker rmi ${ECR_REGISTRY}/admin:${IMAGE_TAG}     || true
                docker rmi ${ECR_REGISTRY}/chat:${IMAGE_TAG}      || true
                docker rmi ${ECR_REGISTRY}/frontend:${IMAGE_TAG}  || true

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

                    Image Tag    : ${env.IMAGE_TAG}
                    ECR Registry : ${env.ECR_REGISTRY}
                    Services     : auth, streaming, admin, chat, frontend

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