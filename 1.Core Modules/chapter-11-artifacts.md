# Chapter 11: Storing Workflow Data as Artifacts

## 🎯 Phase 1: Core Explanation

### The Package Delivery Analogy
Think of artifacts like a **package delivery service between jobs**:

| Concept | Package Delivery | GitHub Artifacts |
|---------|------------------|------------------|
| **Sender** | Job that creates files | Job with `upload-artifact` |
| **Package** | Box with contents | Build outputs, test results, logs |
| **Storage** | Warehouse | GitHub's artifact storage (500MB free) |
| **Receiver** | Job that needs the package | Job with `download-artifact` |
| **Retention** | How long warehouse keeps it | 90 days default (configurable) |

### One-Sentence Definition
**Artifacts are files or directories produced by jobs that can be uploaded to GitHub's storage and downloaded by other jobs in the same workflow run, enabling data sharing between isolated jobs and persisting build outputs for later download.**

### Why Artifacts Matter

**Remember:** Jobs run on separate VMs. A file created in job-a is **NOT accessible** to job-b.

**Solutions:**
1. **Artifacts:** Upload in job-a, download in job-b
2. Use for: Build outputs, test reports, logs, compiled binaries

### 💡 Production Reality

**Fact 1:** Artifact storage counts against your limit (500MB free, 50GB for Pro). Large artifacts can exhaust this quickly!

**Fact 2:** Artifacts are **automatically deleted after 90 days**. Critical builds should be stored elsewhere.

**Fact 3:** Downloading artifacts is **slower** than local filesystem (network transfer). Optimize by only sharing necessary files.

---

## 🛠️ Phase 2: Implementation Drill

### Basic Pattern: Upload and Download

```yaml
name: Artifact Demo

on: push

jobs:
  build:
    name: 📦 Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Create build output
        run: |
          mkdir -p build
          echo "Built at $(date)" > build/app.txt
          echo "Version 1.0.0" > build/version.txt
      
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: build/
  
  test:
    name: 🧪 Test
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: build/
      
      - name: Verify files
        run: |
          echo "Downloaded files:"
          ls -la build/
          cat build/app.txt
          cat build/version.txt
```

**What happens:**
1. `build` job creates files in `build/` directory
2. Upload action stores them in GitHub's artifact storage
3. `test` job (on different VM) downloads the files
4. `test` job can now access the build outputs

### Uploading Specific Files

```yaml
- name: Upload single file
  uses: actions/upload-artifact@v4
  with:
    name: my-file
    path: output/result.txt

- name: Upload multiple specific files
  uses: actions/upload-artifact@v4
  with:
    name: logs
    path: |
      logs/app.log
      logs/error.log
      logs/debug.log

- name: Upload with glob pattern
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: |
      test-results/**/*.xml
      coverage/**/*.json
```

### Artifact Retention

```yaml
- name: Upload with custom retention
  uses: actions/upload-artifact@v4
  with:
    name: temp-build
    path: dist/
    retention-days: 7  # Delete after 7 days (default: 90)

- name: Critical artifact (max retention)
  uses: actions/upload-artifact@v4
  with:
    name: release-build
    path: release/
    retention-days: 90  # Maximum allowed
```

### Conditional Upload

```yaml
- name: Run tests
  id: test
  run: npm test
  continue-on-error: true

- name: Upload test results (only if tests ran)
  if: always()  # Upload even if tests failed
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: test-results/

- name: Upload failure logs (only on failure)
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: failure-logs
    path: logs/
```

### Complete Build Pipeline with Artifacts

```yaml
name: Build and Deploy

on: push

jobs:
  build:
    name: 📦 Build Application
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-files
          path: dist/
          if-no-files-found: error  # Fail if no files
  
  test:
    name: 🧪 Test Build
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: dist-files
          path: dist/
      
      - name: Run tests on build
        run: |
          echo "Testing build output..."
          ls -la dist/
  
  deploy:
    name: 🚀 Deploy
    needs: [build, test]
    runs-on: ubuntu-latest
    steps:
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: dist-files
          path: dist/
      
      - name: Deploy
        run: |
          echo "Deploying from dist/..."
          # Deployment commands here
```

---

## 🎯 Practice Exercises

### Exercise 1: Basic Upload/Download
**Task:** Create a workflow with:
- `create` job: Creates a file `message.txt` with "Hello World"
- `read` job: Downloads and displays the file

<details>
<summary>Solution</summary>

```yaml
name: Artifact Exercise

on: push

jobs:
  create:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Hello World" > message.txt
      
      - uses: actions/upload-artifact@v4
        with:
          name: message
          path: message.txt
  
  read:
    needs: create
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: message
      
      - run: cat message.txt
```
</details>

### Exercise 2: Test Results Artifact
**Task:** Create:
- `test` job: Creates fake test results in `results/tests.xml`
- Uploads results (even if tests fail)
- `report` job: Downloads and displays results

<details>
<summary>Solution</summary>

```yaml
name: Test Results

on: push

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: |
          mkdir -p results
          echo "<testResults>Pass: 10, Fail: 2</testResults>" > results/tests.xml
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: results/
  
  report:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: test-results
          path: results/
      
      - run: cat results/tests.xml
```
</details>

---

## 🎓 Pro-Tips

### Storage Optimization

```yaml
# ❌ WASTEFUL - Uploads node_modules (huge!)
- uses: actions/upload-artifact@v4
  with:
    path: .

# ✅ EFFICIENT - Only what's needed
- uses: actions/upload-artifact@v4
  with:
    path: dist/
```

### Compression

Artifacts are automatically compressed! But you can pre-compress for even better results:

```yaml
- name: Compress before upload
  run: tar -czf build.tar.gz dist/

- uses: actions/upload-artifact@v4
  with:
    name: build
    path: build.tar.gz
```

### Multiple Artifacts

```yaml
# Upload different artifacts
- uses: actions/upload-artifact@v4
  with:
    name: frontend-build
    path: frontend/dist/

- uses: actions/upload-artifact@v4
  with:
    name: backend-build
    path: backend/build/

# Download specific one
- uses: actions/download-artifact@v4
  with:
    name: frontend-build
```

---

## 📚 Complete Reference

### Upload Artifact Options

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: artifact-name        # Required: Artifact name
    path: path/to/files       # Required: Files to upload
    if-no-files-found: warn   # warn|error|ignore
    retention-days: 90        # 1-90 days
    compression-level: 6      # 0-9 (0=none, 9=max)
    overwrite: false          # Overwrite existing artifact
```

### Download Artifact Options

```yaml
- uses: actions/download-artifact@v4
  with:
    name: artifact-name       # Optional: specific artifact
    path: destination/        # Optional: where to download
    # If name omitted, downloads ALL artifacts
```

---

**Next Chapter:** [Chapter 12 - Working with Variables at Different Levels](chapter-12-variables.md)
