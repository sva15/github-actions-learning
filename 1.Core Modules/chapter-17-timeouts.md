# Chapter 17: Timeout for Jobs and Steps

## 🎯 Phase 1: Core Explanation

### The Kitchen Timer Analogy
Think of timeouts like **kitchen timers for cooking**:

| Cooking | GitHub Actions | Purpose |
|---------|----------------|---------|
| **Set timer for cake** | Job timeout | Prevent burning (runaway job) |
| **Timer for each step** | Step timeout | Catch stuck operations |
| **Default oven timeout** | Default 360 min | Safety net |
| **Alarm goes off** | Job/step cancelled | Free up resources |

### One-Sentence Definition
**Timeouts are maximum duration limits set at job or step level (in minutes) that automatically cancel execution if exceeded, preventing runaway processes from consuming runner minutes and ensuring workflows fail fast when stuck.**

### Why Timeouts Matter

**Without timeouts:**
- ❌ Stuck job runs for 6 hours (default max)
- ❌ Wastes 360 minutes of runner time
- ❌ Blocks other workflows (if using concurrency)
- ❌ Expensive mistakes (especially on macos runners)

**With timeouts:**
- ✅ Fast failure detection
- ✅ Cost control
- ✅ Clear failure signals
- ✅ Resource optimization

### 💡 Production Reality

**Fact 1:** Default timeout is **360 minutes (6 hours)**. I've seen teams burn through their entire monthly allowance because one test got stuck in an infinite loop.

**Fact 2:** On macOS runners (10x cost), a stuck job costs **60 hours worth of Linux minutes**!

**Fact 3:** Setting realistic timeouts is a **cost optimization technique**. If your tests usually take 5 minutes, set timeout to 10 minutes.

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Job-Level Timeout

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30  # Job must complete in 30 minutes
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run build
```

**Behavior:**
- If job exceeds 30 minutes → Automatically cancelled
- Status: Failed
- Error: "The job running on runner... has exceeded the timeout..."

### Pattern 2: Step-Level Timeout

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run unit tests
        timeout-minutes: 5  # This step only
        run: npm run test:unit
      
      - name: Run integration tests
        timeout-minutes: 15  # Different timeout
        run: npm run test:integration
```

**Behavior:**
- Each step has independent timeout
- If one step times out, job fails
- Remaining steps are skipped

### Pattern 3: Combined Timeouts

```yaml
jobs:
  long-running:
    runs-on: ubuntu-latest
    timeout-minutes: 60  # Job timeout
    steps:
      - uses: actions/checkout@v4
      
      - name: Quick linting
        timeout-minutes: 2
        run: npm run lint
      
      - name: Build
        timeout-minutes: 10
        run: npm run build
      
      - name: Extended tests
        timeout-minutes: 45
        run: npm run test:e2e
```

**Important:** Step timeout cannot exceed job timeout!

### Pattern 4: Environment-Specific Timeouts

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: ${{ github.ref == 'refs/heads/main' && 30 || 15 }}
    steps:
      - run: npm test

# Main branch: 30 minute timeout
# Other branches: 15 minute timeout
```

### Pattern 5: Cost Protection on macOS

```yaml
jobs:
  macos-build:
    runs-on: macos-latest
    timeout-minutes: 15  # CRITICAL: macOS is 10x expensive!
    steps:
      - uses: actions/checkout@v4
      - run: xcodebuild
```

**Cost comparison:**
- Linux stuck for 60 min = 60 minutes used
- macOS stuck for 60 min = 600 minutes used! 💸

### Complete Example: Optimized CI Pipeline

```yaml
name: Optimized CI

on: push

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 5  # Fast operations
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
  
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20  # Moderate timeout
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      
      - name: Unit tests
        timeout-minutes: 5
        run: npm run test:unit
      
      - name: Integration tests
        timeout-minutes: 10
        run: npm run test:integration
  
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
  
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 45  # Longest operation
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      
      - name: Start application
        timeout-minutes: 5
        run: npm start &
      
      - name: Run E2E tests
        timeout-minutes: 30
        run: npm run test:e2e
```

---

## 🎯 Practice Exercises

### Exercise 1: Basic Timeout
**Task:** Create a job with a 10-minute timeout that simulates a long-running process.

<details>
<summary>Solution</summary>

```yaml
name: Timeout Demo

on: workflow_dispatch

jobs:
  long-task:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Simulate long process
        run: |
          echo "Starting long process..."
          sleep 60  # Runs for 1 minute
          echo "Process complete"
```
</details>

### Exercise 2: Step Timeouts
**Task:** Create workflow with different timeouts for different test types.

<details>
<summary>Solution</summary>

```yaml
name: Multi-Timeout Tests

on: push

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30  # Overall job timeout
    steps:
      - uses: actions/checkout@v4
      
      - name: Fast unit tests
        timeout-minutes: 3
        run: echo "Running unit tests (fast)"
      
      - name: Slower integration tests
        timeout-minutes: 10
        run: echo "Running integration tests"
      
      - name: Long E2E tests
        timeout-minutes: 20
        run: echo "Running E2E tests (slow)"
```
</details>

---

## 🎓 Pro-Tips

### Setting Realistic Timeouts

**Strategy: Baseline + Buffer**
```
Typical job time: 5 minutes
Set timeout: 5 min × 2 = 10 minutes
```

**Example:**
```yaml
jobs:
  build:
    timeout-minutes: 10  # Usually takes 5 min, 2x buffer
```

### Cost Optimization Matrix

| Runner | Timeout | Minutes Used | Cost Impact |
|--------|---------|--------------|-------------|
| Linux | 60 min | 60 | 1x |
| Windows | 60 min | 120 (60×2) | 2x |
| macOS | 60 min | 600 (60×10) | 10x |

**Takeaway:** Aggressive timeouts on macOS save HUGE costs!

### Common Timeout Values

```yaml
# Quick checks (lint, format)
timeout-minutes: 5

# Unit tests
timeout-minutes: 10

# Integration tests
timeout-minutes: 15-20

# E2E tests
timeout-minutes: 30-45

# Deployments
timeout-minutes: 20-30

# Full builds
timeout-minutes: 30-60
```

### Handling Timeout Failures

```yaml
jobs:
  test:
    timeout-minutes: 10
    continue-on-error: true  # Don't fail workflow if timeout
    steps: [...]
  
  notify-timeout:
    needs: test
    if: failure()  # Only if test job failed (including timeout)
    runs-on: ubuntu-latest
    steps:
      - run: echo "Test job timed out or failed"
```

### Advanced: Dynamic Timeouts

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: >-
      ${{
        github.event_name == 'pull_request' && 15 ||
        github.event_name == 'push' && 30 ||
        60
      }}
    steps: [...]

# PR: 15 min (fast feedback)
# Push: 30 min (more thorough)
# Other: 60 min (maximum safety)
```

---

## 🚨 Common Mistakes

### Mistake 1: No Timeout on Expensive Runners

```yaml
# ❌ DANGEROUS on macOS
jobs:
  ios-build:
    runs-on: macos-latest
    # No timeout! Could run for 6 hours = 3,600 minutes cost!

# ✅ SAFE
jobs:
  ios-build:
    runs-on: macos-latest
    timeout-minutes: 20
```

### Mistake 2: Timeout Too Short

```yaml
# ❌ Too aggressive
jobs:
  build:
    timeout-minutes: 2  # Often fails on slow network

# ✅ Realistic with buffer
jobs:
  build:
    timeout-minutes: 10  # Typical 5 min + buffer
```

### Mistake 3: Step Timeout Exceeds Job Timeout

```yaml
# ❌ INVALID
jobs:
  test:
    timeout-minutes: 10
    steps:
      - timeout-minutes: 20  # ERROR: Exceeds job timeout!
        run: npm test

# ✅ VALID
jobs:
  test:
    timeout-minutes: 20
    steps:
      - timeout-minutes: 15  # Within job timeout
        run: npm test
```

---

## 📚 Complete Reference

### Timeout Syntax

```yaml
# Job-level
jobs:
  job-name:
    timeout-minutes: number  # 1 to 360 (6 hours max)
    steps: [...]

# Step-level
steps:
  - name: Step name
    timeout-minutes: number  # Must be ≤ job timeout
    run: command
```

### Timeout Limits

| Level | Default | Maximum |
|-------|---------|---------|
| Job | 360 min (6 hrs) | 360 min |
| Step | Inherits job | Job timeout |
| Workflow | N/A | Sum of all jobs |

### Best Practices

1. **Always set job timeout** (don't rely on 360 min default)
2. **Use 2x typical duration** as timeout value
3. **Aggressive timeouts on macOS** (cost control)
4. **Step timeouts for known slow operations**
5. **Monitor and adjust** based on actual run times

---

## 🎯 Knowledge Check

- [ ] Understand difference between job and step timeouts
- [ ] Know default timeout (360 minutes)
- [ ] Can calculate cost impact of timeouts
- [ ] Know how to set realistic timeout values
- [ ] Understand timeout failure behavior

---

**Next Chapter:** [Chapter 18 - Using a Matrix for Your Jobs](chapter-18-matrix.md)

**Coming Up:** Learn matrix strategies for testing across multiple versions, operating systems, and configurations simultaneously.
