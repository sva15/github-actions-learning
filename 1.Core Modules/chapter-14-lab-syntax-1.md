# Chapter 14: Lab - Exploring Workflow Syntax Part 1

## 🎯 Phase 1: Core Explanation

### The Coding Bootcamp Analogy
This lab is like a **coding bootcamp final project**:

| Bootcamp Stage | Lab Equivalent | What You Do |
|----------------|----------------|-------------|
| **Lectures** | Chapters 1-13 | Learn concepts |
| **Coding challenges** | This lab | Apply knowledge |
| **Debugging practice** | Troubleshooting exercises | Fix broken workflows |
| **Portfolio project** | Complete pipeline | Build production-ready workflow |

### One-Sentence Definition
**This lab provides hands-on exercises combining workflows, jobs, variables, secrets, and artifacts into complete CI/CD pipelines, reinforcing concepts from chapters 1-13 through practical implementation and debugging challenges.**

### What You'll Practice

By the end of this lab, you'll have hands-on experience with:
- ✅ Creating multi-job workflows
- ✅ Managing job dependencies
- ✅ Using variables at different scopes
- ✅ Working with secrets securely
- ✅ Uploading and downloading artifacts
- ✅ Debugging workflow failures
- ✅ Building production-ready pipelines

### 💡 Lab Philosophy

**This isn't just copy-paste!** Each exercise requires you to:
1. **Think** through the problem
2. **Implement** the solution
3. **Debug** when things break (intentionally!)
4. **Optimize** the workflow

**Real-world simulation:** These exercises mirror actual scenarios you'll face in production DevOps work.

---

## 🛠️ Phase 2: Lab Exercises

### Exercise 1: Basic CI Pipeline (Warmup)

**Scenario:** Your team needs a simple CI pipeline for a Node.js project.

**Requirements:**
1. Workflow triggers on push to `main` and `develop` branches
2. Three parallel jobs: `lint`, `test`, `build`
3. Each job checks out code and runs a command
4. Use workflow-level variable `NODE_VERSION: '20'`

**Starter Template:**
```yaml
name: CI Pipeline

on:
  # YOUR CODE: Add trigger configuration

env:
  # YOUR CODE: Add NODE_VERSION variable

jobs:
  # YOUR CODE: Create lint job
  
  # YOUR CODE: Create test job
  
  # YOUR CODE: Create build job
```

<details>
<summary>💡 Hints</summary>

- Use `on.push.branches` for branch filtering
- Workflow-level `env:` goes after `on:`
- Each job needs: name, `runs-on`, `steps` with checkout
</details>

<details>
<summary>✅ Complete Solution</summary>

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    name: 🔍 Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - run: npm ci
      - run: npm run lint
  
  test:
    name: 🧪 Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - run: npm ci
      - run: npm test
  
  build:
    name: 📦 Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - run: npm ci
      - run: npm run build
```

**Key Concepts Applied:**
- Branch filtering
- Workflow-level variables
- Parallel job execution
- Proper checkout in each job
</details>

---

### Exercise 2: Sequential Deployment Pipeline

**Scenario:** Add deployment after successful tests.

**Requirements:**
1. Build on all `jobs` from Exercise 1
2. Add `deploy` job that waits for **all three** jobs to complete
3. Deploy job only runs on `main` branch
4. Use job-level variable `DEPLOY_ENV: production`
5. Display deployment environment in logs

**Starting Point:** Use your solution from Exercise 1

<details>
<summary>✅ Solution</summary>

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    name: 🔍 Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
      - run: npm run lint
  
  test:
    name: 🧪 Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
      - run: npm test
  
  build:
    name: 📦 Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
      - run: npm run build
  
  deploy:
    name: 🚀 Deploy to Production
    needs: [lint, test, build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    env:
      DEPLOY_ENV: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy application
        run: |
          echo "🚀 Deploying to $DEPLOY_ENV"
          echo "Branch: ${{ github.ref_name }}"
          # Deployment commands here
```

**Key Concepts Applied:**
- Job dependencies (`needs`)
- Conditional execution (`if`)
- Job-level variables
- Fan-in pattern (3 jobs → 1 job)
</details>

---

### Exercise 3: Artifact Sharing Between Jobs

**Scenario:** Build artifacts in one job, test them in another.

**Requirements:**
1. `build` job creates a `dist/` folder with build output
2. Upload `dist/` as an artifact named `build-artifacts`
3. `test-build` job (needs build) downloads the artifact
4. `test-build` verifies files exist in `dist/`

**Template:**
```yaml
name: Build and Test Artifacts

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # YOUR CODE: Create dist/ folder with files
      
      # YOUR CODE: Upload artifact
  
  test-build:
    # YOUR CODE: Add dependency
    runs-on: ubuntu-latest
    steps:
      # YOUR CODE: Download artifact
      
      # YOUR CODE: Verify files
```

<details>
<summary>✅ Solution</summary>

```yaml
name: Build and Test Artifacts

on: push

jobs:
  build:
    name: 📦 Build Application
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Create build output
        run: |
          mkdir -p dist
          echo "console.log('app');" > dist/app.js
          echo "body { margin: 0; }" > dist/styles.css
          echo "<html>App</html>" > dist/index.html
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/
  
  test-build:
    name: 🧪 Test Build Output
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts
          path: dist/
      
      - name: Verify build files
        run: |
          echo "Checking build output..."
          
          if [ ! -f dist/app.js ]; then
            echo "❌ app.js missing"
            exit 1
          fi
          
          if [ ! -f dist/styles.css ]; then
            echo "❌ styles.css missing"
            exit 1
          fi
          
          if [ ! -f dist/index.html ]; then
            echo "❌ index.html missing"
            exit 1
          fi
          
          echo "✅ All build files present"
          echo "Build contents:"
          ls -la dist/
```

**Key Concepts Applied:**
- Artifact upload
- Artifact download
- File verification
- Job dependencies
</details>

---

### Exercise 4: Environment Variables and Secrets

**Scenario:** Create a deployment workflow using secrets safely.

**Setup Required:**
1. Create a repository secret: `DEPLOY_KEY` with value `test-key-12345`
2. Create a repository secret: `API_URL` with value `https://api.example.com`

**Requirements:**
1. Workflow with one `deploy` job
2. Use secrets for `DEPLOY_KEY` and `API_URL`
3. Print "Deploying to [API_URL]" (URL should be visible, but masked)
4. Print "Using deployment key: [FIRST 4 CHARS]***" (partially mask the key)
5. Never echo the full deployment key

<details>
<summary>✅ Solution</summary>

```yaml
name: Secure Deployment

on: workflow_dispatch

jobs:
  deploy:
    name: 🚀 Secure Deploy
    runs-on: ubuntu-latest
    steps:
      - name: Deploy application
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          API_URL: ${{ secrets.API_URL }}
        run: |
          echo "🚀 Deploying to $API_URL"
          
          # Show partial key (first 4 chars)
          KEY_PREFIX="${DEPLOY_KEY:0:4}"
          echo "Using deployment key: ${KEY_PREFIX}***"
          
          # Simulate deployment
          echo "Authenticating with API..."
          echo "Deployment initiated"
          echo "✅ Deployment successful"
      
      - name: Verify deployment
        env:
          API_URL: ${{ secrets.API_URL }}
        run: |
          echo "Verifying deployment at $API_URL"
          echo "Health check passed"
```

**Key Concepts Applied:**
- Using secrets securely
- Partial secret masking
- Environment variables
- Never exposing full secrets
</details>

---

### Exercise 5: Debugging Challenge 🐛

**Scenario:** This workflow is broken! Fix all the issues.

**Broken Workflow:**
```yaml
name: Broken Pipeline

on: push

env:
  NODE_VERSION: 18

jobs:
  build
    runs-on: ubuntu-latest
    steps:
      - name: Build app
        run: npm run build
      
      - uses: actions/upload-artifact@v4
        with:
          name build-output
          path: dist/
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
      
      - run: echo "Deploying from dist/"
      - run: ls dist/
```

**Known Issues:**
- Syntax errors
- Missing required steps
- Incorrect configuration

<details>
<summary>🐛 Issues to Find</summary>

1. Missing `:` after `build` job name
2. Missing `with:` keyword in upload artifact
3. No checkout step in build job (so `npm run build` fails)
4. Download artifact missing `path:` parameter
5. No setup-node step (npm not available)
</details>

<details>
<summary>✅ Fixed Solution</summary>

```yaml
name: Fixed Pipeline

on: push

env:
  NODE_VERSION: '18'

jobs:
  build:  # FIX 1: Added colon
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4  # FIX 2: Added checkout
      
      - uses: actions/setup-node@v4  # FIX 3: Added Node setup
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - run: npm ci  # Added dependency installation
      
      - name: Build app
        run: npm run build
      
      - uses: actions/upload-artifact@v4
        with:  # FIX 4: Added 'with:' keyword
          name: build-output
          path: dist/
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/  # FIX 5: Added path parameter
      
      - run: echo "Deploying from dist/"
      - run: ls dist/
```

**Lessons Learned:**
- Always checkout code before building
- Setup required tools (Node, Python, etc.)
- Syntax matters in YAML (colons, indentation)
- Artifact download needs path specification
</details>

---

## 🧩 Phase 3: Capstone Challenge

### Complete Production Pipeline

**Scenario:** Build a complete CI/CD pipeline for a web application.

**Requirements:**

**Infrastructure:**
- Runs on `push` to `main` and pull_request to `main`
- Uses workflow variable `APP_NAME: MyWebApp`

**Jobs Structure:**
1. **validate** - Runs first, validates code quality
   - Checkout code
   - Run linting
   - Check code formatting

2. **build** - Runs after validate
   - Checkout code
   - Build application
   - Generate version number (use `github.run_number`)
   - Upload build artifact
   - Output version number for other jobs

3. **test-unit** & **test-integration** - Run in parallel after build
   - Download build artifact
   - Run respective tests

4. **deploy-staging** - Runs after all tests, only on `main` branch
   - Uses environment `staging`
   - Downloads build artifact
   - Uses secrets `STAGING_URL` and `STAGING_KEY`
   - Displays version being deployed

**Difficulty:** ⭐⭐⭐⭐ (Advanced)

<details>
<summary>✅ Complete Solution</summary>

```yaml
name: Complete Production Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  APP_NAME: MyWebApp

jobs:
  validate:
    name: ✅ Validate Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run linter
        run: |
          echo "🔍 Running linter for ${{ env.APP_NAME }}"
          # Simulated linting
          echo "✅ Code quality check passed"
      
      - name: Check formatting
        run: |
          echo "📝 Checking code formatting"
          # Simulated format check
          echo "✅ Formatting verified"
  
  build:
    name: 📦 Build Application
    needs: validate
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.number }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate version
        id: version
        run: |
          VERSION="v1.0.${{ github.run_number }}"
          echo "number=$VERSION" >> $GITHUB_OUTPUT
          echo "Generated version: $VERSION"
      
      - name: Build application
        run: |
          echo "🏗️ Building ${{ env.APP_NAME }}"
          mkdir -p dist
          echo "App build for version ${{ steps.version.outputs.number }}" > dist/app.js
          echo "Build timestamp: $(date)" >> dist/build-info.txt
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: app-build
          path: dist/
          retention-days: 7
  
  test-unit:
    name: 🧪 Unit Tests
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: app-build
          path: dist/
      
      - name: Run unit tests
        run: |
          echo "Running unit tests for ${{ env.APP_NAME }}"
          echo "Testing version: ${{ needs.build.outputs.version }}"
          echo "✅ All unit tests passed"
  
  test-integration:
    name: 🔗 Integration Tests
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: app-build
          path: dist/
      
      - name: Run integration tests
        run: |
          echo "Running integration tests for ${{ env.APP_NAME }}"
          echo "Testing version: ${{ needs.build.outputs.version }}"
          echo "✅ All integration tests passed"
  
  deploy-staging:
    name: 🚀 Deploy to Staging
    needs: [build, test-unit, test-integration]
    if: github.ref == 'refs/heads/main'
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: app-build
          path: dist/
      
      - name: Deploy to staging
        env:
          STAGING_URL: ${{ secrets.STAGING_URL }}
          STAGING_KEY: ${{ secrets.STAGING_KEY }}
        run: |
          echo "🚀 Deploying ${{ env.APP_NAME }} to staging"
          echo "Version: ${{ needs.build.outputs.version }}"
          echo "Target URL: $STAGING_URL"
          echo "Using deployment key: ${STAGING_KEY:0:4}***"
          echo "✅ Deployment to staging complete!"
```

**Excellence Markers:**
✅ Proper job dependencies
✅ Version number generation and sharing
✅ Artifact management
✅ Parallel testing
✅ Conditional deployment
✅ Environment protection
✅ Secure secret usage
✅ Clear job naming and logging

</details>

---

## 🎓 Phase 4: Self-Assessment

### Checklist: Can You Do This Without Looking?

- [ ] Create a multi-job workflow from scratch
- [ ] Set up proper job dependencies with `needs`
- [ ] Use workflow, job, and step-level variables correctly
- [ ] Upload and download artifacts between jobs
- [ ] Use secrets securely without exposing them
- [ ] Add conditional logic to jobs
- [ ] Debug common YAML syntax errors
- [ ] Structure a complete CI/CD pipeline

### Common Mistakes to Watch For

| ❌ Mistake | ✅ Fix |
|-----------|--------|
| Forgetting checkout in jobs | Add `actions/checkout@v4` to ALL jobs that need code |
| Wrong indentation in YAML | Use 2 spaces, never tabs |
| Uploading artifacts without path | Always specify `path:` in upload/download |
| Exposing secrets in logs | Never echo secrets, use partially masked output |
| Parallel jobs that should be sequential | Add `needs:` to create dependencies |

---

## 📚 Lab Summary

### What You've Mastered

Through this lab, you've practiced:
1. ✅ **Workflow triggers** - Branch filtering, event types
2. ✅ **Job orchestration** - Parallel and sequential execution
3. ✅ **Variables** - Workflow, job, and step scopes
4. ✅ **Secrets** - Secure credential management
5. ✅ **Artifacts** - Sharing data between jobs
6. ✅ **Debugging** - Finding and fixing workflow issues
7. ✅ **Production patterns** - Complete CI/CD pipelines

### Real-World Readiness

You can now:
- ✅ Build production-ready CI/CD pipelines
- ✅ Debug workflow failures efficiently
- ✅ Implement proper security practices
- ✅ Structure complex multi-job workflows
- ✅ Optimize workflow performance

---

**Next Chapter:** [Chapter 15 - Triggering a Workflow](chapter-15-triggers.md)

**Coming Up:** Deep dive into all workflow trigger events, activity types, filters, and advanced trigger patterns including scheduled workflows and manual dispatch.
