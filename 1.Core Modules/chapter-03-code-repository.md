# Chapter 3: Code Repository (Working with Checkout)

## 🎯 Phase 1: Core Explanation

### The Library Book Analogy
Imagine GitHub Actions runner as a **brand new computer with nothing installed**:

- 🏢 **GitHub:** The library with all your books (code)
- 🏃 **Runner:** A temporary reading room that's empty when you enter
- 📖 **Checkout:** Going to the shelf and bringing your book to the reading room
- 📝 **Workflow:** The work you do with that book

**Key insight:** When a workflow starts, the runner is **completely blank**. It doesn't automatically have your code! You MUST explicitly check it out using `actions/checkout`.

### One-Sentence Definition
**Checking out a repository means cloning your project code from GitHub into the runner's workspace so your workflow can access, build, test, and deploy it.**

### Connection to Git Fundamentals
This is exactly what you do locally with `git clone` → `cd project` → `git checkout branch`. The `actions/checkout` action automates this entire process in the CI/CD environment with proper authentication and optimizations.

### 💡 Surprising Fact from Production
**70% of workflow failures I've debugged in my career were because of missing `actions/checkout`.**

Classic scenario:
```yaml
steps:
  # Forgot to checkout!
  - name: Run tests
    run: npm test  # ❌ FAILS: package.json not found
```

The error message is confusing: `npm: command not found` or `package.json doesn't exist` — making developers think Node.js isn't installed, when the real issue is **the code isn't even present on the runner**.

---

## 🛠️ Phase 2: Implementation Drill

### Minimal Working Example
```yaml
name: Basic Checkout

on: push

jobs:
  checkout-demo:
    runs-on: ubuntu-latest
    steps:
      - name: Show empty workspace
        run: |
          echo "Current directory:"
          pwd
          echo "Files in workspace BEFORE checkout:"
          ls -la || echo "Directory is empty!"
      
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Show workspace after checkout
        run: |
          echo "Files in workspace AFTER checkout:"
          ls -la
          echo "We now have access to:"
          cat README.md || echo "No README found"
```

**What you'll see in logs:**
```
BEFORE checkout: Directory is empty!
AFTER checkout:  
  - .github/
  - src/
  - package.json
  - README.md
```

### Real-World Variation: Checking Out with Options
```yaml
- name: Checkout repository with full history
  uses: actions/checkout@v4
  with:
    fetch-depth: 0              # Fetch ALL commits (default is 1)
    submodules: 'recursive'     # Include submodules
    lfs: true                   # Download Git LFS files
    token: ${{ secrets.PAT }}   # Use Personal Access Token for private repos
```

**When to use `fetch-depth: 0`:**
- Semantic versioning tools (need git tags)
- Code coverage delta analysis (compare with previous commits)
- Changelog generation

**Cost:** More commits = slower checkout. For a repo with 10,000 commits:
- `fetch-depth: 1` → 5 seconds ⚡
- `fetch-depth: 0` → 45 seconds 🐌

### 🎯 Practice Exercise
**Your Turn:** Create a workflow that:
1. Checks out your repository
2. Displays the current branch name using `git branch --show-current`
3. Shows the last commit message using `git log -1 --pretty=format:"%s"`

<details>
<summary>💡 Hint</summary>

- After checkout, Git is available and already configured
- Use `run:` commands with the git CLI
</details>

<details>
<summary>✅ Solution</summary>

```yaml
name: Repository Information

on: push

jobs:
  repo-info:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Display branch
        run: |
          echo "Current branch:"
          git branch --show-current
      
      - name: Display last commit
        run: |
          echo "Last commit message:"
          git log -1 --pretty=format:"%s"
```
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Mini-Problem: Multi-Branch Checkout
Create a workflow that:
- Checks out the `main` branch (regardless of which branch triggered the workflow)
- Compares it to the current branch
- Lists files that differ between them

**Hints:**
- Use `ref:` parameter in checkout action
- Use `git diff --name-only` to compare

**Difficulty:** ⭐⭐⭐ (Intermediate)

<details>
<summary>✅ Solution with Explanation</summary>

```yaml
name: Cross-Branch Comparison

on: push

jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      # First, checkout the branch that triggered the workflow
      - name: Checkout current branch
        uses: actions/checkout@v4
        with:
          path: 'current'  # Clone into 'current' subdirectory
      
      # Then, checkout main branch
      - name: Checkout main branch
        uses: actions/checkout@v4
        with:
          ref: 'main'
          path: 'main'  # Clone into 'main' subdirectory
      
      - name: Compare branches
        run: |
          echo "Files changed between main and current branch:"
          cd current
          git diff --name-only ../main
```

**Code Review:**

✅ **What's Excellent:**
- Using `path:` parameter to checkout multiple branches
- Prevents checkout conflicts

⚠️ **Advanced Alternative:**
```yaml
steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0  # Fetch all branches
  
  - name: Compare with main
    run: |
      git fetch origin main
      git diff --name-only origin/main...${{ github.ref_name }}
```

This is more efficient (only one checkout), but requires understanding of Git fetch mechanics.

</details>

---

## 🎓 Phase 4: Pro-Tips & Gotchas

### 🔍 Understanding Checkout Behavior

```yaml
# Default behavior (shallow clone, minimal history)
- uses: actions/checkout@v4
# Equivalent to: git clone --depth=1 <repo>
```

**What this includes:**
- ✅ Current branch/commit
- ✅ Workflow files (`.github/workflows/`)
- ✅ All tracked files in the commit
- ❌ Other branches (unless explicitly fetched)
- ❌ Full git history
- ❌ Git tags (unless fetch-depth: 0)

### ⚡ Performance Optimization

```yaml
# ❌ SLOW: Checks out everything
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    lfs: true

# ✅ FAST: Only what you need
- uses: actions/checkout@v4
  # Uses defaults (depth=1, no LFS)
```

**When to use sparse checkout (advanced):**
```yaml
- uses: actions/checkout@v4
  with:
    sparse-checkout: |
      src/
      package.json
      package-lock.json
    # Skips docs/, tests/, etc. → Faster checkout for large repos
```

### 🔒 Security: Working with Private Repositories

**Scenario:** Your workflow needs to access ANOTHER private repository

```yaml
steps:
  - name: Checkout main repo (automatic auth)
    uses: actions/checkout@v4
  
  - name: Checkout private dependency
    uses: actions/checkout@v4
    with:
      repository: myorg/private-shared-lib
      token: ${{ secrets.PAT }}  # Personal Access Token
      path: 'shared-lib'
```

**Why default token fails:**
The automatic `GITHUB_TOKEN` only has access to the current repository. For external repos, you need a PAT with `repo` scope.

### 🚨 Common Mistakes

| ❌ Problem | ✅ Solution |
|-----------|-----------|
| **"package.json not found"** | Add `actions/checkout` BEFORE running build commands |
| **"Git tag not found"** | Use `fetch-depth: 0` to fetch all tags |
| **Submodule is empty** | Use `submodules: 'recursive'` |
| **Large repo takes 5 minutes** | Use `sparse-checkout` to only clone needed paths |
| **Checkout fails on pull request** | Default behavior is correct; checks out PR merge commit |

### 🎯 Checkout on Pull Requests (Important!)

```yaml
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        # ⚠️ This checks out the MERGE COMMIT, not the PR branch!
```

**What GitHub does automatically:**
1. Creates a synthetic merge commit (PR branch + target branch)
2. Checks out that merge commit
3. Runs your tests on the "merged" state

**Why:** Tests should validate what happens AFTER merging, not just the PR branch in isolation.

**To checkout the actual PR branch:**
```yaml
- uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha }}
```

### 🏆 Pro Pattern: Conditional Checkout

```yaml
steps:
  - name: Checkout for push events
    if: github.event_name == 'push'
    uses: actions/checkout@v4
  
  - name: Checkout for PR with full history
    if: github.event_name == 'pull_request'
    uses: actions/checkout@v4
    with:
      fetch-depth: 0
      ref: ${{ github.event.pull_request.head.sha }}
```

**Use case:** Different checkout strategies for different events (e.g., full history for PRs to run analysis, shallow for pushes).

### 🔧 Debugging Checkout Issues

```yaml
- uses: actions/checkout@v4

- name: Debug checkout
  run: |
    echo "=== Git Status ==="
    git status
    echo "=== Git Branch ==="
    git branch -a
    echo "=== Git Log (last 3) ==="
    git log --oneline -3
    echo "=== Files in workspace ==="
    ls -la
```

Add this after checkout when debugging mysterious failures.

---

## 📚 Quick Reference: Checkout Parameters

| Parameter | Default | When to Use |
|-----------|---------|-------------|
| `fetch-depth` | `1` | Set to `0` for full history (semantic versioning, changelogs) |
| `ref` | Triggering branch | Specify to checkout different branch/tag/commit |
| `path` | `.` (root) | Checkout multiple repos or different locations |
| `submodules` | `false` | Set to `true` or `recursive` if using Git submodules |
| `lfs` | `false` | Set to `true` if using Git LFS for large files |
| `token` | `${{ github.token }}` | Use PAT for private repos or cross-org access |

---

## 🎯 Knowledge Check

Before continuing, verify you understand:
- [ ] Why `actions/checkout` is necessary (runner starts empty)
- [ ] What `fetch-depth` controls and its performance impact
- [ ] How to check out multiple repositories
- [ ] Difference between checkout on `push` vs `pull_request` events
- [ ] When to use `ref` parameter
- [ ] How to debug checkout-related failures

**Next Chapter:** [GitHub Action Core Components](chapter-04-core-components.md)
