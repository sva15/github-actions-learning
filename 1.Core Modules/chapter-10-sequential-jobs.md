# Chapter 10: Execute Jobs in Sequence using `needs`

## 🎯 Phase 1: Core Explanation

### The Assembly Line Analogy (Expanded)
Imagine a car manufacturing assembly line:
- **Without `needs:`** = All stations work simultaneously (chaos! painting before welding)
- **With `needs:`** = Each station waits for the previous one (proper sequence)

| Assembly Stage | Depends On | GitHub Actions |
|----------------|------------|----------------|
| Frame welding | Nothing | `build: ` (no needs) |
| Paint job | Welded frame | `paint: needs: build` |
| Interior assembly | Painted frame | `assemble: needs: paint` |
| Quality check | Everything | `test: needs: [build, paint, assemble]` |

### One-Sentence Definition
**The `needs:` keyword creates explicit dependencies between jobs, ensuring one job waits for another to complete successfully before starting, enabling sequential pipelines, fan-in patterns, and passing data between jobs via outputs.**

### Key Concepts

**1. Dependency Chain:** Jobs execute in order based on `needs:`
**2. Failure Propagation:** If job A fails, jobs that need A are skipped
**3. Job Outputs:** Jobs can produce outputs that dependent jobs consume
**4. Multiple Dependencies:** A job can wait for multiple jobs to complete

### 💡 Production Reality

**Fact 1:** `needs:` is HOW you prevent deploying untested code. Without it, deploy might run before tests finish!

**Fact 2:** Job outputs are the ONLY way to pass data between jobs (besides artifacts). I see teams struggle with this constantly.

**Fact 3:** By default, if ANY job in `needs:` fails, the dependent job is skipped. Use `if: always()` to override this.

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Simple Sequential Chain

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
    needs: build  # Waits for build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running tests..."
  
  deploy:
    name: 🚀 Deploy
    needs: test   # Waits for test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploying..."
```

**Execution:**
```
build (starts immediately)
  ↓ completes
test (starts after build)
  ↓ completes
deploy (starts after test)
```

**Total time:** Sum of all job times (no parallelization)

### Pattern 2: Multiple Dependencies (Fan-In)

```yaml
name: Fan-In Pattern

on: push

jobs:
  test-unit:
    name: 🧪 Unit Tests
    runs-on: ubuntu-latest
    steps:
      - run: echo "Unit tests..."
  
  test-integration:
    name: 🔗 Integration Tests
    runs-on: ubuntu-latest
    steps:
      - run: echo "Integration tests..."
  
  test-e2e:
    name: 🌐 E2E Tests
    runs-on: ubuntu-latest
    steps:
      - run: echo "E2E tests..."
  
  deploy:
    name: 🚀 Deploy
    needs: [test-unit, test-integration, test-e2e]  # Waits for ALL
    runs-on: ubuntu-latest
    steps:
      - run: echo "All tests passed, deploying..."
```

**Execution:**
```
test-unit      ┐
test-integration├─→ deploy (waits for ALL three)
test-e2e       ┘
```

**Behavior:**
- All 3 tests run in **parallel**
- **Deploy waits** until ALL tests complete successfully
- If ANY test fails, deploy is **skipped**

### Pattern 3: Job Outputs (Passing Data Between Jobs)

```yaml
name: Job Outputs

on: push

jobs:
  build:
    name: 📦 Build
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.get_version.outputs.version }}
      artifact_url: ${{ steps.build_app.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Get version
        id: get_version
        run: |
          VERSION=$(date +%Y%m%d-%H%M%S)
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "Generated version: $VERSION"
      
      - name: Build application
        id: build_app
        run: |
          URL="https://builds.example.com/app-$VERSION.zip"
          echo "url=$URL" >> $GITHUB_OUTPUT
          echo "Build URL: $URL"
  
  deploy:
    name: 🚀 Deploy
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy version
        run: |
          echo "Deploying version: ${{ needs.build.outputs.version }}"
          echo "From URL: ${{ needs.build.outputs.artifact_url }}"
```

**How it works:**
1. `build` job sets outputs using `$GITHUB_OUTPUT`
2. `deploy` job accesses them via `needs.build.outputs.<name>`

**Critical syntax:**
```yaml
outputs:
  output-name: ${{ steps.step-id.outputs.value }}
```

### Pattern 4: Conditional Dependencies

```yaml
name: Conditional Dependencies

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building..."
  
  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing..."
  
  # Deploy only if on main branch AND tests passed
  deploy:
    needs: [build, test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to production..."
  
  # Notify even if tests fail
  notify:
    needs: test
    if: always()  # Runs regardless of test result
    runs-on: ubuntu-latest
    steps:
      - run: echo "Notifying team..."
```

### Pattern 5: Complex Dependency Graph

```yaml
name: Complex Pipeline

on: push

jobs:
  prepare:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Preparing environment..."
  
  build-frontend:
    needs: prepare
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building frontend..."
  
  build-backend:
    needs: prepare
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building backend..."
  
  test-frontend:
    needs: build-frontend
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing frontend..."
  
  test-backend:
    needs: build-backend
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing backend..."
  
  integration-test:
    needs: [build-frontend, build-backend]
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running integration tests..."
  
  deploy:
    needs: [test-frontend, test-backend, integration-test]
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying full stack..."
```

**Execution graph:**
```
prepare
  ├→ build-frontend → test-frontend ┐
  │                                   ├→ deploy
  └→ build-backend  → test-backend  ┘
       ├→ integration-test ──────────┘
```

---

## 🎯 Practice Exercises

### Exercise 1: Basic Sequential Flow
**Task:** Create a workflow with:
- `checkout` job
- `build` job (needs checkout)
- `test` job (needs build)

<details>
<summary>Solution</summary>

```yaml
name: Sequential Flow

on: push

jobs:
  checkout:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Code checked out"
  
  build:
    needs: checkout
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Building..."
  
  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Testing..."
```
</details>

### Exercise 2: Job Outputs
**Task:** Create:
- `generate` job that outputs a random number
- `use` job that prints the random number

<details>
<summary>Solution</summary>

```yaml
name: Job Outputs

on: push

jobs:
  generate:
    runs-on: ubuntu-latest
    outputs:
      random_number: ${{ steps.gen.outputs.number }}
    steps:
      - name: Generate random number
        id: gen
        run: |
          NUMBER=$RANDOM
          echo "number=$NUMBER" >> $GITHUB_OUTPUT
          echo "Generated: $NUMBER"
  
  use:
    needs: generate
    runs-on: ubuntu-latest
    steps:
      - name: Use random number
        run: echo "The random number is: ${{ needs.generate.outputs.random_number }}"
```
</details>

### Exercise 3: Fan-In with Failure Handling
**Task:** Create:
- 3 parallel test jobs
- 1 deploy job that waits for all tests
- 1 notify job that runs even if tests fail

<details>
<summary>Solution</summary>

```yaml
name: Fan-In with Notifications

on: push

jobs:
  test-a:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Test A"
  
  test-b:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Test B"
  
  test-c:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Test C"
  
  deploy:
    needs: [test-a, test-b, test-c]
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
  
  notify:
    needs: [test-a, test-b, test-c]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - run: echo "Notifying team (runs even if tests fail)"
```
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Advanced Challenge: Matrix Build with Conditional Deploy

**Requirements:**
Create a workflow that:
1. Has a `prepare` job that outputs the build version
2. Has a `build` job that builds and outputs the artifact name
3. Has 3 parallel test jobs (unit, integration, e2e) that need build
4. Has a `deploy-staging` job (runs if branch is develop, after all tests)
5. Has a `deploy-production` job (runs if branch is main, after all tests)
6. Use job outputs to pass version through the pipeline

**Difficulty:** ⭐⭐⭐⭐⭐ (Expert)

<details>
<summary>Solution</summary>

```yaml
name: Advanced Pipeline

on:
  push:
    branches: [main, develop]

jobs:
  prepare:
    name: 📋 Prepare
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.value }}
      build_date: ${{ steps.version.outputs.date }}
    steps:
      - name: Generate version
        id: version
        run: |
          VERSION="v$(date +%Y%m%d)-${{ github.run_number }}"
          BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
          echo "value=$VERSION" >> $GITHUB_OUTPUT
          echo "date=$BUILD_DATE" >> $GITHUB_OUTPUT
          echo "Generated version: $VERSION"
  
  build:
    name: 📦 Build
    needs: prepare
    runs-on: ubuntu-latest
    outputs:
      artifact: ${{ steps.build.outputs.name }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Build application
        id: build
        run: |
          ARTIFACT="app-${{ needs.prepare.outputs.version }}.tar.gz"
          echo "name=$ARTIFACT" >> $GITHUB_OUTPUT
          echo "Built artifact: $ARTIFACT"
  
  test-unit:
    name: 🧪 Unit Tests
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running unit tests on ${{ needs.build.outputs.artifact }}"
  
  test-integration:
    name: 🔗 Integration Tests
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running integration tests on ${{ needs.build.outputs.artifact }}"
  
  test-e2e:
    name: 🌐 E2E Tests
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running E2E tests on ${{ needs.build.outputs.artifact }}"
  
  deploy-staging:
    name: 🚀 Deploy Staging
    needs: [prepare, build, test-unit, test-integration, test-e2e]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to STAGING"
          echo "Version: ${{ needs.prepare.outputs.version }}"
          echo "Artifact: ${{ needs.build.outputs.artifact }}"
          echo "Build date: ${{ needs.prepare.outputs.build_date }}"
  
  deploy-production:
    name: 🚀 Deploy Production
    needs: [prepare, build, test-unit, test-integration, test-e2e]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to PRODUCTION"
          echo "Version: ${{ needs.prepare.outputs.version }}"
          echo "Artifact: ${{ needs.build.outputs.artifact }}"
          echo "Build date: ${{ needs.prepare.outputs.build_date }}"
```

**Execution on `develop`:**
```
prepare → build → test-unit      ┐
                → test-integration ├→ deploy-staging
                → test-e2e         ┘
```

**Execution on `main`:**
```
prepare → build → test-unit      ┐
                → test-integration ├→ deploy-production
                → test-e2e         ┘
```
</details>

---

## 🎓 Phase 4: Pro-Tips & Gotchas

### 🚨 Common Mistakes

#### Mistake 1: Circular Dependencies

```yaml
# ❌ INVALID - Circular dependency
jobs:
  job-a:
    needs: job-b
  job-b:
    needs: job-a
```

**Error:** Workflow will fail to start with "Circular dependency detected"

#### Mistake 2: Wrong Output Syntax

```yaml
# ❌ WRONG
outputs:
  version: steps.get_version.outputs.version

# ✅ CORRECT
outputs:
  version: ${{ steps.get_version.outputs.version }}
```

#### Mistake 3: Accessing Outputs from Non-Dependent Job

```yaml
jobs:
  job-a:
    outputs:
      value: ${{ steps.x.outputs.val }}
  
  job-b:
    # NO needs: job-a
    steps:
      - run: echo "${{ needs.job-a.outputs.value }}"  # ERROR!
```

**Fix:** Add `needs: job-a`

#### Mistake 4: Forgetting `id` on Step

```yaml
# ❌ FAILS - No id on step
steps:
  - run: echo "version=1.0" >> $GITHUB_OUTPUT

outputs:
  version: ${{ steps.???.outputs.version }}  # No step id!

# ✅ CORRECT
steps:
  - id: get_version
    run: echo "version=1.0" >> $GITHUB_OUTPUT

outputs:
  version: ${{ steps.get_version.outputs.version }}
```

### ⚡ Performance Optimization

#### Strategy 1: Minimize Sequential Dependencies

```yaml
# ❌ SLOW - Unnecessary sequential
jobs:
  lint:
    steps: [...]
  test:
    needs: lint  # Tests don't actually need lint!
    steps: [...]

# ✅ FAST - Parallel
jobs:
  lint:
    steps: [...]
  test:
    # No needs - runs in parallel
    steps: [...]
```

#### Strategy 2: Group Related Dependencies

```yaml
# ✅ GOOD - Clear dependency stages
jobs:
  # Stage 1: Validation (parallel)
  lint: ...
  security-scan: ...
  
  # Stage 2: Build (after validation)
  build:
    needs: [lint, security-scan]
  
  # Stage 3: Test (parallel, after build)
  test-unit:
    needs: build
  test-integration:
    needs: build
  
  # Stage 4: Deploy (after all tests)
  deploy:
    needs: [test-unit, test-integration]
```

### 🔒 Security with Job Dependencies

#### Pattern: Approval Gates

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps: [...]
  
  test:
    needs: build
    runs-on: ubuntu-latest
    steps: [...]
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval!
    steps: [...]
```

**Effect:** Workflow pauses at `deploy` job, waiting for approval.

### 🏆 Advanced Patterns

#### Pattern 1: Dynamic Job Skipping

```yaml
jobs:
  check:
    outputs:
      should-deploy: ${{ steps.check.outputs.deploy }}
    steps:
      - id: check
        run: |
          if [[ "${{ github.event.head_commit.message }}" == *"[skip deploy]"* ]]; then
            echo "deploy=false" >> $GITHUB_OUTPUT
          else
            echo "deploy=true" >> $GITHUB_OUTPUT
          fi
  
  deploy:
    needs: check
    if: needs.check.outputs.should-deploy == 'true'
    steps: [...]
```

#### Pattern 2: Failure Notifications

```yaml
jobs:
  test:
    steps: [...]
  
  notify-failure:
    needs: test
    if: failure()  # Only if test failed
    steps:
      - run: echo "Tests failed! Notifying team..."
  
  notify-success:
    needs: test
    if: success()  # Only if test passed
    steps:
      - run: echo "Tests passed!"
```

#### Pattern 3: Job Output as Matrix

```yaml
jobs:
  generate-matrix:
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - id: set-matrix
        run: echo 'matrix=["ubuntu", "windows", "macos"]' >> $GITHUB_OUTPUT
  
  build:
    needs: generate-matrix
    strategy:
      matrix:
        os: ${{ fromJSON(needs.generate-matrix.outputs.matrix) }}
    runs-on: ${{ matrix.os }}-latest
    steps: [...]
```

---

## 📚 Complete Reference

### `needs` Syntax

```yaml
jobs:
  # No dependencies
  job-a:
    runs-on: ubuntu-latest
  
  # Single dependency
  job-b:
    needs: job-a
  
  # Multiple dependencies
  job-c:
    needs: [job-a, job-b]
  
  # With condition
  job-d:
    needs: job-c
    if: success()
```

### Job Outputs Syntax

```yaml
jobs:
  producer:
    outputs:
      output-1: ${{ steps.step-id.outputs.value-1 }}
      output-2: ${{ steps.step-id.outputs.value-2 }}
    steps:
      - id: step-id
        run: |
          echo "value-1=hello" >> $GITHUB_OUTPUT
          echo "value-2=world" >> $GITHUB_OUTPUT
  
  consumer:
    needs: producer
    steps:
      - run: |
          echo "${{ needs.producer.outputs.output-1 }}"
          echo "${{ needs.producer.outputs.output-2 }}"
```

### Conditional Execution

| Function | Behavior |
|----------|----------|
| `success()` | Run if all `needs` succeeded (default) |
| `always()` | Run regardless of previous job status |
| `failure()` | Run if any `needs` failed |
| `cancelled()` | Run if workflow was cancelled |

---

## 🎯 Knowledge Check

- [ ] Understand how `needs:` creates dependencies
- [ ] Can create fan-in patterns (multiple jobs → one job)
- [ ] Know how to pass data via job outputs
- [ ] Understand failure propagation
- [ ] Can use `if: always()` to override default behavior
- [ ] Recognize circular dependency errors

---

**Next Chapter:** [Chapter 11 - Storing Workflow Data as Artifacts](chapter-11-artifacts.md)

**Coming Up:** Learn how to upload and download files between jobs, persist build outputs, and implement caching strategies.
