# Chapter 21: Using if Expressions in Jobs

## 🎯 Phase 1: Core Explanation

### The Smart Traffic Light Analogy
Think of `if` expressions like **intelligent traffic lights**:

| Traffic System | GitHub Actions |
|----------------|----------------|
| **Red = Stop** | Job/step skipped (`if: false`) |
| **Green = Go** | Job/step runs (`if: true`) |
| **Sensors check conditions** | `if` expression evaluates |
| **Emergency vehicles override** | `always()`, `cancelled()` functions |

### One-Sentence Definition
**`if` expressions are conditional statements using GitHub Actions expression syntax that determine whether a job or step executes based on context values, status functions, or custom logic, enabling dynamic workflow behavior.**

### Why Conditionals Matter

**Without conditionals:**
- ❌ Every job runs every time (waste)
- ❌ Can't skip based on branch/event
- ❌ Can't handle failures gracefully
- ❌ Can't create smart workflows

**With conditionals:**
- ✅ Deploy only on main branch
- ✅ Skip expensive tests on docs-only changes
- ✅ Run cleanup even if job fails
- ✅ Complex decision logic

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Job-Level Conditionals

```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to production"
  
  test:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

### Pattern 2: Step-Level Conditionals

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build
        run: npm run build
      
      - name: Deploy (only on main)
        if: github.ref == 'refs/heads/main'
        run: npm run deploy
      
      - name: Notify (only on failure)
        if: failure()
        run: echo "Build failed!"
```

### Pattern 3: Status Check Functions

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
  
  notify-success:
    needs: test
    if: success()  # Only if test succeeded
    runs-on: ubuntu-latest
    steps:
      - run: echo "Tests passed!"
  
  notify-failure:
    needs: test
    if: failure()  # Only if test failed
    runs-on: ubuntu-latest
    steps:
      - run: echo "Tests failed!"
  
  cleanup:
    needs: test
    if: always()  # Runs regardless of test result
    runs-on: ubuntu-latest
    steps:
      - run: echo "Cleaning up..."
```

**Available status functions:**
- `success()` - All previous steps/jobs succeeded
- `failure()` - Any previous step/job failed
- `cancelled()` - Workflow was cancelled
- `always()` - Always run (unless workflow cancelled)

### Pattern 4: Complex Conditionals

```yaml
jobs:
  deploy:
    if: |
      github.ref == 'refs/heads/main' &&
      github.event_name == 'push' &&
      !contains(github.event.head_commit.message, '[skip ci]')
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

### Pattern 5: Checking for Secrets

```yaml
jobs:
  deploy:
    if: secrets.DEPLOY_TOKEN != ''
    runs-on: ubuntu-latest
    steps:
      - env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: ./deploy.sh
```

### Pattern 6: Matrix-Specific Conditionals

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      
      - run: npm test
      
      - name: macOS-specific step
        if: matrix.os == 'macos-latest'
        run: echo "Running on macOS"
      
      - name: Coverage (only latest Node on Ubuntu)
        if: matrix.os == 'ubuntu-latest' && matrix.node == '22'
        run: npm run coverage
```

### Pattern 7: Actor-Based Conditionals

```yaml
jobs:
  trusted-deploy:
    if: |
      github.actor == 'admin-user' ||
      contains(fromJSON('["user1","user2","user3"]'), github.actor)
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying from trusted user"
```

### Complete Example: Smart CI/CD

```yaml
name: Smart CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
  
  build:
    needs: test
    if: success()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
  
  deploy-staging:
    needs: build
    if: |
      github.ref == 'refs/heads/develop' &&
      github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to staging"
  
  deploy-production:
    needs: build
    if: |
      github.ref == 'refs/heads/main' &&
      github.event_name == 'push' &&
      !contains(github.event.head_commit.message, '[skip deploy]')
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: echo "Deploying to production"
  
  notify-failure:
    needs: [test, build]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Build failed!"
          echo "Actor: ${{ github.actor }}"
          echo "Commit: ${{ github.sha }}"
```

---

## 🎯 Practice Exercises

### Exercise 1: Branch-Based Deployment
**Task:** Create workflow that deploys to staging on `develop` and production on `main`.

<details>
<summary>Solution</summary>

```yaml
name: Branch Deployment

on: push

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to staging"
  
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to production"
```
</details>

### Exercise 2: Cleanup on Failure
**Task:** Run tests, and if they fail, upload failure logs.

<details>
<summary>Solution</summary>

```yaml
name: Test with Cleanup

on: push

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
      
      - name: Upload failure logs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: failure-logs
          path: logs/
```
</details>

---

## 🎓 Pro-Tips

### Expression Syntax

```yaml
# Equality
if: github.ref == 'refs/heads/main'

# Inequality
if: github.actor != 'bot-user'

# AND
if: github.ref == 'refs/heads/main' && success()

# OR
if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'

# NOT
if: "!contains(github.event.head_commit.message, '[skip ci]')"

# Contains
if: contains(github.ref, 'release')

# Starts with
if: startsWith(github.ref, 'refs/tags/v')

# Ends with
if: endsWith(github.ref, '-beta')
```

### Common Patterns

```yaml
# Deploy on main, skip on [skip deploy]
if: |
  github.ref == 'refs/heads/main' &&
  !contains(github.event.head_commit.message, '[skip deploy]')

# Only PRs to main
if: |
  github.event_name == 'pull_request' &&
  github.base_ref == 'main'

# Specific file changes (with path filter)
if: contains(github.event.head_commit.modified, 'deploy')
```

---

## 📚 Reference

### Status Functions

| Function | When it returns true |
|----------|---------------------|
| `success()` | All previous steps succeeded |
| `failure()` | Any previous step failed |
| `cancelled()` | Workflow was cancelled |
| `always()` | Always (even if cancelled, unless runner failure) |

### Common Expressions

```yaml
# GitHub context
${{ github.ref == 'refs/heads/main' }}
${{ github.event_name == 'push' }}
${{ github.actor == 'username' }}

# String operations
${{ contains(string, substring) }}
${{ startsWith(string, prefix) }}
${{ endsWith(string, suffix) }}

# JSON operations
${{ fromJSON('[1,2,3]') }}
${{ toJSON(object) }}
```

---

**Next Chapter:** [Chapter 22 - Workflow Event Filters and Activity Types](chapter-22-event-filters.md)
