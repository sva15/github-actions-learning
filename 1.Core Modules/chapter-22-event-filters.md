# Chapter 22: Workflow Event Filters and Activity Types

## 🎯 Phase 1: Core Explanation

### The Smart Home Automation Analogy
Event activity types are like **smart home automation rules**:

| Smart Home | GitHub Actions |
|------------|----------------|
| "Turn on lights when door **opens**" | `on: pull_request: types: [opened]` |
| "Alert when motion **detected**" | `on: issues: types: [labeled]` |
| "Only bedroom lights" | `branches: [main]` |
| "Between 6-8 PM" | Path/file filters |

### One-Sentence Definition
**Event activity types are specific sub-events within broader GitHub events that enable workflows to trigger only on precise actions (like `labeled` within `pull_request`), while filters for branches, paths, and tags provide additional granular control over when workflows execute.**

### Why This Matters

**Problem:** Basic events are too broad
```yaml
on: pull_request  # Triggers on 20+ different PR actions!
```

**Solution:** Activity types provide precision
```yaml
on:
  pull_request:
    types: [opened, synchronize]  # Only new PRs and updates
```

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Pull Request Activity Types

```yaml
name: PR Workflow

on:
  pull_request:
    types:
      - opened          # PR first created
      - synchronize     # New commits pushed to PR
      - reopened        # Previously closed PR reopened
      - ready_for_review  # Changed from draft to ready
    
    branches:
      - main
      - develop

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

**Common PR Activity Types:**
- `opened` - New PR created
- `synchronize` - PR updated with new commits
- `reopened` - Closed PR reopened
- `labeled` / `unlabeled` - Labels changed
- `assigned` / `unassigned` - Assignees changed
- `review_requested` - Reviewer requested
- `ready_for_review` - Draft → Ready
- `converted_to_draft` - Ready → Draft
- `closed` - PR closed (merged or not)

### Pattern 2: Issue Activity Types

```yaml
on:
  issues:
    types:
      - opened
      - labeled
      - assigned

jobs:
  auto-respond:
    runs-on: ubuntu-latest
    steps:
      - name: Comment on new issue
        if: github.event.action == 'opened'
        run: echo "Thanks for opening an issue!"
      
      - name: Auto-assign on bug label
        if: |
          github.event.action == 'labeled' &&
          github.event.label.name == 'bug'
        run: echo "Auto-assigning bug to team"
```

**Issue Activity Types:**
- `opened`, `edited`, `deleted`
- `transferred`, `pinned`, `unpinned`
- `closed`, `reopened`
- `assigned`, `unassigned`
- `labeled`, `unlabeled`
- `locked`, `unlocked`
- `milestoned`, `demilestoned`

### Pattern 3: Release Activity Types

```yaml
on:
  release:
    types:
      - published  # Release is published (most common)
      - created    # Release created (draft or published)

jobs:
  deploy:
    if: github.event.action == 'published'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy release
        run: |
          echo "Deploying ${{ github.event.release.tag_name }}"
          echo "Release URL: ${{ github.event.release.html_url }}"
```

### Pattern 4: Comment Activity Types

```yaml
on:
  issue_comment:
    types: [created]

jobs:
  slash-commands:
    if: startsWith(github.event.comment.body, '/')
    runs-on: ubuntu-latest
    steps:
      - name: Handle /deploy command
        if: contains(github.event.comment.body, '/deploy')
        run: echo "Deploying..."
      
      - name: Handle /test command
        if: contains(github.event.comment.body, '/test')
        run: echo "Running tests..."
```

### Pattern 5: Combined Filters (Branch + Path + Activity)

```yaml
on:
  pull_request:
    types: [opened, synchronize]
    branches:
      - main
      - 'releases/**'
    paths:
      - 'src/**'
      - 'tests/**'
      - '!docs/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

**This workflow runs ONLY when:**
1. PR is opened OR updated with new commits
2. Target branch is `main` OR matches `releases/**`
3. Changes affect `src/` or `tests/` (excluding `docs/`)

### Pattern 6: Path Patterns

```yaml
on:
  push:
    paths:
      # Include patterns
      - 'src/**'              # Everything in src/
      - '**.js'               # All JavaScript files
      - 'package.json'        # Specific file
      
      # Exclude patterns (prefix with !)
      - '!docs/**'            # Ignore docs folder
      - '!**.md'              # Ignore markdown files
      - '!**/test/**'         # Ignore test folders
```

### Pattern 7: Tag Filters

```yaml
on:
  push:
    tags:
      - 'v*'                  # v1, v2, v1.0
      - 'v[0-9]+.[0-9]+.[0-9]+' # v1.2.3 only
      - '!v*-beta'            # Exclude beta tags
```

### Complete Example: Smart PR Automation

```yaml
name: Smart PR Automation

on:
  pull_request:
    types:
      - opened
      - synchronize
      - labeled
      - ready_for_review
    branches:
      - main
    paths:
      - 'src/**'
      - 'tests/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Welcome message (new PRs only)
        if: github.event.action == 'opened'
        run: |
          echo "Thanks for your contribution!"
          echo "PR #${{ github.event.number }}"
      
      - name: Run tests
        if: |
          github.event.action == 'opened' ||
          github.event.action == 'synchronize'
        run: npm test
      
      - name: Auto-request review (ready for review)
        if: github.event.action == 'ready_for_review'
        run: echo "Requesting review from team"
      
      - name: Priority handling (priority label)
        if: |
          github.event.action == 'labeled' &&
          github.event.label.name == 'priority'
        run: echo "Fast-tracking priority PR"
```

---

## 🎯 Practice Exercises

### Exercise 1: Auto-Label Issues
**Task:** Create workflow that adds "triage" label to newly opened issues.

<details>
<summary>Solution</summary>

```yaml
name: Auto Label Issues

on:
  issues:
    types: [opened]

jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.name,
              issue_number: context.issue.number,
              labels: ['triage']
            });
```
</details>

### Exercise 2: Deploy on Release
**Task:** Deploy to production only when release is published (not drafted).

<details>
<summary>Solution</summary>

```yaml
name: Deploy on Release

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          echo "Deploying version: ${{ github.event.release.tag_name }}"
          echo "Release notes: ${{ github.event.release.body }}"
```
</details>

---

## 🎓 Pro-Tips & Complete Reference

### All Pull Request Activity Types

```yaml
on:
  pull_request:
    types:
      - assigned
      - unassigned
      - labeled
      - unlabeled
      - opened
      - edited
      - closed
      - reopened
      - synchronize
      - converted_to_draft
      - ready_for_review
      - locked
      - unlocked
      - review_requested
      - review_request_removed
      - auto_merge_enabled
      - auto_merge_disabled
```

### Path Filter Best Practices

```yaml
# ✅ GOOD: Clear, specific paths
paths:
  - 'src/**'
  - 'tests/**'
  - 'package.json'
  - '!docs/**'

# ❌ BAD: Too broad
paths:
  - '**'  # Matches everything!
```

### Security: pull_request vs pull_request_target

```yaml
# ✅ SAFE: For public repos, use this
on: pull_request
# Runs in PR branch context
# No write access to repo
# Can't access secrets (safer)

# ⚠️ DANGEROUS: Be very careful
on: pull_request_target
# Runs in base branch context
# Has write access
# Can access secrets
# Use only when absolutely necessary!
```

---

## 📚 Complete Activity Types Reference

### Most Common Events

| Event | Common Activity Types | Use Case |
|-------|----------------------|----------|
| `pull_request` | `opened`, `synchronize` | Run tests on PRs |
| `issues` | `opened`, `labeled` | Auto-respond to issues |
| `release` | `published` | Deploy on release |
| `issue_comment` | `created` | Slash commands |
| `push` | N/A (no types) | Build on push |

### Event Payload Access

```yaml
steps:
  - name: Access event data
    run: |
      echo "Action: ${{ github.event.action }}"
      echo "PR number: ${{ github.event.pull_request.number }}"
      echo "Issue: ${{ github.event.issue.title }}"
      echo "Comment: ${{ github.event.comment.body }}"
      echo "Label: ${{ github.event.label.name }}"
```

---

## 🎯 Knowledge Check

- [ ] Understand difference between events and activity types
- [ ] Can filter workflows by branch, path, and tags
- [ ] Know when to use pull_request vs pull_request_target
- [ ] Can access event payload data
- [ ] Understand path include/exclude patterns

---

**Next Chapter:** [Chapter 23 - Cancelling and Skipping Workflows](chapter-23-cancelling.md)

**Coming Up:** Learn how to cancel workflows, skip CI with commit messages, and control workflow execution programmatically.
