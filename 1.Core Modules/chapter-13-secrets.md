# Chapter 13: Working with Repository Level Secrets

## 🎯 Phase 1: Core Explanation

### The Safe Deposit Box Analogy
Think of GitHub Secrets like a **bank's safe deposit box system**:

| Concept | Bank Safe Deposit Box | GitHub Secrets |
|---------|----------------------|----------------|
| **Storage** | Secure vault | Encrypted GitHub storage |
| **Access** | Only authorized with key | Only accessible in workflows |
| **Visibility** | Contents hidden from bank staff | Never visible in logs (automatically masked) |
| **Compartments** | Personal box, shared box | Repository, environment, organization secrets |
| **Audit** | Entry logs | Audit logs for secret access |

### One-Sentence Definition
**GitHub Secrets are encrypted environment variables stored securely in GitHub that allow workflows to access sensitive data (API keys, passwords, tokens) without exposing them in code or logs, with automatic masking in workflow output.**

### Why Secrets Are Critical

**Without secrets:**
- ❌ Hardcode API keys in code (MAJOR security risk!)
- ❌ Keys visible in version control history
- ❌ Keys exposed in public repositories
- ❌ Difficult to rotate credentials

**With secrets:**
- ✅ Sensitive data encrypted at rest
- ✅ Never committed to repository
- ✅ Automatically masked in logs
- ✅ Easy to rotate without code changes

### 💡 Production Reality

**Fact 1:** Secrets are **one-way encrypted**. Once you set a secret, you can NEVER view its value again (only update or delete).

**Fact 2:** GitHub automatically scans for known secret patterns (AWS keys, tokens) and will **revoke them** if accidentally committed.

**Fact 3:** The automatic `GITHUB_TOKEN` has **limited permissions by default**. Many teams don't realize they need to explicitly grant it permissions for certain operations.

**Fact 4:** I've seen teams waste days debugging "permission denied" errors, only to discover they forgot to add a secret to their repository!

---

## 🛠️ Phase 2: Implementation Drill

### Creating Secrets

**Via GitHub UI:**
1. Navigate to repository → Settings
2. Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `API_KEY`, Value: `your-secret-value-here`
5. Click "Add secret"

**Secret naming rules:**
- Can't start with `GITHUB_`
- Can't start with a number
- Must be uppercase with underscores: `MY_SECRET_KEY`
- Case-sensitive

### Basic Secret Usage

```yaml
name: Using Secrets

on: push

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy with API key
        env:
          API_KEY: ${{ secrets.API_KEY }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        run: |
          echo "Deploying application..."
          # Secrets are available as environment variables
          curl -H "Authorization: Bearer $API_KEY" https://api.example.com/deploy
```

**What happens:**
- `${{ secrets.API_KEY }}` retrieves the encrypted secret
- Passed as environment variable `API_KEY` to the step
- Automatically **masked** in logs (shows `***` instead of value)

### Automatic GITHUB_TOKEN

Every workflow run automatically has access to a special `GITHUB_TOKEN`:

```yaml
jobs:
  auto-comment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Comment on issue
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh issue comment ${{ github.event.issue.number }} \
            --body "Thanks for reporting this issue!"
```

**GITHUB_TOKEN capabilities:**
- Read/write repository content
- Create issues and PRs
- Comment on issues/PRs
- Access to repository packages
- **Expires** at the end of the workflow run (auto-rotated)

### Configuring GITHUB_TOKEN Permissions

```yaml
# Workflow-level permissions
permissions:
  contents: read      # Can read repository
  issues: write       # Can create/modify issues
  pull-requests: write  # Can create/modify PRs
  packages: read      # Can read packages

jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.name,
              body: '✅ Automated comment from workflow'
            })
```

**Available permissions:**
- `actions`, `checks`, `contents`, `deployments`, `issues`, `packages`, `pull-requests`, `repository-projects`, `security-events`, `statuses`

**Permission levels:** `read`, `write`, `none`

### Environment-Specific Secrets

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging  # Uses secrets from "staging" environment
    steps:
      - name: Deploy to staging
        env:
          API_URL: ${{ secrets.API_URL }}      # staging API_URL
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}  # staging DEPLOY_KEY
        run: ./deploy.sh
  
  deploy-production:
    runs-on: ubuntu-latest
    environment: production  # Uses secrets from "production" environment
    steps:
      - name: Deploy to production
        env:
          API_URL: ${{ secrets.API_URL }}      # production API_URL (different!)
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}  # production DEPLOY_KEY
        run: ./deploy.sh
```

**Setting environment secrets:**
1. Settings → Environments → Create environment
2. Add environment protection rules (optional)
3. Add environment secrets

**Benefits:**
- Same secret name, different values per environment
- Environment protection (require approval before deployment)
- Separate staging/production credentials

### Using Secrets in Actions

```yaml
- name: Deploy to AWS
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1

- name: Push to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

### Organization-Level Secrets

For multiple repositories:

**Setting organization secrets:**
1. Organization Settings → Secrets and variables → Actions
2. New organization secret
3. Choose repository access: All repos, Private repos, or Selected repos

**Usage in workflow (same syntax):**
```yaml
env:
  ORG_SECRET: ${{ secrets.ORG_SECRET }}
```

**Precedence:** Repository secrets override organization secrets (if same name).

---

## 🎯 Practice Exercises

### Exercise 1: Basic Secret Usage
**Task:** Create a workflow that:
1. Uses a secret called `MESSAGE`
2. Prints "Secret message received" (NOT the secret value)
3. Creates a file with the secret content
4. Verifies file was created

<details>
<summary>Solution</summary>

**First, create secret via UI:**
- Name: `MESSAGE`
- Value: `Hello from secrets!`

**Workflow:**
```yaml
name: Secret Usage

on: workflow_dispatch

jobs:
  use-secret:
    runs-on: ubuntu-latest
    steps:
      - name: Confirm secret received
        env:
          MESSAGE: ${{ secrets.MESSAGE }}
        run: |
          if [ -n "$MESSAGE" ]; then
            echo "✅ Secret message received"
          else
            echo "❌ Secret not found"
            exit 1
          fi
      
      - name: Create file with secret
        env:
          MESSAGE: ${{ secrets.MESSAGE }}
        run: echo "$MESSAGE" > message.txt
      
      - name: Verify file
        run: |
          if [ -f message.txt ]; then
            echo "✅ File created successfully"
            echo "File size: $(wc -c < message.txt) bytes"
          fi
```
</details>

### Exercise 2: Multi-Environment Deployment
**Task:** Create:
1. Two environments: `staging` and `production`
2. Add environment-specific `API_URL` secrets
3. Workflow that deploys to both (sequentially)
4. Shows which URL is being used

<details>
<summary>Solution</summary>

**Setup environments and secrets via UI:**
- Environment: `staging`, Secret: `API_URL=https://api.staging.example.com`
- Environment: `production`, Secret: `API_URL=https://api.production.example.com`

**Workflow:**
```yaml
name: Multi-Environment Deploy

on: workflow_dispatch

jobs:
  deploy-staging:
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        env:
          API_URL: ${{ secrets.API_URL }}
        run: |
          echo "🚀 Deploying to STAGING"
          echo "API URL: $API_URL"
          echo "Deployment complete!"
  
  deploy-production:
    needs: deploy-staging
    environment: production
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        env:
          API_URL: ${{ secrets.API_URL }}
        run: |
          echo "🚀 Deploying to PRODUCTION"
          echo "API URL: $API_URL"
          echo "Deployment complete!"
```
</details>

### Exercise 3: Using GITHUB_TOKEN
**Task:** Create workflow that:
1. Creates an issue comment using GITHUB_TOKEN
2. Uses GitHub CLI (`gh`)
3. Comments "Automated test comment"

<details>
<summary>Solution</summary>

```yaml
name: Auto Comment

on:
  issues:
    types: [opened]

jobs:
  comment:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: Comment on issue
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh issue comment ${{ github.event.issue.number }} \
            --repo ${{ github.repository }} \
            --body "👋 Thanks for opening this issue! Automated test comment."
```
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Advanced Challenge: Secure Multi-Stage Deployment

**Requirements:**
Create a complete deployment pipeline that:
1. Has secrets for `DB_PASSWORD`, `API_KEY`, `DEPLOY_TOKEN`
2. Uses environment protection for production (manual approval)
3. Validates secrets exist before deploying
4. Different behavior for staging vs production
5. Uses GITHUB_TOKEN to create deployment status
6. Handles missing secrets gracefully

**Difficulty:** ⭐⭐⭐⭐⭐ (Expert)

<details>
<summary>Solution</summary>

**Setup:**
- Create secrets: `DB_PASSWORD`, `API_KEY`, `DEPLOY_TOKEN`
- Create environments: `staging` (no protection), `production` (require approval)
- Add secrets to both environments

**Workflow:**
```yaml
name: Secure Deployment Pipeline

on:
  push:
    branches: [main, develop]

jobs:
  validate:
    name: Validate Secrets
    runs-on: ubuntu-latest
    outputs:
      secrets-valid: ${{ steps.check.outputs.valid }}
    steps:
      - name: Check required secrets
        id: check
        env:
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          API_KEY: ${{ secrets.API_KEY }}
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: |
          VALID=true
          
          if [ -z "$DB_PASSWORD" ]; then
            echo "❌ DB_PASSWORD secret not set"
            VALID=false
          fi
          
          if [ -z "$API_KEY" ]; then
            echo "❌ API_KEY secret not set"
            VALID=false
          fi
          
          if [ -z "$DEPLOY_TOKEN" ]; then
            echo "❌ DEPLOY_TOKEN secret not set"
            VALID=false
          fi
          
          if [ "$VALID" = "true" ]; then
            echo "✅ All secrets validated"
          else
            echo "::error::Required secrets are missing"
            exit 1
          fi
          
          echo "valid=$VALID" >> $GITHUB_OUTPUT
  
  deploy-staging:
    name: Deploy to Staging
    needs: validate
    if: github.ref == 'refs/heads/develop'
    environment: staging
    runs-on: ubuntu-latest
    permissions:
      deployments: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Create deployment status
        uses: actions/github-script@v7
        with:
          script: |
            const deployment = await github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.name,
              ref: context.sha,
              environment: 'staging',
              auto_merge: false
            });
      
      - name: Deploy application
        env:
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          API_KEY: ${{ secrets.API_KEY }}
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: |
          echo "🚀 Deploying to STAGING"
          echo "Connecting to database..."
          echo "Authenticating with API..."
          echo "Using deployment token for authorization..."
          echo "✅ Deployment to staging complete!"
  
  deploy-production:
    name: Deploy to Production
    needs: validate
    if: github.ref == 'refs/heads/main'
    environment: production  # Requires manual approval
    runs-on: ubuntu-latest
    permissions:
      deployments: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Create deployment status
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.name,
              ref: context.sha,
              environment: 'production',
              auto_merge: false
            });
      
      - name: Pre-deployment health check
        env:
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          echo "Running pre-deployment checks..."
          echo "Verifying API connectivity..."
          echo "✅ Health checks passed"
      
      - name: Deploy application
        env:
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          API_KEY: ${{ secrets.API_KEY }}
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: |
          echo "🚀 Deploying to PRODUCTION"
          echo "Production deployment initiated..."
          echo "Database migration started..."
          echo "Application deployment in progress..."
          echo "✅ Production deployment complete!"
      
      - name: Post-deployment verification
        env:
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          echo "Running post-deployment tests..."
          echo "Verifying application health..."
          echo "✅ All systems operational"
```

**Code Review:**

✅ **Excellent aspects:**
- Secret validation before deployment
- Environment-specific deployments
- Manual approval gate for production
- Deployment status tracking
- Health checks
- Clear separation of concerns

⚠️ **Production enhancements:**
- Add actual API health check calls
- Implement rollback mechanism
- Add Slack/email notifications
- Store deployment artifacts
- Add metrics collection

</details>

---

## 🎓 Phase 4: Pro-Tips & Gotchas

### 🚨 Common Mistakes

#### Mistake 1: Exposing Secrets in Logs

```yaml
# ❌ DANGEROUS - Logs the secret!
- run: echo "API Key is: ${{ secrets.API_KEY }}"

# ❌ ALSO DANGEROUS
- env:
    API_KEY: ${{ secrets.API_KEY }}
  run: echo "Using key: $API_KEY"

# ✅ SAFE - Use without logging
- env:
    API_KEY: ${{ secrets.API_KEY }}
  run: curl -H "Authorization: Bearer $API_KEY" https://api.com
```

**Note:** While GitHub auto-masks secrets, it's not perfect. Never intentionally echo them.

#### Mistake 2: Forgetting to Set Permissions for GITHUB_TOKEN

```yaml
# ❌ FAILS - No write permission
jobs:
  create-issue:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({...})  # Permission denied!

# ✅ WORKS - Explicit permissions
jobs:
  create-issue:
    permissions:
      issues: write
    runs-on: ubuntu-latest
    steps: [...]
```

#### Mistake 3: Hardcoding Secrets in Conditional

```yaml
# ❌ BAD - Secret in workflow file
if: github.ref == 'refs/heads/main' && secrets.DEPLOY_KEY == 'prod-key-123'

# ✅ GOOD - Check existence, not value
if: github.ref == 'refs/heads/main' && secrets.DEPLOY_KEY != ''
```

#### Mistake 4: Not Using Environment Secrets

```yaml
# ❌ CONFUSING - Same secret name, one value
jobs:
  deploy-staging:
    env:
      API_URL: ${{ secrets.STAGING_API_URL }}  # Different secret names
  deploy-production:
    env:
      API_URL: ${{ secrets.PRODUCTION_API_URL }}

# ✅ CLEAR - Environment-specific secrets
jobs:
  deploy-staging:
    environment: staging
    env:
      API_URL: ${{ secrets.API_URL }}  # staging value
  deploy-production:
    environment: production
    env:
      API_URL: ${{ secrets.API_URL }}  # production value
```

### 🔒 Security Best Practices

#### Practice 1: Principle of Least Privilege

```yaml
# ✅ Minimal permissions
permissions:
  contents: read
  pull-requests: write

# ❌ Excessive permissions
permissions: write-all
```

#### Practice 2: Rotate Secrets Regularly

**Set reminders:**
- API keys: Every 90 days
- Passwords: Every 60 days
- Tokens: Every 30 days

**Process:**
1. Generate new credential
2. Add as new secret
3. Test workflow
4. Remove old secret

#### Practice 3: Use Short-Lived Tokens

```yaml
# ✅ GOOD - Token expires after workflow
- env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# ⚠️ RISKY - Long-lived PAT
- env:
    PAT: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
```

#### Practice 4: Audit Secret Access

Check audit logs regularly:
- Settings → Security → Audit log
- Filter: `action:repo_secret.access`

### ⚡ Performance & Organization

**Naming convention:**
```
# Good naming
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DATABASE_URL_PRODUCTION
API_KEY_STAGING

# Bad naming
key1
secret
mypassword
```

**Documentation pattern:**
Create `SECRETS.md` in repository:
```markdown
# Required Secrets

## Repository Secrets
- `API_KEY`: Production API key from vendor.com
- `DB_PASSWORD`: Database password for RDS instance

## Environment Secrets

### Staging
- `API_URL`: https://api.staging.example.com
- `DEPLOY_KEY`: Deployment key from AWS

### Production
- `API_URL`: https://api.production.example.com
- `DEPLOY_KEY`: Deployment key from AWS (different from staging)
```

### 🏆 Advanced Patterns

#### Pattern 1: Conditional Secret Usage

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy with optional secret
        env:
          OPTIONAL_KEY: ${{ secrets.OPTIONAL_API_KEY }}
        run: |
          if [ -n "$OPTIONAL_KEY" ]; then
            echo "Using optional API key"
            curl -H "X-API-Key: $OPTIONAL_KEY" https://api.com
          else
            echo "Proceeding without optional API key"
          fi
```

#### Pattern 2: Secret Validation Script

```yaml
- name: Validate all secrets
  env:
    REQUIRED_SECRETS: "API_KEY DB_PASSWORD DEPLOY_TOKEN"
  run: |
    #!/bin/bash
    set -e
    
    MISSING=()
    
    for secret in $REQUIRED_SECRETS; do
      if [ -z "${!secret}" ]; then
        MISSING+=("$secret")
      fi
    done
    
    if [ ${#MISSING[@]} -gt 0 ]; then
      echo "❌ Missing secrets: ${MISSING[*]}"
      exit 1
    fi
    
    echo "✅ All required secrets present"
```

#### Pattern 3: Dynamic Secret Selection

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Select environment-specific secret
        env:
          STAGING_URL: ${{ secrets.STAGING_API_URL }}
          PRODUCTION_URL: ${{ secrets.PRODUCTION_API_URL }}
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            API_URL="$PRODUCTION_URL"
          else
            API_URL="$STAGING_URL"
          fi
          
          echo "Using API URL: $API_URL"
          # Use $API_URL for deployment
```

---

## 📚 Complete Reference

### Secret Syntax

```yaml
# Access secret
${{ secrets.SECRET_NAME }}

# In environment variable
env:
  VAR: ${{ secrets.SECRET_NAME }}

# In action input
with:
  api-key: ${{ secrets.API_KEY }}

# Check if secret exists
if: secrets.SECRET_NAME != ''
```

### GITHUB_TOKEN Permissions

```yaml
permissions:
  actions: read|write|none
  checks: read|write|none
  contents: read|write|none
  deployments: read|write|none
  issues: read|write|none
  packages: read|write|none
  pull-requests: read|write|none
  repository-projects: read|write|none
  security-events: read|write|none
  statuses: read|write|none
```

### Secret Limits

| Limit | Value |
|-------|-------|
| Secrets per repository | 100 |
| Secrets per organization | 1,000 |
| Secrets per environment | 100 |
| Secret name length | 255 characters |
| Secret value size | 64 KB |

---

## 🎯 Knowledge Check

- [ ] Understand how to create and use secrets
- [ ] Know difference between repository, environment, and organization secrets
- [ ] Can configure GITHUB_TOKEN permissions
- [ ] Understand secret masking in logs
- [ ] Know security best practices for secrets
- [ ] Can validate secret existence in workflows

### Quick Self-Test

<details>
<summary>1. What happens if you echo a secret in a workflow?</summary>

**Answer:** GitHub automatically masks the secret value in logs (shows `***`), but it's still a security risk and should be avoided.
</details>

<details>
<summary>2. How do environment secrets differ from repository secrets?</summary>

**Answer:** Environment secrets are scoped to specific environments (staging, production) and can have different values with the same name. They can also have protection rules requiring manual approval.
</details>

<details>
<summary>3. What's special about GITHUB_TOKEN?</summary>

**Answer:** It's automatically created for each workflow run, expires after the run, and has repository-scoped permissions. You don't need to create it manually.
</details>

---

**Next Chapter:** [Chapter 14 - Lab: Exploring Workflow Syntax Part 1](chapter-14-lab-syntax-1.md)

**Coming Up:** Hands-on lab exercises combining workflows, jobs, variables, and secrets into complete CI/CD pipelines with debugging practice.
