# Chapter 27: Configure Workflows for Webhook Events

## 🎯 Phase 1: Core Explanation

### The Smart Doorbell Analogy
Think of repository_dispatch like a **smart doorbell with custom signals**:

| Doorbell System | repository_dispatch |
|-----------------|---------------------|
| **Ring doorbell** | Send webhook to GitHub |
| **Custom chime** | Custom event type |
| **Delivery note** | Client payload data |
| **Smart response** | Workflow triggered |
| **Multiple chimes** | Multiple event types |

### One-Sentence Definition
**repository_dispatch is a webhook event that enables external systems to trigger GitHub Actions workflows via API calls, passing custom event types and payload data for integration with CI/CD pipelines, external build systems, and third-party services.**

### Why External Triggers Matter

**Without repository_dispatch:**
- ❌ Can't trigger from external systems
- ❌ No integration with non-GitHub tools
- ❌ Limited to GitHub events only
- ❌ Can't pass custom data

**With repository_dispatch:**
- ✅ Trigger from any external system
- ✅ Integrate with Jenkins, GitLab, etc.
- ✅ Custom event types and payloads
- ✅ Microservice orchestration

### 💡 Production Reality

**Fact 1:** Many teams use repository_dispatch to bridge GitHub Actions with legacy CI systems during migration.

**Fact 2:** It's commonly used for multi-repo workflows where one repo's build triggers actions in another.

**Fact 3:** The client_payload can contain ANY JSON data - perfect for passing build artifacts, test results, or deployment info.

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Basic repository_dispatch

**Workflow:**
```yaml
name: External Trigger

on:
  repository_dispatch:
    types: [deploy-command]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Triggered by external webhook"
          echo "Event type: ${{ github.event.action }}"
          echo "Payload: ${{ toJSON(github.event.client_payload) }}"
```

**Trigger via curl:**
```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/dispatches \
  -d '{
    "event_type": "deploy-command"
  }'
```

### Pattern 2: Multiple Event Types

```yaml
on:
  repository_dispatch:
    types:
      - deploy-staging
      - deploy-production
      - run-tests
      - build-docker

jobs:
  handle-event:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        if: github.event.action == 'deploy-staging'
        run: ./deploy-staging.sh
      
      - name: Deploy to production
        if: github.event.action == 'deploy-production'
        run: ./deploy-production.sh
      
      - name: Run tests
        if: github.event.action == 'run-tests'
        run: npm test
      
      - name: Build Docker image
        if: github.event.action == 'build-docker'
        run: docker build -t myapp .
```

### Pattern 3: Using Client Payload

**Workflow:**
```yaml
on:
  repository_dispatch:
    types: [build-complete]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Extract payload data
        run: |
          echo "Build ID: ${{ github.event.client_payload.build_id }}"
          echo "Version: ${{ github.event.client_payload.version }}"
          echo "Artifact URL: ${{ github.event.client_payload.artifact_url }}"
          echo "Environment: ${{ github.event.client_payload.environment }}"
      
      - name: Download artifact
        run: |
          curl -L -o build.zip "${{ github.event.client_payload.artifact_url }}"
          unzip build.zip
      
      - name: Deploy
        env:
          VERSION: ${{ github.event.client_payload.version }}
          BUILD_ID: ${{ github.event.client_payload.build_id }}
        run: ./deploy.sh
```

**Trigger with payload:**
```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/dispatches \
  -d '{
    "event_type": "build-complete",
    "client_payload": {
      "build_id": "12345",
      "version": "v1.2.3",
      "artifact_url": "https://builds.example.com/app-v1.2.3.zip",
      "environment": "production"
    }
  }'
```

### Pattern 4: Integration with External CI System

**Scenario:** Jenkins build triggers GitHub Actions deployment

**Jenkins Pipeline (Jenkinsfile):**
```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package'
            }
        }
        stage('Trigger GitHub Deployment') {
            steps {
                script {
                    def payload = """
                    {
                        "event_type": "jenkins-build-complete",
                        "client_payload": {
                            "build_number": "${env.BUILD_NUMBER}",
                            "build_url": "${env.BUILD_URL}",
                            "artifact_path": "target/myapp.jar",
                            "commit_sha": "${env.GIT_COMMIT}"
                        }
                    }
                    """
                    
                    sh """
                        curl -X POST \
                          -H 'Authorization: Bearer ${GITHUB_TOKEN}' \
                          -H 'Accept: application/vnd.github+json' \
                          https://api.github.com/repos/myorg/myrepo/dispatches \
                          -d '${payload}'
                    """
                }
            }
        }
    }
}
```

**GitHub Actions Workflow:**
```yaml
name: Jenkins Deployment

on:
  repository_dispatch:
    types: [jenkins-build-complete]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Log Jenkins build info
        run: |
          echo "Jenkins Build: ${{ github.event.client_payload.build_number }}"
          echo "Build URL: ${{ github.event.client_payload.build_url }}"
          echo "Commit: ${{ github.event.client_payload.commit_sha }}"
      
      - name: Download Jenkins artifact
        run: |
          # Download from Jenkins
          curl -u $JENKINS_USER:$JENKINS_TOKEN \
            "${{ github.event.client_payload.build_url }}/artifact/${{ github.event.client_payload.artifact_path }}" \
            -o app.jar
      
      - name: Deploy to Kubernetes
        run: kubectl apply -f deployment.yaml
```

### Pattern 5: Cross-Repository Triggers

**Repo A triggers workflow in Repo B:**

**Repo A Workflow:**
```yaml
name: Build and Notify

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
      
      - name: Trigger deployment in Repo B
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.REPO_B_DISPATCH_TOKEN }}" \
            -H "Accept: application/vnd.github+json" \
            https://api.github.com/repos/myorg/repo-b/dispatches \
            -d '{
              "event_type": "deploy-frontend",
              "client_payload": {
                "source_repo": "${{ github.repository }}",
                "commit_sha": "${{ github.sha }}",
                "actor": "${{ github.actor }}"
              }
            }'
```

**Repo B Workflow:**
```yaml
name: Deploy Frontend

on:
  repository_dispatch:
    types: [deploy-frontend]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Triggered by: ${{ github.event.client_payload.source_repo }}"
          echo "Commit: ${{ github.event.client_payload.commit_sha }}"
          echo "User: ${{ github.event.client_payload.actor }}"
      
      - name: Deploy
        run: ./deploy-frontend.sh
```

### Pattern 6:  Using GitHub CLI

```bash
# Simpler syntax with gh CLI
gh api repos/OWNER/REPO/dispatches \
  --method POST \
  --field event_type='deploy' \
  --raw-field client_payload='{"version":"v1.2.3","env":"production"}'
```

### Pattern 7: Validation and Error Handling

```yaml
on:
  repository_dispatch:
    types: [external-deploy]

jobs:
  validate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Validate payload
        run: |
          # Check required fields
          if [ -z "${{ github.event.client_payload.version }}" ]; then
            echo "::error::Missing required field: version"
            exit 1
          fi
          
          if [ -z "${{ github.event.client_payload.environment }}" ]; then
            echo "::error::Missing required field: environment"
            exit 1
          fi
          
          # Validate environment
          ENV="${{ github.event.client_payload.environment }}"
          if [[ ! "$ENV" =~ ^(dev|staging|production)$ ]]; then
            echo "::error::Invalid environment: $ENV"
            exit 1
          fi
          
          echo "✅ Payload validation passed"
      
      - name: Deploy
        run: |
          echo "Deploying ${{ github.event.client_payload.version }}"
          echo "To: ${{ github.event.client_payload.environment }}"
```

---

## 🎯 Practice Exercises

### Exercise 1: Basic Webhook
**Task:** Create workflow triggered by repository_dispatch with event type "test-webhook".

<details>
<summary>Solution</summary>

```yaml
name: Webhook Test

on:
  repository_dispatch:
    types: [test-webhook]

jobs:
  respond:
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Webhook received!"
          echo "Event: ${{ github.event.action }}"
          echo "Payload: ${{ toJSON(github.event.client_payload) }}"
```

**Trigger:**
```bash
gh api repos/OWNER/REPO/dispatches \
  -X POST \
  -f event_type='test-webhook' \
  -f client_payload='{"message":"Hello from webhook"}'
```
</details>

### Exercise 2: Multi-Event Handler
**Task:** Handle three event types: deploy-dev, deploy-staging, deploy-prod.

<details>
<summary>Solution</summary>

```yaml
on:
  repository_dispatch:
    types: [deploy-dev, deploy-staging, deploy-prod]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - if: github.event.action == 'deploy-dev'
        run: echo "Deploying to DEV"
      
      - if: github.event.action == 'deploy-staging'
        run: echo "Deploying to STAGING"
      
      - if: github.event.action == 'deploy-prod'
        run: echo "Deploying to PRODUCTION"
```
</details>

---

## 🎓 Pro-Tips

### Security Considerations

```yaml
# ⚠️ Validate payload data - it's user-provided!
steps:
  - name: Sanitize inputs
    run: |
      # Never trust external data
      VERSION=$(echo "${{ github.event.client_payload.version }}" | sed 's/[^a-zA-Z0-9._-]//g')
      echo "Sanitized version: $VERSION"
```

### Rate Limits

- **Authenticated requests:** 5,000/hour
- **repository_dispatch calls count** against this limit
- Use responsibly in automated systems

### Best Practices

**1. Use Specific Event Types:**
```yaml
# ✅ GOOD - Specific, clear
types: [deploy-production, deploy-staging]

# ❌ BAD - Too generic
types: [trigger]
```

**2. Document Expected Payload:**
```yaml
# Add comment documenting payload structure
# Expected client_payload:
# {
#   "version": "string (required)",
#   "environment": "dev|staging|production (required)",
#   "artifact_url": "string (optional)"
# }
```

---

## 📚 Complete Reference

### Event Structure

```json
{
  "action": "event-type-name",
  "client_payload": {
    "custom_field_1": "value",
    "custom_field_2": 123,
    "nested": {
      "field": "value"
    }
  }
}
```

### API Call Reference

```bash
# Full curl command
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/dispatches \
  -d '{"event_type":"EVENT_TYPE","client_payload":{"key":"value"}}'

# With GitHub CLI
gh api repos/OWNER/REPO/dispatches \
  -X POST \
  -f event_type='EVENT_TYPE' \
  -f client_payload='{"key":"value"}'
```

---

## 🎯 Knowledge Check

- [ ] Understand repository_dispatch vs other events
- [ ] Can trigger workflows via API
- [ ] Know how to pass custom payload data
- [ ] Can handle multiple event types
- [ ] Understand security implications

---

**Next Chapter:** [Chapter 28 - Lab: Exploring Workflow Syntax Part 2](chapter-28-lab-syntax-2.md)

**Coming Up:** Final comprehensive lab combining all advanced concepts into production-ready pipelines.
