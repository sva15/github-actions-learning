# Chapter 23: Cancelling and Skipping Workflows

## 🎯 Phase 1: Core Explanation

### The Traffic Control Analogy
Workflow cancellation is like **traffic management**:
- **Red light** = Cancel workflow
- **Skip lane** = [skip ci] in commit message
- **Emergency stop** = Manual cancellation
- **Auto-redirect** = Concurrency cancellation

### One-Sentence Definition
**Workflow cancellation allows manual or automatic termination of running workflows via UI, API, concurrency groups, or special commit message patterns ([skip ci]), preventing unnecessary execution and saving runner minutes.**

---

## 🛠️ Phase 2: Implementation Patterns

### Pattern 1: Skip CI with Commit Messages

```bash
# Any of these patterns skip workflow execution:
git commit -m "Update docs [skip ci]"
git commit -m "Fix typo [ci skip]"
git commit -m "Update README [skip actions]"
git commit -m "Docs only [actions skip]"

# Also works with:
# [no ci]
# [ci-skip]
# skip-checks:true
# skip-checks: true
```

**Supported patterns:**
- `[skip ci]`, `[ci skip]`
- `[skip actions]`, `[actions skip]`
- `[no ci]`
- `skip-checks:true` or `skip-checks: true`

### Pattern 2: Conditional Skip in Workflow

```yaml
name: CI

on: push

jobs:
  test:
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

### Pattern 3: Concurrency-Based Cancellation

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Auto-cancel old runs

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

### Pattern 4: Manual Cancellation via GitHub CLI

```bash
# List recent workflow runs
gh run list --limit 10

# Cancel specific run
gh run cancel 123456789

# Cancel all runs for a workflow
gh run list --workflow=ci.yml | grep -v "completed" | awk '{print $7}' | xargs -I {} gh run cancel {}
```

### Pattern 5: Cancel via GitHub API

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/OWNER/REPO/actions/runs/RUN_ID/cancel
```

---

## 🎯 Practice Exercises

### Exercise 1: Auto-Cancel Pattern
**Task:** Create workflow that cancels previous runs on same PR.

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
      - run: npm test
```
</details>

---

## 🎓 Pro-Tips

### When to Use Cancellation

| Scenario | Method | Reason |
|----------|--------|--------|
| PR updated | Concurrency + cancel-in-progress | Old tests irrelevant |
| Docs-only change | [skip ci] in commit | No need to test |
| Accidental trigger | Manual UI/API cancel | Stop waste |
| Wrong branch | Manual cancel | Incorrect execution |

### Skip Patterns Don't Work For

- Workflows with `workflow_dispatch` (manual trigger)
- Scheduled workflows (`cron`)
- Already running workflows (can't retroactively skip)

---

**Next Chapter:** [Chapter 24 - Enable Step Debug Logging](chapter-24-debug.md)
