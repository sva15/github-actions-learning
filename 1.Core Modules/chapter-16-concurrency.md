# Chapter 16: Using Job Concurrency

## 🎯 Phase 1: Core Explanation

### The Single-Lane Bridge Analogy
Think of concurrency control like traffic management on a **single-lane bridge**:

| Scenario | Bridge | GitHub Actions |
|----------|--------|----------------|
| **No control** | Multiple cars enter chaos | Multiple workflows run simultaneously |
| **Traffic light** | One direction at a time | Concurrency group |
| **Queue system** | Cars wait their turn | `cancel-in-progress: false` |
| **Emergency override** | New car cancels waiting cars | `cancel-in-progress: true` |

### One-Sentence Definition
**Concurrency groups prevent multiple workflow runs or jobs from executing concurrently by organizing them into named groups, with cancel-in-progress option determining whether new runs replace queued ones or wait for completion.**

### Why Concurrency Matters

**Without concurrency control:**
- ❌ Multiple deployments run simultaneously (data corruption!)
- ❌ Resource conflicts (database locked)
- ❌ Race conditions
- ❌ Wasted runner minutes

**With concurrency control:**
- ✅ One deployment at a time
- ✅ Prevent conflicts
- ✅ Cancel outdated runs
- ✅ Save runner minutes

### 💡 Production Reality

**Fact 1:** I've seen production databases corrupted because two deployments ran simultaneously without concurrency control. Don't skip this!

**Fact 2:** The concurrency group name can use GitHub context variables for per-branch or per-PR control.

**Fact 3:** `cancel-in-progress: true` is a **money saver** for PR workflows — new commits cancel old test runs.

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Basic Concurrency (Workflow Level)

```yaml
name: Deploy

on: push

concurrency:
  group: production-deploy
  cancel-in-progress: false  # Queue new runs

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Only one deployment at a time"
```

**Behavior:**
- First run: Starts immediately
- Second run (while first is running): Waits in queue
- Both eventually execute, in order

### Pattern 2: Cancel

 in Progress

```yaml
name: CI

on: pull_request

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true  # Cancel old runs

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

**Behavior:**
- PR branch: `feature/auth`
- Push 1: Workflow starts
- Push 2: Cancels workflow from push 1, starts new run
- Push 3: Cancels workflow from push 2, starts new run

**Result:** Only the latest push gets tested (saves time & money!)

### Pattern 3: Per-Branch Concurrency

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false

# Separate concurrency groups for each branch
# main: deploy-refs/heads/main
# develop: deploy-refs/heads/develop
```

### Pattern 4: Per-PR Concurrency

```yaml
concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

# PR #42: group = pr-42
# PR #43: group = pr-43
# Different PRs run in parallel, same PR cancels old runs
```

### Pattern 5: Job-Level Concurrency

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps: [...]  # No concurrency control
  
  deploy:
    runs-on: ubuntu-latest
    concurrency:
      group: production-deploy
      cancel-in-progress: false
    steps: [...]  # Only deploy has concurrency control
```

### Complete Example: Smart CI/CD

```yaml
name: Smart CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:

concurrency:
  # Use different groups for different scenarios
  group: ${{ github.workflow }}-${{ github.event_name }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    concurrency:
      group: production-deploy
      cancel-in-progress: false  # Never cancel deployments
    steps:
      - run: echo "Deploying to production"
```

**How it works:**
- **PR events:** Cancel old runs (save time)
- **Main branch:** Queue deployments (safety)
- **Different branches:** Run in parallel

---

## 🎯 Practice Exercises

### Exercise 1: Basic Deployment Lock
**Task:** Create a workflow that ensures only one deployment runs at a time, queuing others.

<details>
<summary>Solution</summary>

```yaml
name: Production Deploy

on:
  workflow_dispatch:
  push:
    branches: [main]

concurrency:
  group: prod-deployment
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: |
          echo "Starting deployment..."
          sleep 30  # Simulate long deployment
          echo "Deployment complete"
```
</details>

### Exercise 2: PR Auto-Cancel
**Task:** Create workflow for PRs that cancels old runs when new commits are pushed.

<details>
<summary>Solution</summary>

```yaml
name: PR Tests

on: pull_request

concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running tests..."
      - run: sleep 60  # Simulate long tests
      - run: echo "Tests complete"
```
</details>

---

## 🎓 Pro-Tips

### Decision Matrix: When to Use What

| Scenario | cancel-in-progress | Reason |
|----------|-------------------|---------|
| **Deployments** | `false` | Never cancel mid-deployment (data corruption risk) |
| **PR tests** | `true` | Old commits irrelevant after new push |
| **Nightly builds** | `false` | Want all scheduled runs to complete |
| **Release builds** | `false` | Each release is important |

### Advanced Patterns

**Pattern: Environment-Specific**
```yaml
concurrency:
  group: deploy-${{ inputs.environment }}
  cancel-in-progress: false

# staging and production can deploy simultaneously
# but only one per environment
```

**Pattern: Dynamic Group Names**
```yaml
concurrency:
  group: >-
    ${{
      github.event_name == 'pull_request' &&
      format('pr-{0}', github.event.pull_request.number) ||
      format('branch-{0}', github.ref_name)
    }}
  cancel-in-progress: true
```

---

## 📚 Reference

### Concurrency Syntax

```yaml
# Workflow-level
concurrency:
  group: string
  cancel-in-progress: boolean

# Job-level
jobs:
  job-name:
    concurrency:
      group: string
      cancel-in-progress: boolean
```

### Common Group Patterns

```yaml
# Per workflow
group: ${{ github.workflow }}

# Per branch
group: ${{ github.ref }}

# Per PR
group: pr-${{ github.event.pull_request.number }}

# Per event type
group: ${{ github.event_name }}-${{ github.ref }}

# Custom
group: deploy-prod-v1
```

---

**Next Chapter:** [Chapter 17 - Timeout for Jobs and Steps](chapter-17-timeouts.md)
