# Chapter 6: Multi-Line Commands and Executing Third-Party Libraries

## 🎯 Phase 1: Core Explanation

### The Recipe Card Analogy
Think of GitHub Actions steps like **recipe instructions**:

| Type | Recipe Analogy | GitHub Actions | Example |
|------|---------------|----------------|---------|
| **Single-line** | "Preheat oven to 350°F" | `run: npm test` | One simple command |
| **Multi-line** | Multiple steps: "Mix flour...", "Add eggs...", "Fold gently..." | `run: \|` with multiple commands | Complex script |
| **Different shell** | Using a wok vs. oven (different tools) | `shell: python` or `shell: pwsh` | Language-specific scripts |
| **Third-party tool** | Using a KitchenAid mixer (specialized tool) | Installing wget, curl, jq, etc. | External utilities |

### One-Sentence Definition
**Multi-line commands allow you to execute complex scripts (bash, PowerShell, Python, etc.) directly in your workflow using the `run:` key with pipe (`|`) syntax, and third-party libraries can be installed and used on GitHub-hosted runners.**

### Connection to Real-World DevOps
In production environments, you rarely run single commands. You:
- Install dependencies → Configure environment → Run tests → Generate reports
- Download artifacts → Extract → Validate → Deploy
- All of this needs **multi-step scripts** that GitHub Actions handles elegantly.

### 💡 Surprising Production Facts

**Fact 1:** You can write **inline Python, Ruby, or Perl scripts** without creating separate files! This is HUGELY underutilized.

**Fact 2:** GitHub-hosted runners come with **300+ pre-installed tools** (Docker, kubectl, terraform, AWS CLI, Azure CLI, and more). Check [runner images](https://github.com/actions/runner-images) for the full list.

**Fact 3:** The `|` (pipe) operator in YAML preserves newlines, while `>` folds them. Using the wrong one is a common bug!

---

## 🛠️ Phase 2: Implementation Drill

### Single-Line vs Multi-Line Commands

```yaml
# ❌ Difficult to read (all commands on one line)
- name: Build and test
  run: npm install && npm run build && npm test && npm run lint

# ✅ Multi-line (readable, maintainable)
- name: Build and test
  run: |
    npm install
    npm run build
    npm test
    npm run lint
```

### YAML Multi-Line Syntax: `|` vs `>`

```yaml
# Using | (pipe) - Preserves newlines
- name: Multi-line script with |
  run: |
    echo "Line 1"
    echo "Line 2"
    echo "Line 3"
  # Executes as:
  # echo "Line 1"
  # echo "Line 2"  
  # echo "Line 3"

# Using > (greater than) - Folds lines into one
- name: Single line with >
  run: >
    echo "This is"
    "a single"
    "long line"
  # Executes as:
  # echo "This is" "a single" "long line"
```

**Rule:** Use `|` for scripts (99% of cases), use `>` for long configuration strings.

### Real-World Multi-Line Examples

#### Example 1: Comprehensive Build Script

```yaml
- name: Build application
  run: |
    echo "🚀 Starting build process..."
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm ci
    
    # Run linter
    echo "🔍 Running linter..."
    npm run lint
    
    # Run tests
    echo "🧪 Running tests..."
    npm test
    
    # Build for production
    echo "🏗️ Building for production..."
    NODE_ENV=production npm run build
    
    # Show build output
    echo "✅ Build complete! Output files:"
    ls -lh dist/
```

#### Example 2: Conditional Logic in Scripts

```yaml
- name: Deploy based on environment
  run: |
    if [ "${{ github.ref }}" == "refs/heads/main" ]; then
      echo "Deploying to PRODUCTION"
      ./deploy.sh production
    elif [ "${{ github.ref }}" == "refs/heads/develop" ]; then
      echo "Deploying to STAGING"
      ./deploy.sh staging
    else
      echo "Branch not configured for deployment"
      exit 0
    fi
```

#### Example 3: Error Handling

```yaml
- name: Script with error handling
  run: |
    set -e  # Exit on any error
    set -u  # Treat unset variables as errors
    set -o pipefail  # Catch errors in pipes
    
    echo "Running risky operation..."
    
    # This will stop execution if it fails
    npm run build || {
      echo "❌ Build failed!"
      echo "::error::Build step encountered an error"
      exit 1
    }
    
    echo "✅ Build successful"
```

**Pro tip:** Always use `set -e` in bash scripts to catch errors early!

### Different Shell Interpreters

```yaml
# Default shell (bash on Linux/macOS, pwsh on Windows)
- name: Default shell
  run: echo "Using default shell"

# Explicit bash (Linux/macOS)
- name: Bash script
  shell: bash
  run: |
    #!/bin/bash
    echo "This is bash"
    echo "Current shell: $SHELL"

# PowerShell (cross-platform)
- name: PowerShell script
  shell: pwsh
  run: |
    Write-Host "This is PowerShell"
    Get-ChildItem
    $PSVersionTable

# Python (inline!)
- name: Python script
  shell: python
  run: |
    import sys
    import os
    print(f"Python version: {sys.version}")
    print(f"Current directory: {os.getcwd()}")
    
    # Do actual work
    total = sum(range(1, 101))
    print(f"Sum of 1-100: {total}")

# Ruby (inline!)
- name: Ruby script
  shell: ruby {0}
  run: |
    puts "This is Ruby"
    puts "Ruby version: #{RUBY_VERSION}"
    
    # Process environment variable
    actor = ENV['GITHUB_ACTOR']
    puts "Triggered by: #{actor}"

# Perl (inline!)
- name: Perl script
  shell: perl {0}
  run: |
    print "This is Perl\n";
    print "Perl version: $^V\n";

# Custom shell
- name: Zsh script
  shell: zsh {0}
  run: |
    echo "This is Zsh"
    echo "Current shell: $SHELL"
```

### Working with Third-Party Tools

#### Installing and Using Common Tools

```yaml
- name: Install and use jq (JSON processor)
  run: |
    # Install jq
    sudo apt-get update
    sudo apt-get install -y jq
    
    # Use jq to parse JSON
    echo '{"name":"John","age":30}' | jq '.name'
    
    # Parse GitHub context
    echo '${{ toJSON(github) }}' | jq '.repository'

- name: Install and use yq (YAML processor)
  run: |
    # Install yq
    wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/local/bin/yq
    chmod +x /usr/local/bin/yq
    
    # Use yq
    yq eval '.version' package.yaml

- name: Use pre-installed tools
  run: |
    # Docker (pre-installed)
    docker --version
    
    # kubectl (pre-installed)
    kubectl version --client
    
    # AWS CLI (pre-installed)
    aws --version
    
    # Azure CLI (pre-installed)
    az --version
    
    # Terraform (pre-installed)
    terraform --version
```

#### Installing Language-Specific Libraries

```yaml
# Python libraries
- name: Python with pip libraries
  shell: python
  run: |
    import subprocess
    import sys
    
    # Install libraries
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    
    # Use them
    import requests
    response = requests.get('https://api.github.com')
    print(f"GitHub API Status: {response.status_code}")

# Node.js global packages
- name: Install and use global npm package
  run: |
    npm install -g typescript
    tsc --version

# Ruby gems
- name: Install and use Ruby gem
  shell: bash
  run: |
    gem install colorize
    ruby -e "require 'colorize'; puts 'Hello'.green"
```

### Advanced: Multi-Line with Environment Variables

```yaml
- name: Script with environment variables
  env:
    DATABASE_URL: postgresql://localhost/mydb
    API_KEY: ${{ secrets.API_KEY }}
    NODE_ENV: production
  run: |
    echo "Database: $DATABASE_URL"
    echo "Environment: $NODE_ENV"
    
    # Use API_KEY without exposing it
    curl -H "Authorization: Bearer $API_KEY" https://api.example.com
```

---

## 🎯 Practice Exercises

### Exercise 1: Multi-Step Build Script
**Task:** Create a workflow step that:
1. Prints "Starting build..."
2. Creates a directory called `output`
3. Creates a file `output/version.txt` with the current date
4. Displays the file contents

<details>
<summary>Solution</summary>

```yaml
name: Build Script Demo

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Multi-step build
        run: |
          echo "🚀 Starting build..."
          
          # Create directory
          mkdir -p output
          
          # Create version file with date
          date > output/version.txt
          
          # Display contents
          echo "📄 Version file contents:"
          cat output/version.txt
```
</details>

### Exercise 2: Inline Python Script
**Task:** Create a workflow that uses inline Python to:
1. Print Python version
2. Calculate factorial of 10
3. Print the result

<details>
<summary>Solution</summary>

```yaml
name: Python Inline Demo

on: push

jobs:
  python:
    runs-on: ubuntu-latest
    steps:
      - name: Python factorial calculator
        shell: python
        run: |
          import sys
          import math
          
          print(f"Python version: {sys.version}")
          
          # Calculate factorial
          n = 10
          result = math.factorial(n)
          
          print(f"Factorial of {n} is {result}")
```
</details>

### Exercise 3: Conditional Deployment
**Task:** Create a script that:
1. Checks if the branch is `main`
2. If yes, prints "Deploying to production"
3. If no, prints "Skipping deployment"
4. Always prints "Script complete"

<details>
<summary>Solution</summary>

```yaml
name: Conditional Deploy

on: push

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Conditional deployment
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "🚀 Deploying to production"
          else
            echo "⏭️ Skipping deployment (not main branch)"
          fi
          
          echo "✅ Script complete"
```
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Advanced Challenge: Data Processing Pipeline

**Requirements:**
Create a workflow that:
1. Uses inline Python to generate sample JSON data (list of 10 users with name and age)
2. Saves the JSON to a file
3. Uses `jq` to filter users over age 25
4. Counts how many users are over 25
5. Prints the result

**Difficulty:** ⭐⭐⭐⭐ (Advanced)

<details>
<summary>Hints</summary>

- Use `shell: python` for data generation
- Write Python output to file using `with open()`
- Install `jq` with `sudo apt-get install -y jq`
- Use `jq` filter: `jq '[.[] | select(.age > 25)]'`
</details>

<details>
<summary>✅ Solution</summary>

```yaml
name: Data Processing Pipeline

on: workflow_dispatch

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Generate sample data
        shell: python
        run: |
          import json
          import random
          
          # Generate sample user data
          names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Iris", "Jack"]
          users = [
              {"name": name, "age": random.randint(20, 35)}
              for name in names
          ]
          
          # Save to file
          with open('users.json', 'w') as f:
              json.dump(users, f, indent=2)
          
          print("✅ Generated user data:")
          print(json.dumps(users, indent=2))
      
      - name: Process data with jq
        run: |
          # Install jq
          sudo apt-get update && sudo apt-get install -y jq
          
          echo "📊 All users:"
          cat users.json
          
          echo ""
          echo "🔍 Users over 25:"
          jq '[.[] | select(.age > 25)]' users.json
          
          # Count users over 25
          COUNT=$(jq '[.[] | select(.age > 25)] | length' users.json)
          echo ""
          echo "✅ Found $COUNT users over age 25"
```
</details>

---

## 🎓 Phase 4: Pro-Tips & Gotchas

### 🚨 Common Mistakes

#### Mistake 1: Using `>` Instead of `|`

```yaml
# ❌ WRONG: Commands merged into one line
- name: Wrong syntax
  run: >
    echo "Line 1"
    echo "Line 2"
  # Executes as: echo "Line 1" echo "Line 2" (FAILS!)

# ✅ CORRECT
- name: Right syntax
  run: |
    echo "Line 1"
    echo "Line 2"
```

#### Mistake 2: Forgetting Error Handling

```yaml
# ❌ RISKY: Continues even if a command fails
- name: No error handling
  run: |
    npm run build
    npm test
    npm run deploy
  # If build fails, still tries to test and deploy!

# ✅ SAFE: Stops on first failure
- name: With error handling
  run: |
    set -e  # Exit on error
    npm run build
    npm test
    npm run deploy
```

#### Mistake 3: Secrets in Echo Statements

```yaml
# ❌ DANGEROUS: Exposes secret in logs
- name: Dangerous
  run: |
    echo "API Key: ${{ secrets.API_KEY }}"

# ✅ SAFE: Mask with ::add-mask::
- name: Safe
  run: |
    echo "::add-mask::${{ secrets.API_KEY }}"
    echo "API Key: ${{ secrets.API_KEY }}"  # Now masked
```

#### Mistake 4: Not Checking Tool Availability

```yaml
# ❌ ASSUMES jq is installed (might fail on some runners)
- name: Risky
  run: jq '.version' package.json

# ✅ CHECKS and installs if needed
- name: Safe
  run: |
    if ! command -v jq &> /dev/null; then
      echo "Installing jq..."
      sudo apt-get update && sudo apt-get install -y jq
    fi
    jq '.version' package.json
```

### ⚡ Performance Tips

#### Tip 1: Combine Commands to Reduce Steps

```yaml
# ❌ SLOW: Multiple checkout + setup steps
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
- run: npm ci
- run: npm run lint
- run: npm test
- run: npm run build

# ✅ FASTER: Group related commands
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
- name: Build and test
  run: |
    npm ci
    npm run lint
    npm test
    npm run build
```

**Why:** Fewer step transitions = less overhead.

#### Tip 2: Use Caching for Third-Party Tools

```yaml
- name: Cache jq binary
  uses: actions/cache@v3
  with:
    path: /usr/local/bin/jq
    key: jq-1.6

- name: Install jq
  run: |
    if [ ! -f /usr/local/bin/jq ]; then
      sudo apt-get install -y jq
    fi
```

### 🔒 Security Best Practices

#### Practice 1: Never Log Secrets

```yaml
# ❌ NEVER DO THIS
- run: echo "Password is ${{ secrets.DB_PASSWORD }}"

# ✅ Use secrets without exposing
- run: |
    mysql -u root -p"${{ secrets.DB_PASSWORD }}" -e "SHOW DATABASES;"
```

**Note:** GitHub automatically masks registered secrets in logs, but it's best practice to avoid echoing them.

#### Practice 2: Sanitize User Inputs

```yaml
# ❌ DANGEROUS: Command injection risk
- run: echo "${{ github.event.head_commit.message }}"

# ✅ SAFE: Quote and sanitize
- run: |
    COMMIT_MSG=$(echo "${{ github.event.head_commit.message }}" | sed 's/[^a-zA-Z0-9 ]//g')
    echo "Sanitized message: $COMMIT_MSG"
```

### 🏆 Advanced Pro Patterns

#### Pattern 1: Multi-Language Scripts in One Workflow

```yaml
- name: Polyglot workflow
  run: |
    # Bash
    echo "Step 1: Bash preprocessing"
    FILES=$(ls *.txt | wc -l)
    
    # Python data processing
    python3 << 'EOF'
    import os
    files = int(os.environ.get('FILES', 0))
    print(f"Processing {files} files")
    EOF
    
    # Ruby reporting
    ruby << 'EOF'
    puts "Generating report..."
    puts "Ruby version: #{RUBY_VERSION}"
    EOF
```

#### Pattern 2: Dynamic Script Generation

```yaml
- name: Generate and execute script
  run: |
    # Create a script dynamically
    cat > deploy.sh << 'SCRIPT'
    #!/bin/bash
    set -e
    echo "Deploying version $VERSION to $ENVIRONMENT"
    # Deployment logic here
    SCRIPT
    
    chmod +x deploy.sh
    
    # Execute the generated script
    VERSION=1.2.3 ENVIRONMENT=production ./deploy.sh
```

#### Pattern 3: Here Documents for Complex Configs

```yaml
- name: Generate configuration file
  run: |
    cat > config.yaml << EOF
    server:
      host: ${{ secrets.SERVER_HOST }}
      port: 8080
    database:
      url: ${{ secrets.DATABASE_URL }}
    features:
      analytics: true
      debugging: ${{ github.ref == 'refs/heads/develop' }}
    EOF
    
    cat config.yaml
```

---

## 📚 Shell Reference

### Available Shells

| Shell | Keyword | Platform | Use Case |
|-------|---------|----------|----------|
| Bash | `bash` | Linux, macOS | Default Unix scripting |
| PowerShell | `pwsh` | All | Cross-platform automation |
| Cmd | `cmd` | Windows | Windows batch files |
| Python | `python` | All | Data processing, APIs |
| Ruby | `ruby {0}` | All | Text processing |
| Perl | `perl {0}` | All | Regex, legacy scripts |
| sh | `sh` | Linux, macOS | POSIX compliance |

### Common Pre-Installed Tools (Ubuntu Runner)

| Category | Tools |
|----------|-------|
| **Cloud** | aws-cli, azure-cli, gcloud, terraform |
| **Containers** | docker, docker-compose, kubectl, helm |
| **Languages** | node, python, ruby, java, go, php, rust |
| **Build** | maven, gradle, make, cmake |
| **Version Control** | git, gh (GitHub CLI), git-lfs |
| **Utilities** | curl, wget, jq, yq, zip, unzip, rsync |

Full list: https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2204-Readme.md

---

## 🎯 Knowledge Check

- [ ] Understand difference between `|` and `>` in YAML
- [ ] Can write multi-line bash scripts with error handling
- [ ] Know how to use different shells (python, pwsh, etc.)
- [ ] Can install and use third-party tools
- [ ] Understand security implications of logging secrets
- [ ] Can combine multiple commands efficiently

### Quick Self-Test

<details>
<summary>1. What's wrong with this script?</summary>

```yaml
run: >
  echo "Line 1"
  echo "Line 2"
```

**Answer:** Using `>` folds lines into one. Should use `|` for multi-line scripts.
</details>

<details>
<summary>2. How do you run inline Python in a step?</summary>

**Answer:**
```yaml
- shell: python
  run: |
    print("Hello from Python")
```
</details>

<details>
<summary>3. How do you ensure a script stops on first error?</summary>

**Answer:**
```yaml
run: |
  set -e
  command1
  command2
```
</details>

---

**Next Chapter:** [Chapter 7 - Workflow to Generate ASCII Artwork](chapter-07-ascii-artwork.md)

**Coming Up:** Practical example workflow using third-party tools to generate ASCII art and demonstrate command-line utilities in GitHub Actions.
