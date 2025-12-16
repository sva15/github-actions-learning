# Chapter 28: Lab - Exploring Workflow Syntax Part 2

## 🎯 Phase 1: Advanced Lab Overview

### The Final Exam Analogy
This lab is like a **comprehensive final examination**:
- Combines ALL concepts from chapters 1-27
- Real-world production scenarios
- Multiple interconnected challenges
- Performance and security considerations
- Complete end-to-end pipelines

### Lab Objectives

By completing this lab, you'll demonstrate mastery of:
1. ✅ Advanced matrix strategies with dynamic generation
2. ✅ Complex conditional logic and status functions
3. ✅ workflow_dispatch with typed inputs
4. ✅ repository_dispatch integration
5. ✅ Concurrency control and timeout management
6. ✅ Comprehensive artifact management
7. ✅ Advanced secret handling
8. ✅ REST API integration
9. ✅ Debugging and troubleshooting
10. ✅ Production-ready patterns

---

## 🛠️ Phase 2: Lab Exercises

### Exercise 1: Complete Multi-Environment Pipeline

**Scenario:** Build a production-grade CI/CD pipeline for a microservices application.

**Requirements:**
- Matrix strategy for multiple services
- Dynamic environment selection
- Conditional deployments with approval
- Artifact management across jobs
- Integration testing with service containers
- Security scanning
- Slack notifications
- Debug logging capability

**Challenge:**
```yaml
name: Advanced Production Pipeline

on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        type: choice
        options: [development, staging, production]
        required: true
      services:
        description: 'Services to deploy (comma-separated or "all")'
        type: string
        default: 'all'
      skip_tests:
        description: 'Skip test execution'
        type: boolean
        default: false
      notify_slack:
        description: 'Send Slack notifications'
        type: boolean
        default: true
  repository_dispatch:
    types: [external-build-complete]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

env:
  REGISTRY: ghcr.io
  NODE_VERSION: '20'

jobs:
  detect-changes:
    name: 🔍 Detect Changes
    runs-on: ubuntu-latest
    outputs:
      services: ${{ steps.filter.outputs.services }}
      has_changes: ${{ steps.filter.outputs.has_changes }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - name: Detect changed services
        id: filter
        run: |
          if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
            # Manual trigger - use input
            if [ "${{ inputs.services }}" == "all" ]; then
              SERVICES='["api","web","worker"]'
            else
              # Convert comma-separated to JSON array
              SERVICES=$(echo '${{ inputs.services }}' | jq -R 'split(",") | map(select(. != ""))')
            fi
          else
            # Auto-detect from changed files
            SERVICES='[]'
            if git diff HEAD^ HEAD --name-only | grep -q "^services/api/"; then
              SERVICES=$(echo $SERVICES | jq '. + ["api"]')
            fi
            if git diff HEAD^ HEAD --name-only | grep -q "^services/web/"; then
              SERVICES=$(echo $SERVICES | jq '. + ["web"]')
            fi
            if git diff HEAD^ HEAD --name-only | grep -q "^services/worker/"; then
              SERVICES=$(echo $SERVICES | jq '. + ["worker"]')
            fi
            
            # Default to all if no services detected
            if [ "$SERVICES" == "[]" ]; then
              SERVICES='["api","web","worker"]'
            fi
          fi
          
          echo "services=$SERVICES" >> $GITHUB_OUTPUT
          echo "has_changes=true" >> $GITHUB_OUTPUT
          echo "Detected services: $SERVICES"
  
  build:
    name: 📦 Build ${{ matrix.service }}
    needs: detect-changes
    if: needs.detect-changes.outputs.has_changes == 'true'
    strategy:
      fail-fast: false
      matrix:
        service: ${{ fromJSON(needs.detect-changes.outputs.services) }}
    runs-on: ubuntu-latest
    timeout-minutes: 20
    outputs:
      version-${{ matrix.service }}: ${{ steps.version.outputs.number }}
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: services/${{ matrix.service }}/package-lock.json
      
      - name: Generate version
        id: version
        run: |
          VERSION="v$(date +%Y%m%d)-${{ github.run_number }}-${{ matrix.service }}"
          echo "number=$VERSION" >> $GITHUB_OUTPUT
          echo "Generated version: $VERSION"
      
      - name: Install dependencies
        working-directory: services/${{ matrix.service }}
        run: npm ci
      
      - name: Build service
        working-directory: services/${{ matrix.service }}
        run: |
          echo "Building ${{ matrix.service }} version ${{ steps.version.outputs.number }}"
          npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ matrix.service }}
          path: services/${{ matrix.service }}/dist/
          retention-days: 7
  
  test:
    name: 🧪 Test ${{ matrix.service }}
    needs: [detect-changes, build]
    if: needs.detect-changes.outputs.has_changes == 'true' && !inputs.skip_tests
    strategy:
      fail-fast: false
      matrix:
        service: ${{ fromJSON(needs.detect-changes.outputs.services) }}
        test-type: [unit, integration]
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-${{ matrix.service }}
          path: services/${{ matrix.service }}/dist/
      
      - name: Install dependencies
        working-directory: services/${{ matrix.service }}
        run: npm ci
      
      - name: Run ${{ matrix.test-type }} tests
        working-directory: services/${{ matrix.service }}
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test
        run: npm run test:${{ matrix.test-type }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.service }}-${{ matrix.test-type }}
          path: services/${{ matrix.service }}/test-results/
  
  security-scan:
    name: 🔒 Security Scan
    needs: build
    strategy:
      matrix:
        service: ${{ fromJSON(needs.detect-changes.outputs.services) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security audit
        working-directory: services/${{ matrix.service }}
        run: npm audit --audit-level=high
      
      - name: Upload security report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: security-${{ matrix.service }}
          path: services/${{ matrix.service }}/security-report.json
  
  deploy:
    name: 🚀 Deploy to ${{ inputs.environment || 'staging' }}
    needs: [detect-changes, build, test, security-scan]
    if: |
      always() &&
      (success() || inputs.skip_tests) &&
      (github.ref == 'refs/heads/main' ||
       github.ref == 'refs/heads/develop' ||
       github.event_name == 'workflow_dispatch')
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment || (github.ref == 'refs/heads/main' && 'production' || 'staging') }}
    strategy:
      matrix:
        service: ${{ fromJSON(needs.detect-changes.outputs.services) }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-${{ matrix.service }}
          path: dist/
      
      - name: Deploy service
        env:
          ENVIRONMENT: ${{ inputs.environment || (github.ref == 'refs/heads/main' && 'production' || 'staging') }}
        run: |
          echo "🚀 Deploying ${{ matrix.service }} to $ENVIRONMENT"
          echo "Version: ${{ needs.build.outputs[format('version-{0}', matrix.service)] }}"
          # Deployment commands here
  
  notify:
    name: 📢 Notify
    needs: [build, test, deploy]
    if: always() && (inputs.notify_slack == true || github.event_name == 'push')
    runs-on: ubuntu-latest
    steps:
      - name: Determine status
        id: status
        run: |
          if [ "${{ needs.deploy.result }}" == "success" ]; then
            echo "status=✅ SUCCESS" >> $GITHUB_OUTPUT
            echo "color=good" >> $GITHUB_OUTPUT
          elif [ "${{ needs.deploy.result }}" == "failure" ]; then
            echo "status=❌ FAILED" >> $GITHUB_OUTPUT
            echo "color=danger" >> $GITHUB_OUTPUT
          else
            echo "status=⚠️ SKIPPED" >> $GITHUB_OUTPUT
            echo "color=warning" >> $GITHUB_OUTPUT
          fi
      
      - name: Send notification
        run: |
          echo "Sending notification: ${{ steps.status.outputs.status }}"
          echo "Workflow: ${{ github.workflow }}"
          echo "Actor: ${{ github.actor }}"
          echo "Ref: ${{ github.ref }}"
```

**Difficulty:** ⭐⭐⭐⭐⭐ (Expert)

**What This Demonstrates:**
- ✅ Dynamic matrix from job outputs
- ✅ Multiple matrix dimensions (service × test-type)
- ✅ Service containers (PostgreSQL)
- ✅ Complex conditionals combining multiple factors
- ✅ Environment protection with manual approval
- ✅ Artifact passing between jobs
- ✅ Timeout management
- ✅ Security scanning integration
- ✅ Notification patterns
- ✅ workflow_dispatch with typed inputs
- ✅ Concurrency control

---

### Exercise 2: Debug and Fix Broken Workflow

**Scenario:** This workflow has multiple issues. Find and fix all bugs.

**Broken Workflow:**
```yaml
name: Broken Pipeline

on: push

jobs:
  build
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      
      - uses: actions/upload-artifact@v4
        with
          name build-output
          path: dist/
  
  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
      
      - run: npm test
  
  deploy:
    needs: test
    if: github.ref = 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh
```

<details>
<summary>🐛 Issues to Find (Don't peek until you've tried!)</summary>

**Issues:**
1. Line 6: Missing `:` after `build`
2. Line 8: Missing checkout step (npm not available)
3. Line 10: Missing `:` after `with`
4. Line 11: Missing `:` in `name build-output`
5. Line 20: Missing `path:` parameter for download
6. Line 22: Missing checkout and setup-node
7. Line 26: Wrong operator `=` should be `==`
8. Line 30: Missing checkout step
9. No timeout configuration
10. No error handling

</details>

<details>
<parameter name="Complexity">9
