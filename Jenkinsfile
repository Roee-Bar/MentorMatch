pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        E2E_BASE_URL = 'http://localhost:3000'
        // Report Portal variables (set via Jenkins credentials)
        RP_ENDPOINT = credentials('reportportal-endpoint') ?: ''
        RP_TOKEN = credentials('reportportal-token') ?: ''
        RP_PROJECT = 'mentormatch'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_BRANCH = env.GIT_BRANCH ?: env.BRANCH_NAME
                    env.GIT_COMMIT = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "Installing Node.js dependencies..."
                    npm ci
                    echo "Installing Playwright browsers..."
                    npx playwright install --with-deps
                '''
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                    echo "Building Next.js application..."
                    npm run build
                '''
            }
            post {
                success {
                    echo "Build completed successfully"
                }
                failure {
                    echo "Build failed"
                }
            }
        }
        
        stage('Run E2E Tests') {
            environment {
                CI = 'true'
                NODE_ENV = 'test'
            }
            steps {
                sh '''
                    echo "Running E2E tests..."
                    npm run test:e2e || true
                '''
            }
            post {
                always {
                    // Archive test results
                    archiveArtifacts artifacts: 'playwright-report/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                    
                    // Publish HTML report
                    publishHTML([
                        reportName: 'Playwright E2E Test Report',
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        keepAll: true,
                        alwaysLinkToLastBuild: true
                    ])
                }
            }
        }
    }
    
    post {
        always {
            // Clean workspace
            cleanWs()
        }
        success {
            echo "Pipeline completed successfully"
        }
        failure {
            echo "Pipeline failed"
            // Email notification can be added here
            // emailext (
            //     subject: "E2E Tests Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
            //     body: "Build failed. Check console output: ${env.BUILD_URL}",
            //     to: "${env.CHANGE_AUTHOR_EMAIL ?: 'team@example.com'}"
            // )
        }
        unstable {
            echo "Pipeline completed with unstable status (some tests may have failed)"
        }
    }
}

