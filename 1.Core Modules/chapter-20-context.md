# Chapter 20: Access Workflow Context Information

## 🎯 Phase 1: Core Explanation

### The Dashboard Analogy
Think of workflow context like a **car's dashboard**:

| Dashboard | Context Object | Information Provided |
|-----------|---------------|---------------------|
| Speedometer | `runner` | Current execution environment |
| GPS | `github` | Where you are (repo, branch, commit) |
| Trip computer | `job` | Current job status and details |
| Memory seats | `env` | Saved settings (environment variables) |
| Passenger data | `steps` | Previous step results |
| Route history | `needs` | Data from completed jobs |

### One-Sentence Definition
**Workflow context objects are read-only data structures (`github`, `env`, `job`, `steps`, `runner`, `needs`, `secrets`, `inputs`) accessible via `${{ context.property }}` syntax that provide information about the workflow run, execution environment, and previous step/job outputs.**

### Why Context Matters

**Without context:**
```yaml
# Hardcoded, inflexible
- run: echo "Deploying my-app on main branch"
```

**With context:**
```yaml
# Dynamic, reusable
- run: echo "Deploying ${{ github.repository }} on ${{ github.ref_name }}"
```

### 💡 Production Reality

**Fact 1:** The `github` context is your most-used context — it contains 90% of what you need about the trigger event.

**Fact 2:** Context data is **immutable** during workflow execution. You can't change `github.ref` mid-workflow!

**Fact 3:** Many beginners confuse environment variables with context. They're different: `${{ env.VAR }}` vs `$VAR` in shell.

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: GitHub Context (Most Important)

```yaml
name: GitHub Context Demo

on: [push, pull_request]

jobs:
  info:
    runs-on: ubuntu-latest
    steps:
      - name: Display repository info
        run: |
          echo "Repository: ${{ github.repository }}"
          echo "Owner: ${{ github.repository_owner }}"
          echo "Repo name: ${{ github.event.repository.name }}"
      
      - name: Display trigger info
        run: |
          echo "Event: ${{ github.event_name }}"
          echo "Triggered by: ${{ github.actor }}"
          echo "Branch: ${{ github.ref_name }}"
          echo "Full ref: ${{ github.ref }}"
      
      - name: Display commit info
        run: |
          echo "SHA: ${{ github.sha }}"
          echo "Short SHA: ${{ github.sha }}".substring(0,7)
          echo "Commit message: ${{ github.event.head_commit.message }}"
      
      - name: Display run info
        run: |
          echo "Run ID: ${{ github.run_id }}"
          echo "Run number: ${{ github.run_number }}"
          echo "Run attempt: ${{ github.run_attempt }}"
          echo "Workflow: ${{ github.workflow }}"
```

### Pattern 2: Environment Context

```yaml
env:
  GLOBAL_VAR: "workflow-level"

jobs:
  demo:
    env:
      JOB_VAR: "job-level"
    runs-on: ubuntu-latest
    steps:
      - name: Access env context
        env:
          STEP_VAR: "step-level"
        run: |
          echo "Global: ${{ env.GLOBAL_VAR }}"
          echo "Job: ${{ env.JOB_VAR }}"
          echo "Step: ${{ env.STEP_VAR }}"
      
      - name: Set dynamic variable
        run: echo "DYNAMIC=generated-value" >> $GITHUB_ENV
      
      - name: Use dynamic variable
        run: echo "Dynamic: ${{ env.DYNAMIC }}"
```

### Pattern 3: Steps Context

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - id: build-step
        run: |
          echo "version=1.2.3" >> $GITHUB_OUTPUT
          echo "status=success" >> $GITHUB_OUTPUT
      
      - name: Use step outputs
        run: |
          echo "Version: ${{ steps.build-step.outputs.version }}"
          echo "Status: ${{ steps.build-step.outputs.status }}"
      
      - name: Check step conclusion
        run: |
          echo "Conclusion: ${{ steps.build-step.conclusion }}"
          echo "Outcome: ${{ steps.build-step.outcome }}"
```

### Pattern 4: Runner Context

```yaml
jobs:
  environment-info:
    runs-on: ubuntu-latest
    steps:
      - name: Display runner info
        run: |
          echo "OS: ${{ runner.os }}"
          echo "Architecture: ${{ runner.arch }}"
          echo "Name: ${{ runner.name }}"
          echo "Temp dir: ${{ runner.temp }}"
          echo "Tool cache: ${{ runner.tool_cache }}"
          echo "Workspace: ${{ runner.workspace }}"
      
      - name: Use runner.temp
        run: |
          echo "test data" > ${{ runner.temp }}/data.txt
          cat ${{ runner.temp }}/data.txt
```

### Pattern 5: Job Context

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container: node:20
    services:
      redis:
        image: redis
    
    steps:
      - name: Job context info
        run: |
          echo "Job status: ${{ job.status }}"
          echo "Container ID: ${{ job.container.id }}"
          echo "Services: ${{ toJSON(job.services) }}"
```

### Pattern 6: Needs Context (Cross-Job Data)

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.ver.outputs.version }}
      artifact: ${{ steps.pkg.outputs.name }}
    steps:
      - id: ver
        run: echo "version=1.2.3" >> $GITHUB_OUTPUT
      
      - id: pkg
        run: echo "name=app.tar.gz" >> $GITHUB_OUTPUT
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Use build outputs
        run: |
          echo "Deploying version: ${{ needs.build.outputs.version }}"
          echo "Artifact name: ${{ needs.build.outputs.artifact }}"
      
      - name: Check build result
        run: |
          echo "Build result: ${{ needs.build.result }}"
          # Possible values: success, failure, cancelled, skipped
```

### Pattern 7: Inputs Context (workflow_dispatch)

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]
      version:
        type: string
      debug:
        type: boolean

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Use inputs
        run: |
          echo "Environment: ${{ inputs.environment }}"
          echo "Version: ${{ inputs.version }}"
          echo "Debug mode: ${{ inputs.debug }}"
      
      - if: inputs.debug == true
        run: echo "::debug::Debug mode enabled"
```

### Complete Example: Smart Deployment

```yaml
name: Context-Aware Deployment

on:
  push:
    branches: [main, develop]
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]

env:
  APP_NAME: MyApp

jobs:
  build:
    name: Build ${{ github.repository }}
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.value }}
      sha-short: ${{ steps.version.outputs.sha }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate version
        id: version
        run: |
          VERSION="v$(date +%Y%m%d)-${{ github.run_number }}"
          SHA_SHORT="${{ github.sha }}".substring(0,7)
          echo "value=$VERSION" >> $GITHUB_OUTPUT
          echo "sha=$SHA_SHORT" >> $GITHUB_OUTPUT
      
      - name: Build with context
        run: |
          echo "Building ${{ env.APP_NAME }}"
          echo "Version: ${{ steps.version.outputs.value }}"
          echo "Commit: ${{ github.sha }}"
          echo "Triggered by: ${{ github.actor }}"
          echo "Runner OS: ${{ runner.os }}"
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment || (github.ref == 'refs/heads/main' && 'production' || 'staging') }}
    
    steps:
      - name: Deploy with full context
        env:
          VERSION: ${{ needs.build.outputs.version }}
          SHA: ${{ needs.build.outputs.sha-short }}
        run: |
          echo "🚀 Deploying ${{ env.APP_NAME }}"
          echo "Environment: ${{ inputs.environment || (github.ref == 'refs/heads/main' && 'production' || 'staging') }}"
          echo "Version: $VERSION"
          echo "Commit: $SHA"
          echo "Repository: ${{ github.repository }}"
          echo "Branch: ${{ github.ref_name }}"
          echo "Actor: ${{ github.actor }}"
          echo "Run: ${{ github.run_id }}"
```

---

## 🎯 Practice Exercises

### Exercise 1: Display All GitHub Context
**Task:** Create workflow that displays common github context properties.

<details>
<summary>Solution</summary>

```yaml
name: GitHub Context Explorer

on: [push, pull_request]

jobs:
  explore:
    runs-on: ubuntu-latest
    steps:
      - name: Show context
        run: |
          echo "Event: ${{ github.event_name }}"
          echo "Repository: ${{ github.repository }}"
          echo "Actor: ${{ github.actor }}"
          echo "Ref: ${{ github.ref }}"
          echo "SHA: ${{ github.sha }}"
          echo "Run ID: ${{ github.run_id }}"
```
</details>

### Exercise 2: Cross-Job Data Passing
**Task:** Pass data from job1 to job2 using needs context.

<details>
<summary>Solution</summary>

```yaml
name: Data Passing

on: workflow_dispatch

jobs:
  job1:
    runs-on: ubuntu-latest
    outputs:
      timestamp: ${{ steps.time.outputs.value }}
      message: ${{ steps.msg.outputs.text }}
    steps:
      - id: time
        run: echo "value=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> $GITHUB_OUTPUT
      
      - id: msg
        run: echo "text=Hello from job1" >> $GITHUB_OUTPUT
  
  job2:
    needs: job1
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Timestamp from job1: ${{ needs.job1.outputs.timestamp }}"
          echo "Message from job1: ${{ needs.job1.outputs.message }}"
```
</details>

---

## 🎓 Pro-Tips

### Debugging Context

```yaml
- name: Dump all contexts
  run: |
    echo "GitHub context:"
    echo '${{ toJSON(github) }}'
    echo "Env context:"
    echo '${{ toJSON(env) }}'
    echo "Job context:"
    echo '${{ toJSON(job) }}'
    echo "Steps context:"
    echo '${{ toJSON(steps) }}'
    echo "Runner context:"
    echo '${{ toJSON(runner) }}'
```

### Common GitHub Context Properties

```yaml
${{ github.repository }}           # "owner/repo"
${{ github.repository_owner }}     # "owner"
${{ github.ref }}                  # "refs/heads/main"
${{ github.ref_name }}             # "main"
${{ github.sha }}                  # Full commit SHA
${{ github.actor }}                # Username who triggered
${{ github.event_name }}           # "push", "pull_request", etc.
${{ github.run_id }}               # Unique workflow run ID
${{ github.run_number }}           # Sequential run number
${{ github.workflow }}             # Workflow name
```

---

## 📚 Complete Context Reference

### All Available Contexts

| Context | Description | Example |
|---------|-------------|---------|
| `github` | Event and repository info | `${{ github.repository }}` |
| `env` | Environment variables | `${{ env.NODE_ENV }}` |
| `job` | Current job info | `${{ job.status }}` |
| `steps` | Step outputs and status | `${{ steps.build.outputs.version }}` |
| `runner` | Runner environment | `${{ runner.os }}` |
| `needs` | Outputs from dependent jobs | `${{ needs.build.outputs.artifact }}` |
| `secrets` | Repository secrets | `${{ secrets.API_KEY }}` |
| `inputs` | workflow_dispatch inputs | `${{ inputs.environment }}` |

---

**Next Chapter:** [Chapter 21 - Using if Expressions in Jobs](chapter-21-conditionals.md)

**Coming Up:** Master conditional execution with if expressions, status check functions, and complex conditional logic in workflows.
