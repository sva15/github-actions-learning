# Chapter 12: Working with Variables at Different Levels

## 🎯 Phase 1: Core Explanation

### The Inheritance Analogy
Think of variables in GitHub Actions like **CSS styling** or **family inheritance**:

| Level | CSS Analogy | GitHub Actions | Scope |
|-------|------------|----------------|-------|
| **Global** | `*{...}` (universal) | Workflow-level `env:` | All jobs, all steps |
| **Parent** | `.container{...}` | Job-level `env:` | All steps in that job |
| **Child** | `.button{...}` | Step-level `env:` | Only that specific step |

**Precedence rule:** More specific levels override less specific ones (Step > Job > Workflow).

### One-Sentence Definition
**Variables in GitHub Actions can be defined at workflow, job, or step level using the `env:` key, with more specific scopes overriding broader ones, enabling configuration management and reducing duplication across your CI/CD pipeline.**

### Why Variable Levels Matter

**Without proper variable scoping:**
- ❌ Repeat values in every step (error-prone)
- ❌ Can't customize per-job or per-step
- ❌ Hard to maintain and update

**With proper scoping:**
- ✅ Define once, use everywhere
- ✅ Override when needed
- ✅ Clear configuration hierarchy

### 💡 Production Insight

**Fact 1:** Most teams overuse workflow-level variables. Job-level variables are better for job-specific configuration.

**Fact 2:** Environment variables set with `GITHUB_ENV` persist across steps but NOT across jobs.

**Fact 3:** Secrets should ALWAYS be passed as `env:` variables, never directly in`run:` commands (security!).

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Workflow-Level Variables

```yaml
name: Workflow Variables

on: push

# Available to ALL jobs
env:
  APP_NAME: "MyApp"
  API_URL: "https://api.example.com"
  BUILD_ENV: "production"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building $APP_NAME"
      - run: echo "API: $API_URL"
      - run: echo "Environment: $BUILD_ENV"
  
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing $APP_NAME"
      - run: echo "Still accessible: $API_URL"
```

### Pattern 2: Job-Level Variables

```yaml
jobs:
  build-frontend:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
      BUILD_PATH: ./frontend/dist
    steps:
      - run: echo "Frontend env: $NODE_ENV"
      - run: echo "Build path: $BUILD_PATH"
  
  build-backend:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: development
      BUILD_PATH: ./backend/build
    steps:
      - run: echo "Backend env: $NODE_ENV"
      - run: echo "Different path: $BUILD_PATH"
```

### Pattern 3: Step-Level Variables

```yaml
steps:
  - name: Step with specific variables
    env:
      STEP_VAR: "only-in-this-step"
      LOG_LEVEL: "debug"
    run: |
      echo "Step variable: $STEP_VAR"
      echo "Log level: $LOG_LEVEL"
  
  - name: Next step
    run: echo "$STEP_VAR"  # ❌ NOT available here!
```

### Pattern 4: Variable Precedence (Override)

```yaml
env:
  MY_VAR: "workflow"
  SHARED: "workflow-value"

jobs:
  demo:
    env:
      MY_VAR: "job"  # Overrides workflow-level
    runs-on: ubuntu-latest
    steps:
      - run: echo "$MY_VAR"  # → "job"
      - run: echo "$SHARED"  # → "workflow-value"
      
      - env:
          MY_VAR: "step"  # Overrides job-level
        run: echo "$MY_VAR"  # → "step"
      
      - run: echo "$MY_VAR"  # → "job" (back to job-level)
```

### Pattern 5: Dynamic Variables (GITHUB_ENV)

```yaml
steps:
  - name: Set environment variable for later steps
    run: |
      VERSION="v$(date +%Y%m%d)-${{ github.run_number }}"
      echo "VERSION=$VERSION" >> $GITHUB_ENV
      echo "Set version to: $VERSION"
  
  - name: Use the variable
    run: echo "Deploying version: $VERSION"
  
  - name: Still available
    run: echo "Version is still: $VERSION"
```

**Important:** `GITHUB_ENV` variables persist within the SAME JOB only, not across jobs!

### Pattern 6: Multiline Values

```yaml
steps:
  - name: Set multiline variable
    run: |
      {
        echo "CONFIG<<EOF"
        echo "line1=value1"
        echo "line2=value2"
        echo "line3=value3"
        echo "EOF"
      } >> $GITHUB_ENV
  
  - name: Use multiline variable
    run: echo "$CONFIG"
```

### Pattern 7: Using Context Variables

```yaml
env:
  # GitHub context
  REPO_NAME: ${{ github.repository }}
  BRANCH: ${{ github.ref_name }}
  ACTOR: ${{ github.actor }}
  
  # Computed values
  IS_MAIN: ${{ github.ref == 'refs/heads/main' }}
  SHORT_SHA: ${{ github.sha }}

jobs:
  info:
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Repository: $REPO_NAME"
          echo "Branch: $BRANCH"
          echo "Triggered by: $ACTOR"
          echo "Is main branch: $IS_MAIN"
```

---

## 🎯 Practice Exercises

### Exercise 1: Variable Levels
**Task:** Create a workflow demonstrating:
- Workflow variable `GLOBAL="workflow"`
- Job variable `GLOBAL="job"`
- Step variable `GLOBAL="step"`
- Show which value wins at each level

<details>
<summary>Solution</summary>

```yaml
name: Variable Precedence

on: push

env:
  GLOBAL: "workflow"

jobs:
  demo:
    env:
      GLOBAL: "job"
    runs-on: ubuntu-latest
    steps:
      - name: Show job-level
        run: echo "Value: $GLOBAL"  # → "job"
      
      - name: Show step-level override
        env:
          GLOBAL: "step"
        run: echo "Value: $GLOBAL"  # → "step"
      
      - name: Back to job-level
        run: echo "Value: $GLOBAL"  # → "job"
```
</details>

### Exercise 2: Dynamic Variables
**Task:** Create workflow that:
- Generates a version number dynamically
- Sets it as an environment variable
- Uses it in multiple subsequent steps

<details>
<summary>Solution</summary>

```yaml
name: Dynamic Version

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Generate version
        run: |
          VERSION="$(date +%Y.%m.%d)-build-${{ github.run_number }}"
          echo "VERSION=$VERSION" >> $GITHUB_ENV
          echo "Generated version: $VERSION"
      
      - name: Use in build
        run: echo "Building version $VERSION..."
      
      - name: Use in tag
        run: echo "Tagging as $VERSION"
```
</details>

---

## 🎓 Pro-Tips & Best Practices

### ⚡ Performance & Organization

**Best Practice: Group Related Variables**
```yaml
env:
  # Build configuration
  NODE_VERSION: '20'
  BUILD_PATH: './dist'
  
  # API endpoints
  API_URL: 'https://api.example.com'
  AUTH_URL: 'https://auth.example.com'
  
  # Feature flags
  ENABLE_ANALYTICS: 'true'
  DEBUG_MODE: 'false'
```

### 🔒 Security

**Never expose secrets in environment variable names:**
```yaml
# ❌ DANGEROUS
env:
  API_KEY: ${{ secrets.API_KEY }}
steps:
  - run: echo "Using key $API_KEY"  # Logs the secret!

# ✅ SAFE
steps:
  - env:
      API_KEY: ${{ secrets.API_KEY }}
    run: |
      curl -H "Authorization: Bearer $API_KEY" https://api.example.com
      # Secret is used but not logged
```

### 🎯 Common Patterns

**Pattern: Environment-Specific Configuration**
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      API_URL: ${{ github.ref == 'refs/heads/main' && 'https://api.production.com' || 'https://api.staging.com' }}
      DEPLOY_ENV: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    steps:
      - run: echo "Deploying to $DEPLOY_ENV at $API_URL"
```

---

## 📚 Complete Reference

### Variable Syntax

```yaml
# Workflow level
env:
  VAR1: value
  VAR2: ${{ expression }}

jobs:
  job-name:
    # Job level
    env:
      VAR3: value
    
    steps:
      # Step level
      - env:
          VAR4: value
        run: command
```

### Available Contexts for Variables

| Context | Example | Description |
|---------|---------|-------------|
| `github` | `${{ github.repository }}` | GitHub event data |
| `env` | `${{ env.MY_VAR }}` | Environment variables |
| `job` | `${{ job.status }}` | Current job info |
| `steps` | `${{ steps.step-id.outputs.value }}` | Step outputs |
| `runner` | `${{ runner.os }}` | Runner information |
| `secrets` | `${{ secrets.TOKEN }}` | Repository secrets |
| `needs` | `${{ needs.job-id.outputs.value }}` | Dependent job outputs |

### GITHUB_ENV Syntax

```bash
# Single value
echo "VAR_NAME=value" >> $GITHUB_ENV

# With shell variable
echo "VAR_NAME=$MY_VALUE" >> $GITHUB_ENV

# Multiline value
{
  echo "VAR_NAME<<EOF"
  echo "line 1"
  echo "line 2"
  echo "EOF"
} >> $GITHUB_ENV
```

---

## 🎯 Knowledge Check

- [ ] Understand three variable levels and precedence
- [ ] Know how to use GITHUB_ENV for dynamic variables
- [ ] Understand context variables
- [ ] Can use secrets safely in env variables
- [ ] Know multiline variable syntax

---

**Next Chapter:** [Chapter 13 - Working with Repository Level Secrets](chapter-13-secrets.md)

**Coming Up:** Comprehensive guide to secrets management, environment protection, and security best practices.
