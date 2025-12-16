# Chapter 8: Executing Shell Scripts in Workflow

## 🎯 Phase 1: Core Explanation

### The Recipe Book Analogy
Imagine you're cooking:
- **Inline commands** = Following verbal instructions ("chop onions, sauté for 5 minutes")
- **Shell scripts** = Having a written recipe card you can reuse and share

**Shell scripts in workflows** are like **having a library of specialized recipe cards** — you write complex logic once, store it in your repository, and execute it across multiple workflows.

### One-Sentence Definition
**Shell scripts are standalone executable files (.sh, .ps1, .py) stored in your repository that contain reusable logic, which workflows can execute to organize complex operations, improve maintainability, and enable code reuse across jobs.**

### Why This Matters

**Maintainability:** Instead of 50 lines of bash in YAML (hard to test, no syntax highlighting), you have a `scripts/deploy.sh` file you can:
- Test locally
- Version control properly
- Debug with proper tools
- Reuse across workflows

### 💡 Production Reality
**80% of mature CI/CD pipelines I've worked with have a `scripts/` directory containing:**
- `build.sh` - Build logic
- `test.sh` - Test execution
- `deploy.sh` - Deployment procedures
- `utils.sh` - Shared helper functions

**Why?** Workflows describe WHAT to do and WHEN. Scripts contain the HOW.

---

## 🛠️ Phase 2: Implementation Drill

### Basic Pattern: Calling a Script

**Repository structure:**
```
repo/
├── .github/
│   └── workflows/
│       └── ci.yml
└── scripts/
    └── build.sh
```

**scripts/build.sh:**
```bash
#!/bin/bash
set -e

echo "🏗️ Starting build process..."

# Build logic
echo "Installing dependencies..."
npm ci

echo "Running linter..."
npm run lint

echo "Building project..."
npm run build

echo "✅ Build complete!"
```

**Make executable:**
```bash
chmod +x scripts/build.sh
```

**Workflow (.github/workflows/ci.yml):**
```yaml
name: CI Pipeline

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Execute build script
        run: ./scripts/build.sh
```

### Passing Arguments to Scripts

**scripts/deploy.sh:**
```bash
#!/bin/bash
set -e

ENVIRONMENT=$1
VERSION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$VERSION" ]; then
  echo "Usage: deploy.sh <environment> <version>"
  exit 1
fi

echo "🚀 Deploying version $VERSION to $ENVIRONMENT"

# Deployment logic here
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
```

**Workflow:**
```yaml
- name: Deploy to staging
  run: ./scripts/deploy.sh staging v1.2.3

- name: Deploy to production
  run: ./scripts/deploy.sh production ${{ github.ref_name }}
```

### Using Environment Variables in Scripts

**scripts/test.sh:**
```bash
#!/bin/bash
set -e

echo "Running tests in $NODE_ENV environment"
echo "API URL: $API_URL"

# Run tests with environment-specific config
npm test
```

**Workflow:**
```yaml
- name: Run tests
  env:
    NODE_ENV: production
    API_URL: https://api.example.com
  run: ./scripts/test.sh
```

### Advanced: Sourcing Helper Functions

**scripts/utils.sh:**
```bash
#!/bin/bash

# Reusable functions

log_info() {
  echo "ℹ️ INFO: $1"
}

log_error() {
  echo "❌ ERROR: $1" >&2
}

log_success() {
  echo "✅ SUCCESS: $1"
}

check_required_env() {
  local var_name=$1
  if [ -z "${!var_name}" ]; then
    log_error "Required environment variable $var_name is not set"
    exit 1
  fi
}
```

**scripts/deploy.sh:**
```bash
#!/bin/bash
set -e

# Source helper functions
source "$(dirname "$0")/utils.sh"

log_info "Starting deployment..."

check_required_env "DEPLOY_TOKEN"
check_required_env "ENVIRONMENT"

log_info "Deploying to $ENVIRONMENT"
# Deployment logic

log_success "Deployment complete!"
```

### Cross-Platform Scripts

**For Linux/macOS (Bash):**
```bash
# scripts/build.sh
#!/bin/bash
set -e
echo "Building on Unix..."
```

**For Windows (PowerShell):**
```powershell
# scripts/build.ps1
$ErrorActionPreference = "Stop"
Write-Host "Building on Windows..."
```

**Workflow (cross-platform):**
```yaml
jobs:
  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: chmod +x scripts/build.sh
      - run: ./scripts/build.sh
  
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - run: .\scripts\build.ps1
        shell: pwsh
```

---

## 🎯 Practice Exercises

### Exercise 1: Basic Script Execution
**Task:** Create:
1. A script `scripts/hello.sh` that prints "Hello from script!"
2. A workflow that checks out code and runs the script

<details>
<summary>Solution</summary>

**scripts/hello.sh:**
```bash
#!/bin/bash
echo "Hello from script!"
```

**Workflow:**
```yaml
name: Script Test

on: push

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: chmod +x scripts/hello.sh
      - run: ./scripts/hello.sh
```
</details>

### Exercise 2: Script with Arguments
**Task:** Create a script that:
1. Accepts two arguments: name and age
2. Prints "Hello {name}, you are {age} years old"
3. Call it from workflow with different values

<details>
<summary>Solution</summary>

**scripts/greet.sh:**
```bash
#!/bin/bash
NAME=$1
AGE=$2

if [ -z "$NAME" ] || [ -z "$AGE" ]; then
  echo "Usage: greet.sh <name> <age>"
  exit 1
fi

echo "Hello $NAME, you are $AGE years old!"
```

**Workflow:**
```yaml
name: Greeting Script

on: push

jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: chmod +x scripts/greet.sh
      
      - name: Greet user 1
        run: ./scripts/greet.sh Alice 25
      
      - name: Greet user 2
        run: ./scripts/greet.sh Bob 30
```
</details>

### Exercise 3: Reusable Functions
**Task:** Create:
1. `scripts/utils.sh` with a `log_message()` function
2. `scripts/build.sh` that sources utils and uses `log_message()`
3. Workflow that runs build.sh

<details>
<summary>Solution</summary>

**scripts/utils.sh:**
```bash
#!/bin/bash

log_message() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}
```

**scripts/build.sh:**
```bash
#!/bin/bash
set -e

source "$(dirname "$0")/utils.sh"

log_message "Build started"
log_message "Installing dependencies..."
log_message "Build complete"
```

**Workflow:**
```yaml
name: Build with Utils

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: chmod +x scripts/build.sh scripts/utils.sh
      - run: ./scripts/build.sh
```
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Advanced Challenge: Complete Deployment Pipeline

**Requirements:**
Create a deployment pipeline with:

**Files needed:**
1. `scripts/utils.sh` - Helper functions (log_info, log_error, check_env)
2. `scripts/validate.sh` - Validate environment before deploy
3. `scripts/deploy.sh` - Actual deployment logic
4. Workflow that orchestrates all scripts

**The workflow should:**
- Run on tags (v*.*.*)
- Extract version from tag
- Run validation
- Run deployment (if validation passes)
- Handle errors gracefully

**Difficulty:** ⭐⭐⭐⭐ (Advanced)

<details>
<summary>Solution</summary>

**scripts/utils.sh:**
```bash
#!/bin/bash

log_info() {
  echo "ℹ️  [INFO] $1"
}

log_error() {
  echo "❌ [ERROR] $1" >&2
}

log_success() {
  echo "✅ [SUCCESS] $1"
}

check_env() {
  local var_name=$1
  if [ -z "${!var_name}" ]; then
    log_error "Required variable $var_name not set"
    return 1
  fi
  log_success "Variable $var_name is set"
}
```

**scripts/validate.sh:**
```bash
#!/bin/bash
set -e

source "$(dirname "$0")/utils.sh"

log_info "Starting validation..."

# Check required environment variables
check_env "DEPLOY_ENV" || exit 1
check_env "VERSION" || exit 1

# Validate version format
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  log_error "Invalid version format: $VERSION"
  exit 1
fi

log_success "Validation passed!"
```

**scripts/deploy.sh:**
```bash
#!/bin/bash
set -e

source "$(dirname "$0")/utils.sh"

log_info "Starting deployment..."
log_info "Environment: $DEPLOY_ENV"
log_info "Version: $VERSION"

# Simulate deployment
log_info "Building application..."
sleep 2

log_info "Running tests..."
sleep 2

log_info "Deploying to $DEPLOY_ENV..."
sleep 2

log_success "Deployment complete!"
```

**Workflow:**
```yaml
name: Deploy

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Make scripts executable
        run: chmod +x scripts/*.sh
      
      - name: Extract version
        id: version
        run: echo "version=${{ github.ref_name }}" >> $GITHUB_OUTPUT
      
      - name: Validate environment
        env:
          DEPLOY_ENV: production
          VERSION: ${{ steps.version.outputs.version }}
        run: ./scripts/validate.sh
      
      - name: Deploy application
        env:
          DEPLOY_ENV: production
          VERSION: ${{ steps.version.outputs.version }}
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: ./scripts/deploy.sh
```
</details>

---

## 🎓 Phase 4: Pro-Tips & Gotchas

### 🚨 Common Mistakes

#### Mistake 1: Forgetting to Make Scripts Executable

```yaml
# ❌ FAILS if script not executable
- run: ./scripts/build.sh

# ✅ Always make executable first
- run: chmod +x scripts/build.sh && ./scripts/build.sh

# ✅ Or in separate step
- run: chmod +x scripts/*.sh
- run: ./scripts/build.sh
```

#### Mistake 2: Not Using `set -e`

```bash
# ❌ Script continues after errors
#!/bin/bash
npm run build
npm run test  # Runs even if build failed!

# ✅ Exit on first error
#!/bin/bash
set -e
npm run build
npm run test  # Only runs if build succeeded
```

#### Mistake 3: Hardcoding Paths

```bash
# ❌ Breaks if script moved
source /home/runner/work/repo/scripts/utils.sh

# ✅ Relative to script location
source "$(dirname "$0")/utils.sh"
```

#### Mistake 4: Not Handling Missing Arguments

```bash
# ❌ Fails with cryptic error
ENVIRONMENT=$1
echo "Deploying to $ENVIRONMENT"

# ✅ Validate arguments
if [ -z "$1" ]; then
  echo "Usage: $0 <environment>"
  exit 1
fi
ENVIRONMENT=$1
```

### ⚡ Performance & Organization

#### Best Practices Directory Structure

```
repo/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-prod.yml
├── scripts/
│   ├── ci/
│   │   ├── build.sh
│   │   ├── test.sh
│   │   └── lint.sh
│   ├── deploy/
│   │   ├── staging.sh
│   │   ├── production.sh
│   │   └── rollback.sh
│   └── utils/
│       ├── logging.sh
│       ├── validators.sh
│       └── notifications.sh
└── src/
```

### 🔒 Security Best Practices

#### Practice 1: Don't Echo Secrets

```bash
# ❌ DANGEROUS
echo "Deploying with token: $DEPLOY_TOKEN"

# ✅ SAFE
echo "Deploying with token: [REDACTED]"
# Use token without logging
curl -H "Authorization: Bearer $DEPLOY_TOKEN" https://api.example.com
```

#### Practice 2: Validate Inputs

```bash
#!/bin/bash
set -e

ENVIRONMENT=$1

# Whitelist allowed values
case $ENVIRONMENT in
  staging|production)
    echo "Valid environment: $ENVIRONMENT"
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    echo "Allowed: staging, production"
    exit 1
    ;;
esac
```

### 🏆 Advanced Patterns

#### Pattern 1: Exit Code Handling

```yaml
- name: Run tests (allow failure)
  id: tests
  run: ./scripts/test.sh || echo "tests_failed=true" >> $GITHUB_OUTPUT
  continue-on-error: true

- name: Notify on test failure
  if: steps.tests.outputs.tests_failed == 'true'
  run: ./scripts/notify-failure.sh
```

#### Pattern 2: Script Output Capture

```yaml
- name: Run script and capture output
  id: build
  run: |
    OUTPUT=$(./scripts/build.sh 2>&1)
    echo "output<<EOF" >> $GITHUB_OUTPUT
    echo "$OUTPUT" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT

- name: Use captured output
  run: echo "${{ steps.build.outputs.output }}"
```

#### Pattern 3: Conditional Script Execution

```bash
#!/bin/bash
set -e

# Only deploy on main branch
if [ "$GITHUB_REF" != "refs/heads/main" ]; then
  echo "Skipping deployment (not on main branch)"
  exit 0
fi

echo "Deploying..."
```

---

## 📚 Shell Script Best Practices Reference

### Essential Bash Flags

```bash
#!/bin/bash
set -e          # Exit on error
set -u          # Exit on undefined variable
set -o pipefail # Catch errors in pipes
set -x          # Debug mode (print commands)
```

### Function Template

```bash
function_name() {
  local arg1=$1
  local arg2=$2
  
  # Validation
  if [ -z "$arg1" ]; then
    echo "Error: arg1 required"
    return 1
  fi
  
  # Logic
  echo "Processing $arg1..."
  
  # Return value (0 = success)
  return 0
}
```

### Error Handling Template

```bash
#!/bin/bash
set -e

cleanup() {
  echo "Cleaning up..."
  # Cleanup code
}

error_handler() {
  echo "Error on line $1"
  cleanup
  exit 1
}

trap 'error_handler $LINENO' ERR
trap cleanup EXIT

# Your script logic here
```

---

## 🎯 Knowledge Check

- [ ] Understand when to use scripts vs inline commands
- [ ] Can make scripts executable and execute them
- [ ] Know how to pass arguments to scripts
- [ ] Can source helper functions between scripts
- [ ] Understand error handling with `set -e`
- [ ] Know security implications of logging

### Key Takeaways

1. **Scripts = Reusability** → Write once, use in multiple workflows
2. **Workflows = Orchestration** → Define WHEN scripts run
3. **Separation of Concerns** → YAML for workflow logic, Bash for implementation
4. **Maintainability** → Easier to test, debug, and version scripts independently

---

**Next Chapter:** [Chapter 9 - Workflow with Multiple Jobs](chapter-09-multiple-jobs.md)

**Coming Up:** Learn how to structure workflows with multiple jobs, understand job parallelization, and coordinate complex multi-stage pipelines.
