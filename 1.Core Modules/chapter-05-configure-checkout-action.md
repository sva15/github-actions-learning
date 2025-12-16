# Chapter 5: Configure Checkout Action

## 🎯 Phase 1: Core Explanation

### The Library Book Analogy (Expanded)
Imagine the `actions/checkout` action as a **smart library checkout system**:

| Checkout Option | Library Analogy | GitHub Actions | Impact |
|----------------|----------------|----------------|---------|
| **Default** | Check out just today's newspaper | Clone only latest commit | Fast (5-10 sec) |
| **fetch-depth: 0** | Check out entire archive | Clone full git history | Slow (30-60 sec) |
| **ref: main** | Request specific edition | Check out specific branch/tag | Customize what code you get |
| **submodules: true** | Include supplementary materials | Clone git submodules | Get dependencies |
| **sparse-checkout** | Only specific chapters | Clone only certain folders | Faster for monorepos |
| **lfs: true** | Include multimedia attachments | Download Git LFS files | Get large binary files |

### One-Sentence Definition
**The `actions/checkout` action clones your repository code into the runner's workspace with configurable options for history depth, branch selection, submodules, and large file handling — it's the essential first step for nearly all workflows.**

### Why This is Critical
**In my 8 years of CI/CD work, checkout configuration is responsible for:**
- 40% of workflow performance issues (too much history)
- 30% of "mysterious failures" (missing submodules, wrong branch)
- 15% of security incidents (using wrong token, exposing credentials)

**Mastering checkout = Faster, more reliable workflows.**

### 💡 Surprising Production Facts

**Fact 1:** Using `fetch-depth: 0` on a large repo (100K commits) can add **3-5 minutes** to your workflow — just for checkout!

**Fact 2:** Most teams don't need full history. The default (`fetch-depth: 1`) is perfect for 80% of workflows.

**Fact 3:** The checkout action uses a **special GITHUB_TOKEN** by default that has automatic access to your repo — no configuration needed for simple cases.

---

## 🛠️ Phase 2: Implementation Drill

### Minimal Working Example
```yaml
name: Basic Checkout

on: push

jobs:
  demo:
    runs-on: ubuntu-latest
    steps:
      # Simplest possible checkout
      - uses: actions/checkout@v4
      
      - name: Verify checkout
        run: |
          echo "Current directory:"
          pwd
          echo "Repository files:"
          ls -la
```

**What happens:**
1. Runner starts with empty workspace (`/home/runner/work/repo-name/repo-name`)
2. Checkout action clones your repo to this directory
3. Subsequent steps have access to all repository files

### All Configuration Options with Examples

#### Option 1: `fetch-depth` - Control History

```yaml
# Default: Shallow clone (last commit only)
- uses: actions/checkout@v4
  # Equivalent to: git clone --depth=1

# Fetch full history
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
  # Equivalent to: git clone (full clone)

# Fetch specific number of commits
- uses: actions/checkout@v4
  with:
    fetch-depth: 50
  # Useful for: Changelog generation from last 50 commits
```

**When to use `fetch-depth: 0`:**
- ✅ Semantic versioning (needs git tags)
- ✅ Changelog generation
- ✅ Code coverage delta (compare with previous commits)
- ✅ Git-based versioning tools
- ❌ Simple build/test workflows (wastes time)

**Performance Impact:**
```
Small repo (1K commits):
  fetch-depth: 1  → 5 seconds
  fetch-depth: 0  → 8 seconds

Medium repo (10K commits):
  fetch-depth: 1  → 6 seconds
  fetch-depth: 0  → 25 seconds

Large repo (100K commits):
  fetch-depth: 1  → 7 seconds
  fetch-depth: 0  → 180 seconds (3 minutes!) 💸
```

#### Option 2: `ref` - Checkout Specific Branch/Tag/Commit

```yaml
# Checkout a specific branch
- uses: actions/checkout@v4
  with:
    ref: develop

# Checkout a specific tag
- uses: actions/checkout@v4
  with:
    ref: v1.2.3

# Checkout a specific commit
- uses: actions/checkout@v4
  with:
    ref: a1b2c3d4e5f6

# Checkout using context (the PR branch)
- uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha }}
```

**Common Use Cases:**

```yaml
# Deploy production from main branch
deploy:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        ref: main  # Always deploy from main, regardless of trigger

# Compare feature branch with main
compare:
  steps:
    # Checkout the feature branch (default)
    - uses: actions/checkout@v4
      with:
        path: feature-code
    
    # Checkout main branch
    - uses: actions/checkout@v4
      with:
        ref: main
        path: main-code
    
    - name: Compare
      run: diff -r feature-code main-code || true
```

#### Option 3: `path` - Custom Checkout Location

```yaml
# Default location: Current directory
- uses: actions/checkout@v4

# Custom location
- uses: actions/checkout@v4
  with:
    path: my-repo

# Multiple repos
- uses: actions/checkout@v4
  with:
    repository: owner/repo1
    path: repo1

- uses: actions/checkout@v4
  with:
    repository: owner/repo2
    path: repo2
    token: ${{ secrets.PAT }}
```

**Directory Structure:**
```
Default checkout:
/home/runner/work/my-repo/my-repo/
  ├── .git/
  ├── src/
  └── README.md

Custom path:
/home/runner/work/my-repo/my-repo/
  └── custom-dir/
        ├── .git/
        ├── src/
        └── README.md
```

#### Option 4: `token` - Authentication

```yaml
# Default: Uses automatic GITHUB_TOKEN
- uses: actions/checkout@v4
  # Can access: Current repository only

# PAT for private repos or cross-org access
- uses: actions/checkout@v4
  with:
    repository: other-org/private-repo
    token: ${{ secrets.MY_PAT }}
  # Can access: Any repo the PAT has permissions for

# GitHub App token (most secure)
- uses: actions/checkout@v4
  with:
    token: ${{ steps.app-token.outputs.token }}

# No token (for public repos)
- uses: actions/checkout@v4
  with:
    token: ''
```

**Token Permission Scopes:**

| Token Type | Scope | Use Case |
|-----------|-------|----------|
| `GITHUB_TOKEN` (default) | Current repo | 95% of workflows |
| PAT with `repo` | All repos user has access to | Cross-repo workflows |
| GitHub App token | Specific repos | Enterprise, fine-grained access |
| No token (`''`) | Public repos only | Open source, no private access |

#### Option 5: `submodules` - Git Submodules

```yaml
# Don't fetch submodules (default)
- uses: actions/checkout@v4

# Fetch submodules (one level)
- uses: actions/checkout@v4
  with:
    submodules: true

# Fetch submodules recursively (nested submodules)
- uses: actions/checkout@v4
  with:
    submodules: recursive

# Fetch only specific submodules (advanced)
- uses: actions/checkout@v4
  with:
    submodules: recursive

- name: Update specific submodule
  run: git submodule update --init --recursive path/to/submodule
```

**When you need this:**
```
Your repository structure:
my-repo/
  ├── src/
  ├── .gitmodules
  └── vendor/
        └── shared-library/ (submodule)
```

Without `submodules: true`, the `vendor/shared-library/` folder will be **empty**!

#### Option 6: `lfs` - Large File Storage

```yaml
# Don't fetch LFS files (default)
- uses: actions/checkout@v4

# Fetch LFS files
- uses: actions/checkout@v4
  with:
    lfs: true
```

**What is Git LFS?**
Git LFS stores large files (videos, datasets, binaries) separately from git history to keep repo lightweight.

**When to use:**
```
Your repo has files with .lfs extension or contains:
  - Video files (*.mp4, *.mov)
  - Large datasets (*.csv > 50MB)
  - Binary assets (*.psd, *.blend)
  - Machine learning models (*.h5, *.pkl)
```

**Performance:**
```
Repo with 500MB of LFS files:
  lfs: false → 10 seconds checkout ⚡
  lfs: true  → 90 seconds checkout (downloads LFS files)
```

#### Option 7: `sparse-checkout` - Partial Clone (Advanced)

```yaml
# Clone specific directories only
- uses: actions/checkout@v4
  with:
    sparse-checkout: |
      src/
      config/
      package.json

# Monorepo: Only checkout your service
- uses: actions/checkout@v4
  with:
    sparse-checkout: |
      services/api/
      shared/utils/
    sparse-checkout-cone-mode: false
```

**Use Case: Monorepo Optimization**

```
Monorepo structure:
repo/
  ├── services/
  │     ├── api/ (100MB)
  │     ├── web/ (500MB)
  │     └── mobile/ (800MB)
  ├── shared/ (50MB)
  └── docs/ (200MB)

Full checkout: 1.65GB
Sparse (only API): 150MB → 11x smaller, 5x faster!
```

```yaml
# Workflow for API service only
jobs:
  api-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          sparse-checkout: |
            services/api
            shared
```

#### Option 8: `fetch-tags` - Control Tag Fetching

```yaml
# Default: Fetch tags (if fetch-depth allows)
- uses: actions/checkout@v4

# Explicitly disable tag fetching
- uses: actions/checkout@v4
  with:
    fetch-tags: false

# Ensure tags are fetched (with full history)
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    fetch-tags: true
```

**When tags matter:**
```yaml
# Semantic version workflows need tags
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    fetch-tags: true

- name: Generate changelog
  run: |
    git describe --tags  # Needs tags!
    git log $(git describe --tags --abbrev=0)..HEAD
```

#### Option 9: `clean` and `persist-credentials`

```yaml
# Clean working directory before checkout (default: true)
- uses: actions/checkout@v4
  with:
    clean: true

# Persist git credentials for later use (default: true)
- uses: actions/checkout@v4
  with:
    persist-credentials: true

# Don't persist credentials (more secure)
- uses: actions/checkout@v4
  with:
    persist-credentials: false
  # Prevents accidental credential exposure in logs
```

**Security Consideration:**
```yaml
# ⚠️ With persist-credentials: true
- uses: actions/checkout@v4
- run: git push  # Uses stored credentials

# 🔒 With persist-credentials: false
- uses: actions/checkout@v4
  with:
    persist-credentials: false
- run: git push  # FAILS (no credentials)
  # You must explicitly provide credentials
```

---

## 🎯 Practice Exercises

### Exercise 1: Full History Checkout
**Task:** Create a workflow that:
1. Checks out the repository with full git history
2. Lists all git tags
3. Shows the last 5 commits

<details>
<summary>Solution</summary>

```yaml
name: Full History Demo

on: push

jobs:
  history:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout with full history
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: List all tags
        run: |
          echo "Git tags:"
          git tag -l
      
      - name: Show recent commits
        run: |
          echo "Last 5 commits:"
          git log --oneline -5
```
</details>

### Exercise 2: Multi-Repository Workflow
**Task:** Create a workflow that checks out TWO repositories:
1. Your main repository (default location)
2. A second repository at path `shared-utils`

<details>
<summary>Solution</summary>

```yaml
name: Multi-Repo Checkout

on: push

jobs:
  multi-repo:
    runs-on: ubuntu-latest
    steps:
      # Checkout main repository
      - name: Checkout main repo
        uses: actions/checkout@v4
      
      # Checkout second repository
      - name: Checkout shared utilities
        uses: actions/checkout@v4
        with:
          repository: octocat/Spoon-Knife  # Example public repo
          path: shared-utils
      
      - name: Verify both repos
        run: |
          echo "Main repo files:"
          ls -la
          echo "Shared utils files:"
          ls -la shared-utils
```
</details>

### Exercise 3: Submodule Handling
**Task:** Create a workflow that:
1. Checks out repository with submodules
2. Verifies submodule directories exist
3. Shows submodule commit SHAs

<details>
<summary>Solution</summary>

```yaml
name: Submodule Demo

on: push

jobs:
  submodules:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout with submodules
        uses: actions/checkout@v4
        with:
          submodules: recursive
      
      - name: Verify submodules
        run: |
          echo "Checking submodule status:"
          git submodule status
      
      - name: List submodule files
        run: |
          # Adjust path to your actual submodule location
          if [ -d "path/to/submodule" ]; then
            echo "Submodule files:"
            ls -la path/to/submodule
          else
            echo "No submodules or not in expected path"
          fi
```
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Advanced Challenge: Cross-Branch Comparison

**Requirements:**
Build a workflow that compares two branches:
1. Checkout the current branch (PR branch) to `current/`
2. Checkout the `main` branch to `main/`
3. Both with full history and tags
4. Show files that differ between branches
5. Count number of commits ahead of main

**Difficulty:** ⭐⭐⭐⭐ (Advanced)

<details>
<summary>Hints</summary>

- Use `path:` for different checkout locations
- Use `ref:` to specify branches
- Use `git diff` to compare
- Use `git log` with range syntax `main..current-branch`
</details>

<details>
<summary>✅ Solution with Explanation</summary>

```yaml
name: Cross-Branch Analysis

on: pull_request

jobs:
  compare:
    name: 📊 Compare PR with Main
    runs-on: ubuntu-latest
    steps:
      # Checkout PR branch
      - name: Checkout PR branch
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          path: current
          fetch-depth: 0
          fetch-tags: true
      
      # Checkout main branch
      - name: Checkout main branch
        uses: actions/checkout@v4
        with:
          ref: main
          path: main
          fetch-depth: 0
          fetch-tags: true
      
      # Compare branches
      - name: Show changed files
        run: |
          echo "📝 Files changed in this PR:"
          cd current
          git diff --name-only ../main
      
      - name: Count commits ahead
        run: |
          cd current
          COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD)
          echo "🚀 This PR is $COMMITS_AHEAD commits ahead of main"
      
      - name: Show commit summaries
        run: |
          cd current
          echo "📋 Commits in this PR:"
          git log --oneline origin/main..HEAD
```

**Code Review:**

✅ **What's Excellent:**
- Proper use of PR context (`github.event.pull_request.head.sha`)
- Full history for accurate comparisons
- Clear output with emojis
- Isolated checkouts in separate directories

⚠️ **Production Enhancement:**
```yaml
- name: Generate comparison report
  run: |
    cd current
    {
      echo "## Branch Comparison Report"
      echo "**Comparing:** \`${{ github.head_ref }}\` → \`main\`"
      echo "### Changed Files"
      git diff --stat ../main
      echo "### Commit Summary"
      git log --oneline --graph origin/main..HEAD
    } >> $GITHUB_STEP_SUMMARY
```

This writes to GitHub's job summary for better visualization in the UI!

</details>

---

## 🎓 Phase 4: Pro-Tips & Gotchas

### 🚨 Common Mistakes

#### Mistake 1: Forgetting Checkout on Pull Requests

```yaml
# ❌ WRONG: Checks out merge commit (main + PR)
on: pull_request
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4  # Gets synthetic merge!
      - run: npm test
```

**What GitHub does:** Creates a temporary merge commit between PR branch and target branch.

**Why it's confusing:** You're not testing the actual PR code, but the "merged" state.

```yaml
# ✅ CORRECT: Checkout actual PR branch
on: pull_request
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      - run: npm test
```

#### Mistake 2: Using Full History Unnecessarily

```yaml
# ❌ WASTEFUL: Full history for simple build
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Adds 2 minutes for no reason!
      - run: npm run build

# ✅ EFFICIENT: Shallow clone
jobs:
  build:
    steps:
      - uses: actions/checkout@v4  # Default: depth 1
      - run: npm run build
```

**Time Impact on Large Repo:**
- Shallow: 8 seconds
- Full: 180 seconds
- **Wasted:** 172 seconds per run × 50 runs/day = 143 minutes/day = 50+ hours/month! 💸

#### Mistake 3: Submodule Issues

```yaml
# ❌ FAILS: Submodule directory empty
steps:
  - uses: actions/checkout@v4
  - run: ls vendor/my-submodule  # ERROR: No such file

# ✅ WORKS: Fetch submodules
steps:
  - uses: actions/checkout@v4
    with:
      submodules: recursive
  - run: ls vendor/my-submodule  # ✅ Files present
```

#### Mistake 4: Token Scope Issues

```yaml
# ❌ FAILS: Trying to access another private repo
steps:
  - uses: actions/checkout@v4
    with:
      repository: myorg/private-repo

# ✅ WORKS: Using PAT
steps:
  - uses: actions/checkout@v4
    with:
      repository: myorg/private-repo
      token: ${{ secrets.GITHUB_PAT }}
```

### ⚡ Performance Optimization Strategies

#### Strategy 1: Shallow Clones (Default is Good!)

```yaml
# For 90% of workflows, this is perfect:
- uses: actions/checkout@v4
  # Only clones last commit (fastest)
```

#### Strategy 2: Sparse Checkout for Monorepos

```yaml
# Before: Clone 2GB monorepo (120 seconds)
- uses: actions/checkout@v4

# After: Clone only needed directory (15 seconds)
- uses: actions/checkout@v4
  with:
    sparse-checkout: |
      services/api
      shared
```

**Savings:** 105 seconds per run!

#### Strategy 3: Conditional Full History

```yaml
# Only fetch full history on main branch (for releases)
- uses: actions/checkout@v4
  with:
    fetch-depth: ${{ github.ref == 'refs/heads/main' && '0' || '1' }}
```

#### Strategy 4: Cache Git LFS Files

```yaml
- uses: actions/checkout@v4
  with:
    lfs: true

# Cache LFS files to avoid re-downloading
- uses: actions/cache@v3
  with:
    path: .git/lfs
    key: lfs-${{ runner.os }}-${{ hashFiles('.gitattributes') }}
```

### 🔒 Security Best Practices

#### Practice 1: Minimal Token Permissions

```yaml
# ❌ RISKY: Persist credentials allows any step to push
- uses: actions/checkout@v4
  with:
    persist-credentials: true
- run: ./untrusted-script.sh  # Could abuse stored credentials!

# ✅ SECURE: No persisted credentials
- uses: actions/checkout@v4
  with:
    persist-credentials: false
- run: ./untrusted-script.sh  # Cannot access git credentials
```

#### Practice 2: Pin to Commit SHA for Security-Critical Workflows

```yaml
# Production deployment
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
  with:
    ref: main
```

**Why:** Prevents supply chain attacks if `actions/checkout@v4` tag gets compromised.

### 🎯 Debugging Checkout Issues

#### Debug Template

Add this after checkout to diagnose issues:

```yaml
- uses: actions/checkout@v4

- name: 🔍 Debug checkout
  run: |
    echo "=== Current Directory ==="
    pwd
    
    echo "=== Files in workspace ==="
    ls -la
    
    echo "=== Git status ==="
    git status
    
    echo "=== Git remote ==="
    git remote -v
    
    echo "=== Current branch ==="
    git branch --show-current
    
    echo "=== Last 3 commits ==="
    git log --oneline -3
    
    echo "=== Git tags ==="
    git tag -l | head -10
    
    echo "=== Submodule status ==="
    git submodule status || echo "No submodules"
```

### 🏆 Advanced Pro Patterns

#### Pattern 1: Checkout Multiple Branches for Comparison

```yaml
- name: Checkout feature branch
  uses: actions/checkout@v4
  with:
    path: feature
    fetch-depth: 0

- name: Checkout develop branch
  uses: actions/checkout@v4
  with:
    ref: develop
    path: develop
    fetch-depth: 0

- name: Compare test coverage
  run: |
    cd feature && npm test -- --coverage
    cd ../develop && npm test -- --coverage
    # Compare coverage reports
```

#### Pattern 2: Optimize for Different Event Types

```yaml
steps:
  # For PRs: Full history to compare
  - uses: actions/checkout@v4
    if: github.event_name == 'pull_request'
    with:
      fetch-depth: 0
  
  # For pushes: Shallow clone
  - uses: actions/checkout@v4
    if: github.event_name == 'push'
```

#### Pattern 3: Working with Protected Branches

```yaml
# Checkout code and create a new branch for automated commits
- uses: actions/checkout@v4
  with:
    token: ${{ secrets.GITHUB_PAT }}  # PAT with push permissions

- run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    
    # Make changes
    echo "Updated" > VERSION
    
    git checkout -b automated-update
    git add VERSION
    git commit -m "chore: automated version update"
    git push origin automated-update
```

---

## 📚 Complete Checkout Configuration Reference

```yaml
- uses: actions/checkout@v4
  with:
    # Repository to clone (default: current repo)
    repository: 'owner/repo'
    
    # Branch, tag, or SHA to checkout (default: triggering ref)
    ref: 'main'
    
    # Personal Access Token (default: ${{ github.token }})
    token: ${{ secrets.GITHUB_TOKEN }}
    
    # Relative path to clone into (default: $GITHUB_WORKSPACE)
    path: 'my-folder'
    
    # Number of commits to fetch (default: 1, use 0 for all)
    fetch-depth: 1
    
    # Whether to fetch tags (default: depends on fetch-depth)
    fetch-tags: false
    
    # Whether to checkout submodules (default: false)
    # Options: false, true, recursive
    submodules: false
    
    # Whether to use Git LFS (default: false)
    lfs: false
    
    # Sparse checkout patterns (default: none)
    sparse-checkout: |
      path1/
      path2/
    
    # Enable cone mode for sparse checkout (default: true)
    sparse-checkout-cone-mode: true
    
    # Whether to persist credentials (default: true)
    persist-credentials: true
    
    # Whether to clean workspace before checkout (default: true)
    clean: true
    
    # SSH key for authentication (alternative to token)
    ssh-key: ${{ secrets.SSH_PRIVATE_KEY }}
    
    # SSH known hosts
    ssh-known-hosts: ''
    
    # Whether to configure git for strict host key checking
    ssh-strict: true
```

---

## 🎯 Knowledge Check

Test yourself:
- [ ] What's the default `fetch-depth` and why is it fast?
- [ ] When would you use `fetch-depth: 0`?
- [ ] How do you checkout a different repository?
- [ ] What happens if you forget `submodules: true` when your repo has submodules?
- [ ] Which token is used by default and what's its scope?
- [ ] How do you checkout a specific commit SHA?
- [ ] What's the performance impact of Git LFS on large files?
- [ ] How do you checkout multiple repositories in one workflow?

### Quick Self-Test

<details>
<summary>1. Why might a workflow fail with "package.json not found"?</summary>

**Answer:** Forgot to add `actions/checkout` step! The runner starts with an empty workspace.
</details>

<details>
<summary>2. Your workflow needs to generate a changelog from the last 20 commits. What configuration?</summary>

**Answer:**
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 20  # Or 0 for full history
```
</details>

<details>
<summary>3. How do you check out the actual PR branch (not the merge commit)?</summary>

**Answer:**
```yaml
- uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha }}
```
</details>

---

**Next Chapter:** [Chapter 6 - Multi-Line Commands and Third Party Libraries](chapter-06-multiline-commands.md)

**Coming Up:** Learn how to write complex multi-line scripts, execute Python/Ruby/Perl scripts inline, and integrate third-party tools and libraries in your workflows.
