# Chapter 1: Create and Run Your First Workflow

## 🎯 Phase 1: Core Explanation

### The Doorbell Analogy
Think of GitHub Actions workflows like **automated assistants in your house**. Imagine you have a smart home where certain events trigger specific routines:
- Someone rings the doorbell (push event) → Turn on porch lights, unlock door
- It's 7 AM (schedule event) → Start coffee maker, open blinds
- You say "movie time" (manual dispatch) → Dim lights, close curtains, turn on TV

GitHub Actions workflows work exactly the same way — you define **what happens** (workflow) **when something occurs** (trigger event).

### One-Sentence Definition
**A workflow is an automated process defined in a YAML file that runs one or more jobs when triggered by specific events in your GitHub repository.**

### Connection to DevOps
In traditional DevOps, you'd manually SSH into servers to run tests, build code, or deploy applications. GitHub Actions **automates that entire chain** — from code push to production deployment — all defined as code in a single YAML file. This is the foundation of modern CI/CD.

### 💡 Surprising Fact from Production
Most engineers don't realize that **workflows are YAML files stored in `.github/workflows/` directory**. I've seen teams waste hours debugging "why my workflow isn't running" only to discover they named the folder `github/workflows` (missing the dot!) or placed the YAML file in the root directory. The location is **non-negotiable**.

---

## 🛠️ Phase 2: Implementation Drill

### Minimal Working Example
This is the simplest possible workflow — it just prints "Hello World" when you push code:

```yaml
# .github/workflows/hello.yml
name: My First Workflow

on: push

jobs:
  say-hello:
    runs-on: ubuntu-latest
    steps:
      - name: Print greeting
        run: echo "Hello, GitHub Actions!"
```

**Breakdown:**
- `name`: What you see in the GitHub UI
- `on: push`: Triggers on ANY push to ANY branch
- `jobs`: Container for one or more jobs
- `runs-on`: Which operating system to use (ubuntu-latest, windows-latest, macos-latest)
- `steps`: Actual commands to execute
- `run`: Shell command to execute

### Real-World Variation
Here's how you'd actually use this in a real project — running on specific branches only:

```yaml
# .github/workflows/welcome.yml
name: Welcome New Contributors

on:
  push:
    branches:
      - main
      - develop

jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Show event info
        run: |
          echo "🎉 Workflow triggered by: ${{ github.actor }}"
          echo "📝 Commit message: ${{ github.event.head_commit.message }}"
          echo "🌿 Branch: ${{ github.ref_name }}"
```

### 🎯 Practice Exercise
**Your Turn:** Modify the workflow above to:
1. Change the workflow name to "My Custom Workflow"
2. Make it run only on pushes to a branch named `feature-test`
3. Add a third step that prints "Workflow completed successfully!"

<details>
<summary>💡 Hint (click if stuck after 5 minutes)</summary>

- For branch filtering: Use `branches: [feature-test]` under `on.push`
- For adding a step: Copy the existing step block and change the `name` and `run` fields
</details>

<details>
<summary>✅ Solution</summary>

```yaml
name: My Custom Workflow

on:
  push:
    branches:
      - feature-test

jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Show event info
        run: |
          echo "🎉 Workflow triggered by: ${{ github.actor }}"
          echo "📝 Commit message: ${{ github.event.head_commit.message }}"
          echo "🌿 Branch: ${{ github.ref_name }}"
      
      - name: Completion message
        run: echo "Workflow completed successfully!"
```
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Mini-Problem
Create a workflow that:
- Runs when you push to the `main` branch
- Has TWO jobs:
  - Job 1: Prints "Starting CI/CD pipeline"
  - Job 2: Prints "Workflow finished" and shows the repository name using `${{ github.repository }}`

**Difficulty:** ⭐⭐ (Beginner+)

<details>
<summary>✅ Solution with Explanation</summary>

```yaml
name: Multi-Job Pipeline

on:
  push:
    branches:
      - main

jobs:
  start:
    runs-on: ubuntu-latest
    steps:
      - name: Pipeline start
        run: echo "Starting CI/CD pipeline"
  
  finish:
    runs-on: ubuntu-latest
    steps:
      - name: Pipeline complete
        run: |
          echo "Workflow finished"
          echo "Repository: ${{ github.repository }}"
```

**What's correct:**
- ✅ Proper YAML structure with indentation
- ✅ Branch filtering on `main`
- ✅ Two separate jobs with descriptive names
- ✅ Using GitHub context (`github.repository`)

**What could be improved:**
- ⚠️ Jobs run in parallel by default. If you wanted `finish` to run AFTER `start`, you'd need `needs: [start]` in the finish job
- ⚠️ No error handling (we'll learn this later)

</details>

---

## 🎓 Phase 4: Pro-Tips & Gotchas

### ⚡ Performance Optimization
```yaml
# ❌ BAD: Triggers on EVERY push (wastes runner minutes)
on: push

# ✅ GOOD: Triggers only on specific branches
on:
  push:
    branches: [main, develop]
    paths-ignore:
      - '**.md'          # Ignore markdown changes
      - 'docs/**'        # Ignore documentation folder
```

**Why it matters:** GitHub gives you 2,000 free runner minutes/month for private repos. Unnecessary workflow runs on README updates can exhaust this quickly.

### 🔒 Security Consideration
```yaml
# ⚠️ DANGEROUS on public repos
on: pull_request_target  # Can expose secrets to malicious PRs

# ✅ SAFE for most cases
on: pull_request          # Runs in the context of the fork
```

### 🚨 Common Anti-Patterns I've Seen

| ❌ Mistake | ✅ Correct Approach | Why It Matters |
|-----------|-------------------|----------------|
| Naming file `workflow.yml` in root directory | Place in `.github/workflows/myworkflow.yml` | GitHub only looks in this specific folder |
| Using tabs for indentation | Use 2 spaces for YAML | YAML spec doesn't allow tabs |
| `on: [push, pull_request]` without branch filters | Filter by branches and paths | Saves runner minutes and reduces noise |
| Forgetting the `.yml` extension | Always use `.yml` or `.yaml` | GitHub won't detect the workflow otherwise |

### 🎯 Debugging Checklist
When your workflow doesn't trigger:
1. ✅ Is the file in `.github/workflows/` directory?
2. ✅ Does the filename end with `.yml` or `.yaml`?
3. ✅ Is the YAML valid? (Use a YAML validator)
4. ✅ Does the trigger match your action? (e.g., pushing to `main` when workflow listens to `develop`)
5. ✅ Check the "Actions" tab in GitHub for error messages

### 🏆 Pro Pattern: Self-Documenting Workflows
```yaml
name: 🚀 CI Pipeline

on:
  push:
    branches: [main]

jobs:
  test:
    name: 🧪 Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: ⚙️ Setup environment
        run: echo "Setting up..."
      
      - name: ✅ Execute tests
        run: echo "Running tests..."
```

Using emojis and descriptive names makes the GitHub UI much more scannable, especially when debugging failed workflows at 2 AM! 🌙

---

## 📝 Quick Reference

```yaml
# Essential workflow anatomy
name: Workflow Name                    # Shows in GitHub UI
on: trigger_event                      # What starts the workflow
jobs:                                  # Container for all jobs
  job_id:                             # Unique identifier
    runs-on: ubuntu-latest            # Runner OS
    steps:                            # Sequential tasks
      - name: Step description        # Shows in logs
        run: shell command            # What to execute
```

---

## 🎯 Knowledge Check

Before moving to the next chapter, you should be able to:
- [ ] Create a workflow file in the correct directory
- [ ] Explain what each key in the workflow YAML does
- [ ] Trigger a workflow by pushing to a specific branch
- [ ] View workflow results in the GitHub Actions tab
- [ ] Use basic GitHub context variables like `github.actor` and `github.repository`

**Next Chapter:** [What are Actions](chapter-02-what-are-actions.md)
