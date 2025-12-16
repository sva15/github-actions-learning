# Chapter 15: Triggering a Workflow

## 🎯 Phase 1: Core Explanation

### The Doorbell System Analogy
Think of workflow triggers like a **smart home doorbell system**:

| Type | Doorbell System | GitHub Actions | Example |
|------|----------------|----------------|---------|
| **Button press** | Someone presses doorbell | `push`, `pull_request` | Code pushed to repo |
| **Motion sensor** | Automatic trigger on movement | `schedule` (cron) | Daily at 2 AM |
| **Voice command** | "Alexa, ring doorbell" | `workflow_dispatch` | Manual trigger from UI |
| **Smart integration** | Package delivery detected | `repository_dispatch` | External webhook |
| **Selective ringing** | Only ring for specific visitors | Event filters (branches, paths) | Only on `main` branch |

### One-Sentence Definition
**Workflow triggers are event-based activators defined in the `on:` key that determine when and under what conditions a workflow executes, ranging from code changes (push, pull_request) to scheduled times (cron) to manual invocations (workflow_dispatch).**

### Why Trigger Configuration Matters

**Without proper triggers:**
- ❌ Workflows run unnecessarily (wasting runner minutes)
- ❌ Workflows miss important events
- ❌ Can't control when deployments happen
- ❌ No way to manually test workflows

**With proper triggers:**
- ✅ Workflows run exactly when needed
- ✅ Filter by branches, paths, tags
- ✅ Schedule maintenance tasks
- ✅ Manual control for deployments

### 💡 Production Reality

**Fact 1:** Poorly configured triggers are the #1 cause of wasted GitHub Actions minutes. I've seen teams burn through their free tier because workflows ran on EVERY push to ANY file.

**Fact 2:** The `pull_request` event has **different behavior** than `pull_request_target` — using the wrong one is a common security issue.

**Fact 3:** Scheduled workflows (`cron`) use UTC time, not local time. Teams forget this and schedule jobs at wrong hours!

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Push Event (Most Common)

```yaml
# Simple push trigger
on: push

# Push to specific branches
on:
  push:
    branches:
      - main
      - develop

# Push to branch patterns
on:
  push:
    branches:
      - 'releases/**'  # matches releases/v1, releases/v2/hotfix, etc.
      - '!releases/old/**'  # exclude old releases
```

### Pattern 2: Path Filters

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'src/**'           # Any file in src/
      - 'package.json'     # Specific file
      - '**.js'            # Any JS file
      - '!docs/**'         # Exclude docs folder
```

**Use case:** Only run tests when code changes, not when docs change.

```yaml
name: Run Tests

on:
  push:
    paths:
      - 'src/**'
      - 'tests/**'
      - 'package.json'
      - '!**.md'  # Ignore markdown files
```

### Pattern 3: Pull Request Events

```yaml
# PR opened, updated, or reopened
on: pull_request

# Specific PR activity types
on:
  pull_request:
    types:
      - opened
      - synchronize  # New commits pushed
      - reopened
      - ready_for_review

# PR to specific branches
on:
  pull_request:
    branches: [main]
```

**Important difference:**

```yaml
# ✅ SAFE: Runs in PR context (common use)
on: pull_request

# ⚠️ DANGEROUS: Runs in base branch context (can expose secrets)
on: pull_request_target
```

### Pattern 4: Tag Events

```yaml
# Any tag push
on:
  push:
    tags:
      - '*'

# Specific tag patterns
on:
  push:
    tags:
      - 'v*'          # v1.0, v2.0
      - 'v*.*.*'      # v1.2.3, v2.0.1
      - '!v*-beta'    # Exclude beta tags
```

**Release workflow example:**
```yaml
name: Release

on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'  # v1.2.3 format only

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create release
        run: echo "Releasing ${{ github.ref_name }}"
```

### Pattern 5: Scheduled Workflows (Cron)

```yaml
on:
  schedule:
    # Cron syntax: minute hour day month weekday
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

# Multiple schedules
on:
  schedule:
    - cron: '0 0 * * 1'   # Monday at midnight
    - cron: '0 12 * * 5'  # Friday at noon
```

**Common cron patterns:**
```yaml
'0 * * * *'     # Every hour
'0 */6 * * *'   # Every 6 hours
'0 0 * * *'     # Daily at midnight
'0 0 * * 0'     # Weekly on Sunday
'0 0 1 * *'     # Monthly on 1st
```

**Important:** Always use UTC time!

### Pattern 6: Manual Trigger (workflow_dispatch)

```yaml
on: workflow_dispatch

# With inputs
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
      
      version:
        description: 'Version to deploy'
        required: false
        type: string
      
      debug:
        description: 'Enable debug mode'
        required: false
        type: boolean
        default: false
```

**Using inputs in workflow:**
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: |
          echo "Deploying to: ${{ inputs.environment }}"
          echo "Version: ${{ inputs.version }}"
          echo "Debug mode: ${{ inputs.debug }}"
```

### Pattern 7: Multiple Triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly tests
  workflow_dispatch:      # Manual trigger
```

### Pattern 8: Issue and PR Comments

```yaml
on:
  issue_comment:
    types: [created]

jobs:
  respond:
    if: contains(github.event.comment.body, '/deploy')
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy command detected in comment"
```

### Pattern 9: External Triggers (repository_dispatch)

```yaml
on:
  repository_dispatch:
    types: [deploy-request]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Triggered by external webhook"
      - run: echo "Payload: ${{ toJSON(github.event.client_payload) }}"
```

**Trigger via API:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/owner/repo/dispatches \
  -d '{"event_type":"deploy-request","client_payload":{"environment":"production"}}'
```

---

## 🎯 Practice Exercises

### Exercise 1: Branch and Path Filtering
**Task:** Create a workflow that:
1. Runs on push to `main` and `develop`
2. Only triggers when files in `src/` or `package.json` change
3. Ignores changes to markdown files

<details>
<summary>Solution</summary>

```yaml
name: Smart CI

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'src/**'
      - 'package.json'
      - '!**.md'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Building because code changed"
```
</details>

### Exercise 2: Release Workflow
**Task:** Create a workflow that:
1. Triggers only when tags matching `v*.*.*` are pushed
2. Extracts version from tag
3. Creates a release announcement

<details>
<summary>Solution</summary>

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Extract version
        run: |
          VERSION=${{ github.ref_name }}
          echo "Releasing version: $VERSION"
          echo "VERSION=$VERSION" >> $GITHUB_ENV
      
      - name: Create release
        run: |
          echo "📦 Creating release for $VERSION"
          echo "Release notes generated"
```
</details>

### Exercise 3: Manual Deployment
**Task:** Create a workflow with:
1. Manual trigger (`workflow_dispatch`)
2. Input for environment (choice: staging/production)
3. Input for enable dry-run (boolean)
4. Workflow uses these inputs

<details>
<summary>Solution</summary>

```yaml
name: Manual Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      dry_run:
        description: 'Dry run (no actual deployment)'
        required: false
        type: boolean
        default: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy application
        run: |
          echo "Environment: ${{ inputs.environment }}"
          echo "Dry run: ${{ inputs.dry_run }}"
          
          if [ "${{ inputs.dry_run }}" == "true" ]; then
            echo "🔍 DRY RUN MODE - No actual deployment"
          else
            echo "🚀 Deploying to ${{ inputs.environment }}"
          fi
```
</details>

---

## 🎓 Pro-Tips

### ⚡Performance: Minimize Unnecessary Runs

```yaml
# ❌ BAD: Runs on EVERY push
on: push

# ✅ GOOD: Runs only when needed
on:
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - 'tests/**'
      - '!docs/**'
```

### 🔒 Security: PR Triggers

```yaml
# ✅ SAFE for public repos
on: pull_request

# ⚠️ DANGEROUS: Use only when you need base branch context
on: pull_request_target
```

**Why `pull_request_target` is dangerous:**
- Runs with write permissions
- Can access secrets
- Malicious PR can exploit this

### 🎯 Complex Trigger Logic

```yaml
on:
  push:
    branches:
      - main
      - 'releases/**'
    paths:
      - 'src/**'
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'
  workflow_dispatch:

# Result: Workflow runs when ANY of these conditions are met
```

---

## 📚 Complete Trigger Reference

### All Event Triggers

| Event | Use Case | Example |
|-------|----------|---------|
| `push` | Code pushed | `on: push` |
| `pull_request` | PR opened/updated | `on: pull_request` |
| `pull_request_target` | PR with base permissions | `on: pull_request_target` |
| `create` | Branch/tag created | `on: create` |
| `delete` | Branch/tag deleted | `on: delete` |
| `fork` | Repository forked | `on: fork` |
| `issues` | Issue opened/closed | `on: issues` |
| `issue_comment` | Comment on issue/PR | `on: issue_comment` |
| `release` | Release published | `on: release` |
| `schedule` | Time-based | `on: schedule` |
| `workflow_dispatch` | Manual trigger | `on: workflow_dispatch` |
| `repository_dispatch` | External webhook | `on: repository_dispatch` |
| `workflow_run` | After another workflow | `on: workflow_run` |

### Filter Syntax

```yaml
on:
  push:
    branches:
      - 'main'              # Exact match
      - 'releases/**'       # Pattern match
      - '!releases/old'     # Exclude
    
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+' # Regex-like pattern
    
    paths:
      - 'src/**'            # Include
      - '!docs/**'          # Exclude
```

---

**Next Chapter:** [Chapter 16 - Using Job Concurrency](chapter-16-concurrency.md)

**Coming Up:** Control workflow execution with concurrency groups, prevent parallel runs, and manage resource-limited operations.
