# Chapter 9: Workflow with Multiple Jobs

## 🎯 Phase 1: Core Explanation

### The Assembly Line Analogy
Think of a workflow with multiple jobs like a **modern assembly line**:

| Assembly Line | GitHub Actions |
|---------------|----------------|
| Different stations (welding, painting, quality check) | Different jobs (build, test, deploy) |
| Stations can work **in parallel** | Jobs run **simultaneously** by default |
| Some stations depend on others (can't paint before welding) | Jobs use `needs:` to create dependencies |
| Each station has its own tools/space | Each job gets a **fresh runner (VM)** |

### One-Sentence Definition
**Multiple jobs in a workflow are independent execution units that run in parallel by default, each on their own virtual machine, enabling faster pipelines through concurrent processing and modular organization of workflow logic.**

### ConnectionTo Previous Concepts
- **Chapter 4** taught you jobs exist and run in parallel
- **This chapter** teaches you WHY to use multiple jobs and HOW to structure them effectively

**Critical Concept:** Jobs are **isolated** — they don't share filesystems, environment variables, or state. This is both a feature (parallel execution, fault isolation) and a challenge (requires explicit data passing via artifacts).

### 💡 Production Reality Check

**Fact 1:** Properly parallelized jobs can reduce workflow time by **60-80%**.

Example from production:
- **Before:** One job running lint → test → build → deploy = 25 minutes
- **After:** Three parallel jobs (lint, test, build) + sequential deploy = 8 minutes

**Fact 2:** The default is parallel! You need to EXPLICITLY create dependencies with `needs:`.

**Fact 3:** Each job costs runner minutes. Bad pattern:
```yaml
jobs:
  checkout-job: # Just checks out code
    steps:
      - uses: actions/checkout@v4
  
  build-job:     # Has to checkout AGAIN
    needs: checkout-job
    steps:
      - uses: actions/checkout@v4  # Wasted time & minutes!
```

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Parallel Jobs (Default Behavior)

```yaml
name: Parallel Pipeline

on: push

jobs:
  lint:
    name: 🔍 Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run linter
        run: echo "Linting code..."
  
  test:
    name: 🧪 Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Execute tests
        run: echo "Running tests..."
  
  security:
    name: 🔒 Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security scan
        run: echo "Scanning for vulnerabilities..."
```

**Execution timeline:**
```
Time 0s:  Workflow starts
Time 2s:  All 3 jobs start SIMULTANEOUSLY
Time 10s: All jobs running in parallel
Time 15s: Lint finishes (shortest)
Time 20s: Security scan finishes
Time 25s: Test finishes (longest)
Time 25s: Workflow complete
```

**Total time:** 25 seconds (limited by slowest job)  
**If sequential:** 60 seconds (15+20+25)  
**Time saved:** 35 seconds (58% faster!)

### Pattern 2: Sequential Jobs with `needs`

```yaml
name: Sequential Pipeline

on: push

jobs:
  build:
    name: 📦 Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Building application..."
  
  test:
    name: 🧪 Test
    needs: build  # Waits for build to complete
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Testing application..."
  
  deploy:
    name: 🚀 Deploy
    needs: test   # Waits for test to complete
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploying application..."
```

**Execution timeline:**
```
build starts → build completes
               ↓
               test starts → test completes
                             ↓
                             deploy starts → deploy completes
```

### Pattern 3: Fan-Out, Fan-In (Parallel → Merge)

```yaml
name: Fan-Out Fan-In

on: push

jobs:
  prepare:
    name: 📋 Prepare
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Preparing environment..."
  
  # These three run in parallel AFTER prepare
  test-unit:
    name: 🧪 Unit Tests
    needs: prepare
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running unit tests..."
  
  test-integration:
    name: 🔗 Integration Tests
    needs: prepare
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running integration tests..."
  
  test-e2e:
    name: 🌐 E2E Tests
    needs: prepare
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running E2E tests..."
  
  # This waits for ALL three tests
  deploy:
    name: 🚀 Deploy
    needs: [test-unit, test-integration, test-e2e]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploying..."
```

**Execution flow:**
```
prepare
  ├→ test-unit        ┐
  ├→ test-integration ├→ deploy
  └→ test-e2e         ┘
```

### Pattern 4: Conditional Jobs

```yaml
name: Conditional Deployment

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Building..."
  
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to staging..."
  
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to production..."
```

**Behavior:**
- On `develop` branch: build → deploy-staging
- On `main` branch: build → deploy-production
- On other branches: build only

### Pattern 5: Cross-Platform Testing

```yaml
name: Cross-Platform

on: push

jobs:
  test-linux:
    name: 🐧 Linux
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Testing on Linux"
  
  test-windows:
    name: 🪟 Windows
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Testing on Windows"
  
  test-macos:
    name: 🍎 macOS
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Testing on macOS"
  
  report:
    name: 📊 Report
    needs: [test-linux, test-windows, test-macos]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All platform tests passed!"
```

---

## 🎯 Practice Exercises

### Exercise 1: Basic Parallel Jobs
**Task:** Create a workflow with 3 parallel jobs:
- `job-a`: Prints "Job A running"
- `job-b`: Prints "Job B running"
- `job-c`: Prints "Job C running"

<details>
<summary>Solution</summary>

```yaml
name: Parallel Jobs

on: push

jobs:
  job-a:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Job A running"
  
  job-b:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Job B running"
  
  job-c:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Job C running"
```
</details>

### Exercise 2: Sequential Pipeline
**Task:** Create a workflow where:
- `prepare` job runs first
- `build` job runs after prepare
- `deploy` job runs after build

<details>
<summary>Solution</summary>

```yaml
name: Sequential

on: push

jobs:
  prepare:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Preparing..."
  
  build:
    needs: prepare
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building..."
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```
</details>

### Exercise 3: Fan-Out Pattern
**Task:** Create:
- 1 `setup` job
- 3 `test-*` jobs that wait for setup
- All tests run in parallel

<details>
<summary>Solution</summary>

```yaml
name: Fan-Out

on: push

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Setting up..."
  
  test-unit:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - run: echo "Unit tests..."
  
  test-integration:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - run: echo "Integration tests..."
  
  test-e2e:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - run: echo "E2E tests..."
```
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Advanced Challenge: Complete CI/CD Pipeline

**Requirements:**
Create a realistic CI/CD workflow with:

**Jobs:**
1. `validate` - Runs first, validates code
2. `build` - Runs after validate
3. `test-unit`, `test-integration` - Run in parallel after build
4. `security-scan` - Runs in parallel with tests
5. `deploy-staging` - Runs only on `develop` branch, after all tests pass
6. `deploy-production` - Runs only on `main` branch, after all tests pass

**Difficulty:** ⭐⭐⭐⭐ (Advanced)

<details>
<summary>Solution</summary>

```yaml
name: Complete CI/CD

on:
  push:
    branches: [main, develop]

jobs:
  validate:
    name: ✅ Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Validating code structure..."
  
  build:
    name: 📦 Build
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Building application..."
  
  test-unit:
    name: 🧪 Unit Tests
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running unit tests..."
  
  test-integration:
    name: 🔗 Integration Tests
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running integration tests..."
  
  security-scan:
    name: 🔒 Security Scan
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running security scan..."
  
  deploy-staging:
    name: 🚀 Deploy Staging
    needs: [test-unit, test-integration, security-scan]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploying to staging..."
  
  deploy-production:
    name: 🚀 Deploy Production
    needs: [test-unit, test-integration, security-scan]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploying to production..."
```

**Execution on `develop`:**
```
validate → build → test-unit      ┐
                → test-integration ├→ deploy-staging
                → security-scan    ┘
```

**Execution on `main`:**
```
validate → build → test-unit      ┐
                → test-integration ├→ deploy-production
                → security-scan    ┘
```
</details>

---

## 🎓 Phase 4: Pro-Tips & Gotchas

### 🚨 Common Mistakes

#### Mistake 1: Jobs Don't Share Filesystem

```yaml
# ❌ FAILS - job2 can't access file from job1
jobs:
  job1:
    steps:
      - run: echo "data" > file.txt
  
  job2:
    needs: job1
    steps:
      - run: cat file.txt  # FILE NOT FOUND!
```

**Why:** Each job runs on a different VM. Solution: Use artifacts (next chapter).

#### Mistake 2: Unnecessary Sequential Jobs

```yaml
# ❌ SLOW - No reason for these to be sequential
jobs:
  lint:
    steps: [...]
  
  test:
    needs: lint  # BAD! Tests don't need lint
    steps: [...]
```

**Fix:** Remove `needs:` so they run in parallel.

#### Mistake 3: Forgetting Checkout in Each Job

```yaml
# ❌ FAILS - job2 has no code
jobs:
  job1:
    steps:
      - uses: actions/checkout@v4
  
  job2:
    needs: job1
    steps:
      - run: ls  # No files! Forgot checkout
```

**Fix:** Checkout in EVERY job that needs code.

### ⚡ Performance Strategies

#### Strategy 1: Maximize Parallelization

```yaml
# ✅ GOOD - 4 jobs in parallel
jobs:
  lint: ...
  test: ...
  security: ...
  build: ...

# Time: Max(all job times) ≈ slowest job
```

#### Strategy 2: Use `needs` Only When Necessary

```yaml
# Only create dependencies when REQUIRED
jobs:
  build:  # No needs - starts immediately
    steps: [...]
  
  test:
    needs: build  # Actually needs build artifacts
    steps: [...]
  
  lint:  # No needs - independent!
    steps: [...]
```

#### Strategy 3: Skip Jobs Conditionally

```yaml
jobs:
  expensive-test:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    # Only runs on main branch pushes
```

### 🔒 Security with Multiple Jobs

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    # No secrets needed
    steps: [...]
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production  # Requires approval + secrets
    steps: [...]
```

### 🏆 Advanced Patterns

#### Pattern: Dynamic Job Dependencies

```yaml
jobs:
  prepare:
    outputs:
      should-deploy: ${{ steps.check.outputs.deploy }}
    steps:
      - id: check
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "deploy=true" >> $GITHUB_OUTPUT
          else
            echo "deploy=false" >> $GITHUB_OUTPUT
          fi
  
  deploy:
    needs: prepare
    if: needs.prepare.outputs.should-deploy == 'true'
    steps: [...]
```

---

## 📚 Quick Reference

### Job Dependency Syntax

```yaml
jobs:
  # No dependencies - starts immediately
  job-a:
    runs-on: ubuntu-latest
    steps: [...]
  
  # Single dependency
  job-b:
    needs: job-a
    runs-on: ubuntu-latest
    steps: [...]
  
  # Multiple dependencies (wait for ALL)
  job-c:
    needs: [job-a, job-b]
    runs-on: ubuntu-latest
    steps: [...]
```

### Execution Patterns

| Pattern | Syntax | Use Case |
|---------|--------|----------|
| **Parallel** | No `needs:` | Independent tasks (lint, test, build) |
| **Sequential** | `needs: previous-job` | Pipeline stages (build → test → deploy) |
| **Fan-out** | Multiple jobs with same `needs:` | Parallel tests after setup |
| **Fan-in** | `needs: [job1, job2, job3]` | Deploy after all tests pass |

---

## 🎯 Knowledge Check

- [ ] Understand jobs run in parallel by default
- [ ] Know how to create dependencies with `needs:`
- [ ] Understand job isolation (separate VMs)
- [ ] Can design fan-out/fan-in patterns
- [ ] Know when to use parallel vs sequential
- [ ] Understand conditional job execution

---

**Next Chapter:** [Chapter 10 - Execute Jobs in Sequence (needs)](chapter-10-sequential-jobs.md)

**Coming Up:** Deep dive into the `needs:` keyword, job outputs, and complex dependency chains.
