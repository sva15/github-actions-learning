# Chapter 2: What Are Actions?

## 🎯 Phase 1: Core Explanation

### The Power Tool Analogy
Think of **Actions** like **power tools in a workshop**:

- You can build furniture using **raw materials** (writing shell commands yourself)
- OR you can use **pre-built power tools** (Actions) that others have perfected

For example:
- Instead of writing 15 lines of bash to install Node.js → Use `actions/setup-node@v4`
- Instead of crafting complex Docker commands → Use `docker/build-push-action@v5`
- Instead of manually checking out code → Use `actions/checkout@v4`

**Actions are reusable units of code** that perform specific tasks, created by GitHub, verified partners, or the community.

### One-Sentence Definition
**An Action is a reusable, pre-packaged step that performs a specific task in your workflow, like checking out code, setting up languages, or deploying to cloud platforms.**

### Connection to Previous Concepts
In Chapter 1, you wrote workflows with `run:` commands executing shell scripts. **Actions let you replace repetitive shell commands with battle-tested, maintained solutions.** Think of it as the difference between writing your own authentication system vs. using OAuth libraries.

### 💡 Surprising Fact from Production
**GitHub Marketplace has 20,000+ actions**, but I've seen teams waste weeks building custom actions for common tasks like "send Slack notifications" or "upload to S3" — both already exist with thousands of stars and active maintenance. **Always search the Marketplace first** before building custom solutions.

---

## 🛠️ Phase 2: Implementation Drill

### Minimal Working Example (Without Actions)
First, let's see the "manual" way to checkout code and run a script:

```yaml
# .github/workflows/manual-way.yml
name: Manual Approach

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Manually clone repository
        run: |
          git clone https://github.com/${{ github.repository }}.git
          cd $(basename ${{ github.repository }})
          git checkout ${{ github.sha }}
      
      - name: List files
        run: ls -la
```

**Problems with this:**
- ❌ Verbose and error-prone
- ❌ Doesn't handle authentication correctly
- ❌ Might fail with submodules or sparse checkouts

### Real-World Variation (Using Actions)
Now the **professional way** — using the official `checkout` action:

```yaml
# .github/workflows/using-actions.yml
name: Using Actions

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # This ONE line replaces the entire manual approach
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: List files
        run: ls -la
```

**What `uses:` does:**
- `actions/checkout@v4` → Owner/RepoName@Version
- `@v4` is the version tag (can also use commit SHA for security)
- Automatically handles: authentication, submodules, LFS, sparse checkout

### Anatomy of an Action

```yaml
- name: Human-readable step name
  uses: owner/repo@version    # Which action to use
  with:                       # Input parameters for the action
    key1: value1
    key2: value2
```

### Example: Setup Node.js
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'        # Input parameter
    cache: 'npm'              # Another input parameter
```

### 🎯 Practice Exercise
**Your Turn:** Create a workflow that:
1. Uses `actions/checkout@v4` to checkout your code
2. Uses `actions/setup-python@v5` to install Python 3.11
3. Runs `python --version` to verify installation

<details>
<summary>💡 Hint</summary>

- Look at the setup-node example above — setup-python has similar syntax
- The input parameter for Python version is `python-version: '3.11'`
</details>

<details>
<summary>✅ Solution</summary>

```yaml
name: Python Setup Demo

on: push

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Verify Python installation
        run: python --version
```
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Mini-Problem: Multi-Language Setup
Create a workflow that sets up BOTH Node.js and Python, then verifies both installations:

**Requirements:**
- Checkout the repository
- Setup Node.js version 20 with npm caching
- Setup Python 3.11
- Print both versions

**Difficulty:** ⭐⭐ (Beginner+)

<details>
<summary>✅ Solution with Code Review</summary>

```yaml
name: Multi-Language Environment

on: push

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Verify installations
        run: |
          echo "Node version:"
          node --version
          echo "NPM version:"
          npm --version
          echo "Python version:"
          python --version
```

**Code Review Feedback:**

✅ **What's Excellent:**
- Proper action versioning (@v4, @v5)
- Using `cache: 'npm'` — this caches node_modules and can save 30-60 seconds per workflow run!
- Clean separation of setup and verification steps

⚠️ **What Could Be Improved:**
```yaml
# Instead of this:
with:
  node-version: '20'

# Consider this for consistency across environments:
with:
  node-version: '20.x'  # Uses latest 20.x version
```

**Why:** `'20'` might resolve to different patch versions over time, while `'20.x'` is explicit and documented.

</details>

---

## 🎓 Phase 4: Pro-Tips & Gotchas

### 🔍 How to Find Actions

1. **GitHub Marketplace:** https://github.com/marketplace?type=actions
2. **Search patterns:**
   - `actions/` → Official GitHub actions
   - `docker/` → Official Docker actions
   - `aws-actions/` → Official AWS actions

### ⚡ Version Pinning Best Practices

```yaml
# ❌ DANGEROUS: Uses whatever is in main (can break unexpectedly)
uses: actions/checkout@main

# ⚠️ RISKY: Major version (gets updates automatically)
uses: actions/checkout@v4

# ✅ SAFE: Full version tag (predictable, but misses patches)
uses: actions/checkout@v4.1.1

# 🔒 MOST SECURE: Pin to commit SHA (immutable, but hard to update)
uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

**My Recommendation for Production:**
- Use major version tags (@v4) for **well-maintained official actions**
- Use full version (@v4.1.1) for **third-party actions**
- Use commit SHA for **security-critical workflows**

### 🚨 Common Mistakes

| ❌ Mistake | ✅ Fix | Why |
|-----------|--------|-----|
| `uses: checkout@v4` | `uses: actions/checkout@v4` | Must include owner/repo |
| `uses: actions/checkout` | `uses: actions/checkout@v4` | Must specify version |
| Using deprecated actions | Check action README for notices | Actions get archived |
| Not reading action inputs | Read the `action.yml` or README | Missing required inputs = failure |

### 🎯 How to Read Action Documentation

When you visit an action on GitHub (e.g., `actions/setup-node`):

1. **README.md** → Usage examples and common scenarios
2. **action.yml** → Definitive source of all inputs and outputs
3. **Releases** → Check for breaking changes between versions

Example from `actions/setup-node@v4`:
```yaml
inputs:
  node-version:
    description: 'Version Spec of the version to use.'
    required: false
  cache:
    description: 'Used to specify a package manager for caching.'
    required: false
```

### 🏆 Pro Pattern: Reusable Action Combinations

```yaml
# Common pattern I use in every project
steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0  # Fetch all history (needed for versioning tools)
  
  - uses: actions/setup-node@v4
    with:
      node-version-file: '.nvmrc'  # Read version from file!
      cache: 'npm'
```

**Why `node-version-file` is brilliant:** Your local dev environment and CI use the SAME version definition. One source of truth!

### 💰 Cost Optimization with Actions

```yaml
# This action caches dependencies, reducing build time by 70%
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

**Impact:** A 5-minute workflow becomes 1.5 minutes. On 50 runs/day, you save 2.916 hours of runner time/day = ~88 hours/month = **$44/month in runner costs** for private repos!

### 🔑 Marketplace Action Quality Checklist

Before using a third-party action, verify:
- ✅ Has 1,000+ stars or verified creator badge
- ✅ Recently updated (within 6 months)
- ✅ Has clear documentation
- ✅ Source code is readable (not obfuscated)
- ✅ No open security issues in "Dependabot" tab

---

## 📚 Essential Actions Reference

| Category | Action | Purpose |
|----------|--------|---------|
| **Setup** | `actions/checkout@v4` | Clone your repository |
| **Languages** | `actions/setup-node@v4` | Install Node.js |
| | `actions/setup-python@v5` | Install Python |
| | `actions/setup-java@v4` | Install Java/JDK |
| | `actions/setup-go@v5` | Install Go |
| **Caching** | `actions/cache@v3` | Cache dependencies |
| **Artifacts** | `actions/upload-artifact@v4` | Save build outputs |
| | `actions/download-artifact@v4` | Retrieve build outputs |
| **GitHub** | `actions/github-script@v7` | Run JavaScript using GitHub API |

---

## 🎯 Knowledge Check

Before moving forward, ensure you can:
- [ ] Explain the difference between `run:` and `uses:`
- [ ] Find actions in GitHub Marketplace
- [ ] Read action documentation to find required inputs
- [ ] Use version pinning correctly
- [ ] Combine multiple actions in one workflow
- [ ] Understand when to use an action vs. writing shell commands

**Next Chapter:** [Code Repository](chapter-03-code-repository.md)
