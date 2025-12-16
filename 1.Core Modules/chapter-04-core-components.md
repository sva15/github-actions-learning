# Chapter 4: GitHub Actions Core Components

## 🎯 Phase 1: Core Explanation

### The Restaurant Kitchen Analogy
Think of GitHub Actions like a **sophisticated restaurant kitchen**:

| Component | Restaurant Analogy | GitHub Actions | Real Example |
|-----------|-------------------|----------------|--------------|
| **Workflow** | The complete recipe book | The YAML file containing all automation instructions | `ci.yml`, `deploy.yml` |
| **Event** | Customer placing an order | Trigger that starts the workflow | `push`, `pull_request`, `schedule` |
| **Job** | Different cooking stations (grill, salad, dessert) | Independent execution units that can run in parallel | `build`, `test`, `deploy` |
| **Runner** | The physical kitchen equipment and workspace | Virtual machine (Ubuntu/Windows/macOS) where jobs execute | `ubuntu-latest`, `windows-2022` |
| **Step** | Individual cooking tasks (chop onions, sauté, plate) | Specific commands or actions to execute | Checkout code, run tests |
| **Action** | Pre-made sauces, spice mixes, kitchen tools | Reusable, pre-packaged code units | `actions/checkout@v4` |

Just like a kitchen coordinates multiple stations (grill and salad prep can happen simultaneously) to fulfill orders efficiently, GitHub Actions coordinates multiple jobs (build and test can run in parallel) to complete your CI/CD pipeline faster.

### One-Sentence Definition
**GitHub Actions is composed of workflows (automation definition files in YAML) containing jobs (parallel or sequential execution units) that run on runners (virtual machines) and execute steps (individual commands or reusable actions) when triggered by events (GitHub repository activities or schedules).**

### Connection to Traditional CI/CD
In traditional CI/CD systems (Jenkins, CircleCI, Travis), you have similar concepts:

| Traditional CI/CD | GitHub Actions Equivalent |
|------------------|--------------------------|
| Pipeline definition file | Workflow YAML |
| Build triggers | Events |
| Build stages | Jobs |
| Build agents/executors | Runners |
| Build commands | Steps |
| Shared libraries | Actions |

The key difference: GitHub Actions is **tightly integrated with GitHub**, meaning events are native GitHub activities (pushes, PRs, issues, releases), and you get seamless access to repository data, secrets, and GitHub API.

### 💡 Surprising Fact from Production
**75% of workflow performance issues I've debugged come from not understanding that jobs run in parallel by default.**

Classic scenario:
- Team creates workflow with `build`, `test`, and `deploy` jobs
- All three start simultaneously
- Deploy job tries to deploy code that hasn't been built yet → FAILS
- Team thinks "GitHub Actions is broken" when they just needed `needs: [build, test]` on the deploy job

**The default is parallelization** — this is GOOD for speed, but you must be explicit about dependencies!

---

## 🛠️ Phase 2: Implementation Drill

### Minimal Working Example: Demonstrating All Components

This workflow showcases every core component:

```yaml
# WORKFLOW: The entire YAML file is one workflow
# Location: .github/workflows/core-demo.yml
name: Core Components Demonstration

# EVENT: What triggers this workflow
on: 
  push:
    branches: [main]

# JOBS: Collection of jobs (parallel by default)
jobs:
  # JOB 1: First independent task
  info:
    name: 📋 Repository Information
    # RUNNER: Which operating system to use
    runs-on: ubuntu-latest
    
    # STEPS: Sequential tasks within this job
    steps:
      # STEP 1: Using an ACTION (reusable code)
      - name: Checkout repository
        uses: actions/checkout@v4
      
      # STEP 2: Using a COMMAND (shell execution)
      - name: Display repository info
        run: |
          echo "Repository: ${{ github.repository }}"
          echo "Triggered by: ${{ github.actor }}"
          echo "Branch: ${{ github.ref_name }}"
      
      # STEP 3: Another command
      - name: List repository files
        run: |
          echo "Files in repository:"
          ls -la
  
  # JOB 2: Second independent task (runs concurrently with job 1)
  system-info:
    name: 🖥️ System Information
    runs-on: ubuntu-latest
    steps:
      - name: Display OS information
        run: |
          echo "Operating System: $(uname -s)"
          echo "OS Version: $(uname -r)"
          echo "Architecture: $(uname -m)"
      
      - name: Display environment
        run: |
          echo "Shell: $SHELL"
          echo "Home directory: $HOME"
          echo "Working directory: $(pwd)"
```

**Execution Timeline:**
```
Time 0s:  Event (push to main) triggers workflow
Time 2s:  GitHub provisions 2 runners in parallel
          Runner 1: Starting 'info' job
          Runner 2: Starting 'system-info' job
Time 5s:  Both jobs executing their steps
Time 15s: 'info' job completes (3 steps)
Time 12s: 'system-info' job completes (2 steps)
Time 15s: Workflow marked as complete
```

### Component Deep Dive with Examples

#### 1️⃣ **Workflows** - The Container File

```yaml
# File: .github/workflows/my-workflow.yml
# This naming is flexible, choose descriptive names

name: My Workflow Name        # Displays in GitHub UI
run-name: Custom Run Title    # Optional: Dynamic title per run

on: push                      # Simple trigger

jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Workflow executed"
```

**Key Points:**
- **Location is strict:** MUST be in `.github/workflows/` directory
- **Extension:** Must be `.yml` or `.yaml`
- **Naming:** Filename can be anything (`ci.yml`, `build.yaml`, `deploy-prod.yml`)
- One repository can have **unlimited workflows**

**Common Patterns:**
```
.github/workflows/
  ├── ci.yml              # Runs on all branches
  ├── deploy-staging.yml  # Deploys to staging
  ├── deploy-prod.yml     # Deploys to production
  ├── scheduled-tests.yml # Nightly test suite
  └── security-scan.yml   # Weekly security scans
```

#### 2️⃣ **Events** - What Triggers Workflows

```yaml
# Single event
on: push

# Multiple events
on: [push, pull_request, workflow_dispatch]

# Event with detailed configuration
on:
  push:
    branches:
      - main
      - 'releases/**'
    paths:
      - 'src/**'
      - 'package.json'
    paths-ignore:
      - '**.md'
      - 'docs/**'
  
  pull_request:
    types: [opened, synchronize, reopened]
  
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday at midnight
  
  workflow_dispatch:  # Manual trigger
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
```

**Most Common Events:**
- `push` - Code pushed to repository
- `pull_request` - PR opened, updated, or closed
- `workflow_dispatch` - Manual trigger from UI
- `schedule` - Time-based (cron syntax)
- `release` - Release published
- `issues` - Issue opened, closed, etc.

#### 3️⃣ **Jobs** - Units of Work

```yaml
jobs:
  # Job identifier (used in 'needs', unique per workflow)
  build:
    # Human-readable name (shows in GitHub UI)
    name: 🏗️ Build Application
    
    # Required: Which runner to use
    runs-on: ubuntu-latest
    
    # Optional: Job-level timeout (default: 360 minutes)
    timeout-minutes: 30
    
    # Optional: Continue workflow even if this job fails
    continue-on-error: false
    
    # Optional: Run conditionally
    if: github.ref == 'refs/heads/main'
    
    # Optional: Environment name (for deployments)
    environment: production
    
    # Required: Steps to execute
    steps:
      - run: echo "Building..."
  
  # Another job that depends on 'build'
  deploy:
    name: 🚀 Deploy
    runs-on: ubuntu-latest
    needs: build  # This job waits for 'build' to complete
    steps:
      - run: echo "Deploying..."
```

**Job Execution Patterns:**

```yaml
# Pattern 1: All jobs run in parallel (default)
jobs:
  job-a:
    runs-on: ubuntu-latest
    steps: [...]
  job-b:
    runs-on: ubuntu-latest
    steps: [...]
  job-c:
    runs-on: ubuntu-latest
    steps: [...]

# Timeline: A, B, C all start simultaneously

# Pattern 2: Sequential execution
jobs:
  first:
    runs-on: ubuntu-latest
    steps: [...]
  
  second:
    needs: first
    runs-on: ubuntu-latest
    steps: [...]
  
  third:
    needs: second
    runs-on: ubuntu-latest
    steps: [...]

# Timeline: first → second → third

# Pattern 3: Fan-out, fan-in (parallel then merge)
jobs:
  prepare:
    runs-on: ubuntu-latest
    steps: [...]
  
  test-linux:
    needs: prepare
    runs-on: ubuntu-latest
    steps: [...]
  
  test-windows:
    needs: prepare
    runs-on: windows-latest
    steps: [...]
  
  test-macos:
    needs: prepare
    runs-on: macos-latest
    steps: [...]
  
  report:
    needs: [test-linux, test-windows, test-macos]
    runs-on: ubuntu-latest
    steps: [...]

# Timeline:
#   prepare
#     ├→ test-linux   ┐
#     ├→ test-windows ├→ report
#     └→ test-macos   ┘
```

#### 4️⃣ **Runners** - Where Jobs Execute

```yaml
# Linux (most common, fastest, cheapest)
runs-on: ubuntu-latest      # Currently Ubuntu 22.04
runs-on: ubuntu-22.04       # Pinned version
runs-on: ubuntu-20.04       # Older version

# Windows
runs-on: windows-latest     # Currently Windows Server 2022
runs-on: windows-2022
runs-on: windows-2019

# macOS
runs-on: macos-latest       # Currently macOS 12 (Monterey)
runs-on: macos-13           # macOS 13 (Ventura)
runs-on: macos-12           # macOS 12 (Monterey)
runs-on: macos-11           # macOS 11 (Big Sur)

# Self-hosted (your own servers)
runs-on: self-hosted
runs-on: [self-hosted, linux, x64, gpu]
```

**Runner Specifications (GitHub-hosted):**

| Runner | vCPUs | RAM | Storage | Cost Multiplier |
|--------|-------|-----|---------|----------------|
| Ubuntu | 2 | 7 GB | 14 GB SSD | 1x (baseline) |
| Windows | 2 | 7 GB | 14 GB SSD | 2x |
| macOS | 3 | 14 GB | 14 GB SSD | 10x 💸 |

**Why macOS is 10x more expensive:**
- Apple hardware is expensive
- Licensing costs
- Lower density (fewer VMs per physical machine)

**When to use each:**
- **Ubuntu:** Default choice for 90% of workflows (Node.js, Python, Go, Docker, etc.)
- **Windows:** .NET applications, Windows-specific builds, PowerShell scripts
- **macOS:** iOS/macOS app builds (Xcode), Swift projects

#### 5️⃣ **Steps** - Individual Tasks

```yaml
steps:
  # Step using an action
  - name: Checkout code
    uses: actions/checkout@v4
    with:
      fetch-depth: 0
  
  # Step running shell commands
  - name: Build application
    run: |
      npm install
      npm run build
    working-directory: ./frontend
    env:
      NODE_ENV: production
  
  # Step with conditional execution
  - name: Deploy to production
    if: github.ref == 'refs/heads/main'
    run: ./deploy.sh
  
  # Step with timeout
  - name: Run long test
    run: npm test
    timeout-minutes: 10
  
  # Step with continue even on error
  - name: Optional lint check
    run: npm run lint
    continue-on-error: true
```

**Step Execution Rules:**
- Steps execute **sequentially** (top to bottom)
- If a step fails, subsequent steps are **skipped** (unless `continue-on-error: true`)
- Each step runs in the **same runner environment** (share filesystem, env vars)
- Steps share the **same shell session** by default

#### 6️⃣ **Actions** - Reusable Components

```yaml
# Using an action (always starts with 'uses:')
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

# Action from GitHub Marketplace
- name: Send Slack notification
  uses: slackapi/slack-github-action@v1
  with:
    channel-id: 'C1234567890'
    slack-message: 'Deployment successful!'
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_TOKEN }}

# Action from your own repository
- name: Custom action
  uses: myorg/my-custom-action@v2
  with:
    input-parameter: value

# Local action (in same repo)
- name: Local action
  uses: ./.github/actions/my-local-action
```

---

## 🎯 Practice Exercises

### Exercise 1: Basic Multi-Job Workflow
**Your Turn:** Create a workflow with:
1. Three jobs: `prepare`, `build`, `test`
2. All jobs run on `ubuntu-latest`
3. Each job has one step that prints what it's doing
4. Observe that they run in parallel

<details>
<summary>Solution</summary>

```yaml
name: Parallel Jobs Demo

on: push

jobs:
  prepare:
    name: 📦 Prepare Environment
    runs-on: ubuntu-latest
    steps:
      - name: Preparation step
        run: echo "Preparing build environment..."
  
  build:
    name: 🏗️ Build Application
    runs-on: ubuntu-latest
    steps:
      - name: Build step
        run: echo "Building application..."
  
  test:
    name: 🧪 Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: Test step
        run: echo "Running automated tests..."
```

**What happens:** All three jobs start at approximately the same time and run concurrently.
</details>

### Exercise 2: Cross-Platform Testing
**Challenge:** Create a workflow that:
- Tests on Linux, Windows, AND macOS
- Each job checks out code and prints the OS
- Add a final job that summarizes results (but don't worry about making it wait yet)

<details>
<summary>Solution</summary>

```yaml
name: Cross-Platform Testing

on: push

jobs:
  test-linux:
    name: 🐧 Linux Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test on Linux
        run: |
          echo "Testing on: $(uname -s)"
          echo "Version: $(uname -r)"
  
  test-windows:
    name: 🪟 Windows Tests
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test on Windows
        run: |
          echo "Testing on Windows"
          systeminfo | findstr /B /C:"OS Name"
  
  test-macos:
    name: 🍎 macOS Tests
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test on macOS
        run: |
          echo "Testing on: $(uname -s)"
          sw_vers
  
  summary:
    name: 📊 Test Summary
    runs-on: ubuntu-latest
    steps:
      - name: Print summary
        run: echo "All platform tests completed!"
```

**Note:** The summary job runs immediately (in parallel). We'll learn how to make it wait in the next chapter!
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Advanced Challenge: Complete CI Pipeline Structure

Build a realistic CI pipeline with the following requirements:

**Requirements:**
1. Four jobs: `lint`, `security-scan`, `test`, `build`
2. `lint` and `security-scan` run in parallel (independent)
3. `test` and `build` also run in parallel
4. The workflow should run on push to `main` and `develop` branches
5. Each job should:
   - Run on Ubuntu
   - Checkout the repository
   - Have at least one meaningful step

**Difficulty:** ⭐⭐⭐ (Intermediate)

<details>
<summary>Hints</summary>

- Use branch filtering under `on.push`
- Remember to checkout in each job (jobs don't share filesystems)
- Jobs default to parallel execution
</details>

<details>
<summary>✅ Solution with Code Review</summary>

```yaml
name: Complete CI Pipeline

on:
  push:
    branches:
      - main
      - develop

jobs:
  lint:
    name: 🔍 Code Linting
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Run linter
        run: |
          echo "Running ESLint..."
          echo "Checking code style..."
          echo "✅ Linting passed"
  
  security-scan:
    name: 🔒 Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Run security scanner
        run: |
          echo "Scanning for vulnerabilities..."
          echo "Checking dependencies..."
          echo "✅ No security issues found"
  
  test:
    name: 🧪 Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Execute test suite
        run: |
          echo "Running unit tests..."
          echo "Running integration tests..."
          echo "✅ All tests passed"
  
  build:
    name: 📦 Build Application
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Build project
        run: |
          echo "Compiling source code..."
          echo "Creating production bundle..."
          echo "✅ Build successful"
```

**Code Review Feedback:**

✅ **What's Excellent:**
- Clean job names with emojis for quick scanning
- Proper branch filtering (only main and develop)
- Each job properly checks out code
- Parallel execution maximizes speed

⚠️ **Production Improvements Needed:**
```yaml
# Add realistic steps
lint:
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm ci
    - run: npm run lint

# Add timeouts to prevent runaway jobs
test:
  timeout-minutes: 15
  steps: [...]

# Add conditional deployment after these jobs
deploy:
  needs: [lint, security-scan, test, build]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps: [...]
```

</details>

---

## 🎓 Phase 4: Pro-Tips & Gotchas

### 🔍 Understanding Job Isolation

**Critical Concept:** Each job gets a completely fresh runner (VM):

```yaml
jobs:
  job-a:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Hello" > message.txt
      - run: cat message.txt  # ✅ Works (same job)
  
  job-b:
    runs-on: ubuntu-latest
    steps:
      - run: cat message.txt  # ❌ FAILS (different VM)
```

**Why:** `job-a` and `job-b` run on completely different virtual machines. When `job-a` finishes, its VM is destroyed along with all files.

**Solution:** Use artifacts (covered in later chapter):
```yaml
jobs:
  job-a:
    steps:
      - run: echo "Hello" > message.txt
      - uses: actions/upload-artifact@v4
        with:
          name: message
          path: message.txt
  
  job-b:
    needs: job-a
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: message
      - run: cat message.txt  # ✅ Works
```

### ⚡ Performance Optimization Patterns

#### Pattern 1: Maximize Parallelization
```yaml
# ❌ SLOW: Sequential (30 minutes total)
jobs:
  all-in-one:
    steps:
      - run: lint      # 5 min
      - run: test      # 15 min
      - run: build     # 10 min

# ✅ FAST: Parallel (15 minutes total)
jobs:
  lint:
    steps:
      - run: lint      # 5 min
  test:
    steps:
      - run: test      # 15 min (slowest)
  build:
    steps:
      - run: build     # 10 min
```

**Time saved:** 30 min → 15 min (50% faster!)

#### Pattern 2: Fail Fast with Critical Jobs
```yaml
jobs:
  # Run quick checks first
  lint:
    timeout-minutes: 5
    steps: [...]
  
  # Expensive tests only if lint passes
  integration-tests:
    needs: lint
    timeout-minutes: 30
    steps: [...]
```

**Why:** If lint fails (5 min), you don't waste 30 minutes running tests that would fail anyway.

### 🔒 Security Best Practices

#### Principle: Least Privilege Runners
```yaml
jobs:
  # Public workflows: Use standard runners
  test:
    runs-on: ubuntu-latest
    steps: [...]
  
  # Deployment: Use environment protection
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requires approval
    steps: [...]
```

#### Avoid Storing Secrets in Workflow Files
```yaml
# ❌ NEVER DO THIS
steps:
  - run: echo "API_KEY=sk_live_12345" >> $GITHUB_ENV

# ✅ Use repository secrets
steps:
  - run: echo "API_KEY=${{ secrets.API_KEY }}" >> $GITHUB_ENV
```

### 🚨 Common Mistakes and Solutions

| ❌ Anti-Pattern | ✅ Pro Pattern | Why It Matters |
|----------------|---------------|----------------|
| **One massive job with 30 steps** | Split into 5-6 focused jobs | Parallelization, clarity, easier debugging |
| **Using macOS for Node.js builds** | Use `ubuntu-latest` | macOS costs 10x more; Ubuntu is faster |
| **No timeout on jobs** | Set `timeout-minutes: 30` | Prevent runaway jobs from consuming minutes |
| **Forgetting `actions/checkout`** | Always checkout in each job | Jobs don't share filesystems |
| **Not using `needs` for dependencies** | Explicit dependency chains | Prevents deploy before build completes |
| **Hardcoding values everywhere** | Use variables and secrets | Maintainability and security |

### 🎯 Debugging Workflow Structure Issues

```yaml
# Add this to any job to debug its context
jobs:
  debug:
    runs-on: ubuntu-latest
    steps:
      - name: Dump GitHub context
        run: echo '${{ toJSON(github) }}'
      
      - name: Dump job context
        run: echo '${{ toJSON(job) }}'
      
      - name: Dump runner context
        run: echo '${{ toJSON(runner) }}'
      
      - name: List environment variables
        run: env | sort
```

**Use this when:**
- Workflow doesn't trigger when expected
- Variables aren't available
- Trying to understand execution context

### 🏆 Advanced Pro Patterns

#### Pattern: Conditional Job Matrix
```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      should-deploy: ${{ steps.check.outputs.deploy }}
    steps:
      - id: check
        run: echo "deploy=true" >> $GITHUB_OUTPUT
  
  deploy:
    needs: setup
    if: needs.setup.outputs.should-deploy == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

**Use case:** Dynamic workflow behavior based on first job's results.

#### Pattern: Reusable Job Definitions
```yaml
# Define job template (anchor)
.job-template: &job-template
  runs-on: ubuntu-latest
  timeout-minutes: 30
  steps:
    - uses: actions/checkout@v4

jobs:
  test-unit:
    <<: *job-template
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:unit
  
  test-integration:
    <<: *job-template
    steps:
      - uses: actions/checkout@v4
      - run: npm run test:integration
```

**Note:** YAML anchors reduce duplication but make workflows less portable. Use sparingly.

---

## 📚 Complete Reference

### Workflow File Anatomy
```yaml
name: string                    # Workflow name (UI display)
run-name: string               # Custom run title (optional)

on:                            # Event triggers
  push:
    branches: [list]
    paths: [list]
  pull_request:
  workflow_dispatch:
  schedule:
    - cron: string

env:                           # Workflow-level environment variables
  KEY: value

defaults:                      # Default settings
  run:
    shell: bash
    working-directory: ./src

jobs:
  job-id:
    name: string              # Human-readable name
    runs-on: string|matrix    # Runner OS
    needs: [list]             # Job dependencies
    if: expression            # Conditional execution
    timeout-minutes: number   # Job timeout
    continue-on-error: bool   # Proceed on failure
    environment: string       # Deployment environment
    
    env:                      # Job-level environment variables
      KEY: value
    
    defaults:                 # Job-level defaults
      run:
        shell: bash
    
    outputs:                  # Job outputs (for other jobs)
      output-name: ${{ steps.step-id.outputs.value }}
    
    steps:
      - name: string
        uses: action@version
        with:
          input: value
        env:
          KEY: value
      
      - name: string
        run: string|multiline
        working-directory: path
        shell: bash|pwsh|python
        env:
          KEY: value
        timeout-minutes: number
        continue-on-error: bool
        if: expression
```

### Runner Label Reference

| Label | OS | Version | Architecture |
|-------|-----|---------|--------------|
| `ubuntu-latest` | Ubuntu | 22.04 (changes) | x64 |
| `ubuntu-22.04` | Ubuntu | 22.04 | x64 |
| `ubuntu-20.04` | Ubuntu | 20.04 | x64 |
| `windows-latest` | Windows Server | 2022 (changes) | x64 |
| `windows-2022` | Windows Server | 2022 | x64 |
| `windows-2019` | Windows Server | 2019 | x64 |
| `macos-latest` | macOS | 12 (changes) | x64 |
| `macos-13` | macOS Ventura | 13 | x64 |
| `macos-12` | macOS Monterey | 12 | x64 |
| `macos-11` | macOS Big Sur | 11 | x64 |

### Cost Calculation (GitHub Free Tier)

**Storage:** 500 MB (artifacts & caches)
**Compute Minutes (per month):**
- Public repos: Unlimited
- Private repos: 2,000 minutes

**Minute Multipliers:**
- Linux: 1x (2,000 minutes available)
- Windows: 2x (1,000 minutes available)
- macOS: 10x (200 minutes available)

**Example Monthly Usage:**
```
500 min Linux    = 500 minutes
100 min Windows  = 200 minutes (100 × 2)
50 min macOS     = 500 minutes (50 × 10)
------------------------
Total: 1,200 / 2,000 minutes used
```

---

## 🎯 Knowledge Check

Before moving to the next chapter, verify you can:

- [ ] Draw the hierarchy: Workflow → Events → Jobs → Steps → Actions/Commands
- [ ] Explain why jobs run in parallel by default
- [ ] List the three types of hosted runners and their cost differences
- [ ] Explain what happens when a workflow is triggered (runner provisioning)
- [ ] Understand that jobs are isolated (separate VMs)
- [ ] Differentiate between `uses:` (actions) and `run:` (commands)
- [ ] Know where workflow files must be located (`.github/workflows/`)
- [ ] Create a workflow with multiple jobs
- [ ] Use emojis and names to make workflows readable

### Quick Self-Test

1. What's the directory path where workflows must be stored?
2. If you have 3 jobs without `needs`, do they run in parallel or sequential?
3. Which runner is most expensive and by how much?
4. Can `job-b` access a file created by `job-a`?
5. What's the difference between `name:` at the workflow level vs job level?

<details>
<summary>Answers</summary>

1. `.github/workflows/`
2. Parallel (default behavior)
3. macOS is 10x more expensive than Linux
4. No, jobs are isolated on different VMs (use artifacts)
5. Workflow `name:` is the workflow title in UI; job `name:` is the job title in UI (job ID is for referencing in code)
</details>

---

**Next Chapter:** [Chapter 5 - Configure Checkout Action](chapter-05-configure-checkout-action.md)

**Coming Up:** Deep dive into the most important action in GitHub Actions — `actions/checkout` with all its configuration options, performance implications, and advanced use cases.
