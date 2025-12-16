# Chapter 19: Additional Matrix Configuration

## 🎯 Phase 1: Core Explanation

### The Advanced Recipe Testing Analogy
If basic matrix is testing a recipe with different ingredients, **advanced matrix** is like:
- Testing with ingredient substitutions
- Testing with optional toppings
- Testing different cooking methods
- Combining all variations intelligently

### One-Sentence Definition
**Advanced matrix configuration uses `include` to add specific combinations with extra properties, `exclude` to remove unwanted combinations, dynamic generation from job outputs, and matrix expansion techniques to create sophisticated multi-dimensional test matrices.**

### When You Need Advanced Matrix

**Basic matrix limitations:**
- ❌ Can't add custom properties to specific combinations
- ❌ Can't conditionally add combinations
- ❌ Can't pass matrix data between jobs
- ❌ Can't generate matrix dynamically

**Advanced matrix enables:**
- ✅ Custom configuration per combination
- ✅ Conditional matrix expansion
- ✅ Matrix values from previous job outputs
- ✅ Complex business logic in test matrices

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Include with Extra Properties

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [18, 20]
        include:
          # Add custom property to specific combination
          - os: ubuntu-latest
            node: 20
            coverage: true
          
          # Add completely new combination
          - os: macos-latest
            node: 22
            experimental: true
            continue-on-error: true
    
    runs-on: ${{ matrix.os }}
    continue-on-error: ${{ matrix.continue-on-error == true }}
    
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      
      - run: npm test
      
      - name: Coverage report
        if: matrix.coverage
        run: npm run coverage
      
      - name: Experimental features
        if: matrix.experimental
        run: npm run test:experimental
```

**Result:** 5 jobs
1. ubuntu + node 18
2. ubuntu + node 20 (with coverage: true)
3. windows + node 18
4. windows + node 20
5. macos + node 22 (experimental)

### Pattern 2: Dynamic Matrix from Job Output

```yaml
jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - id: set-matrix
        run: |
          # Dynamically generate matrix based on conditions
          if [ "${{ github.event_name }}" == "pull_request" ]; then
            # PR: Only test latest versions
            echo 'matrix={"node":["20","22"]}' >> $GITHUB_OUTPUT
          else
            # Push: Test all versions
            echo 'matrix={"node":["18","20","22"]}' >> $GITHUB_OUTPUT
          fi
  
  test:
    needs: prepare
    strategy:
      matrix: ${{ fromJSON(needs.prepare.outputs.matrix) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

### Pattern 3: Matrix with Multiple Include Blocks

```yaml
jobs:
  test:
    strategy:
      matrix:
        os:  [ubuntu-latest]
        node: [18, 20]
        include:
          # Add Windows with specific config
          - os: windows-latest
            node: 20
            npm-cache: ~\AppData\npm-cache
          
          # Add macOS with specific config
          - os: macos-latest
            node: 22
            npm-cache: ~/.npm
            experimental: true
          
          # Add specific combination for coverage
          - os: ubuntu-latest
            node: 20
            coverage: true
            timeout: 30
    
    runs-on: ${{ matrix.os }}
    timeout-minutes: ${{ matrix.timeout || 15 }}
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
          cache-dependency-path: package-lock.json
      
      - if: matrix.npm-cache
        uses: actions/cache@v3
        with:
          path: ${{ matrix.npm-cache }}
          key: npm-${{ matrix.os }}-${{ matrix.node }}
      
      - run: npm ci
      - run: npm test
      
      - if: matrix.coverage
        run: npm run coverage
```

### Pattern 4: Conditional Matrix Expansion

```yaml
jobs:
  test:
    strategy:
      matrix:
        # Base matrix
        os: [ubuntu-latest]
        node: [20]
        include:
          # Add more combinations only on main branch
          - ${{ github.ref == 'refs/heads/main' && fromJSON('{"os":"windows-latest","node":"20"}') || fromJSON('{}') }}
          - ${{ github.ref == 'refs/heads/main' && fromJSON('{"os":"macos-latest","node":"22"}') || fromJSON('{}') }}
    
    # Simpler approach using separate job
    if: |
      matrix.os != null &&
      matrix.node != null
    
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

### Pattern 5: Matrix with Database Services

```yaml
jobs:
  test:
    strategy:
      matrix:
        include:
          - db: postgres
            db-version: '13'
            db-port: 5432
            db-image: postgres:13
          
          - db: postgres
            db-version: '15'
            db-port: 5433
            db-image: postgres:15
          
          - db: mysql
            db-version: '8.0'
            db-port: 3306
            db-image: mysql:8.0
          
          - db: mongodb
            db-version: '6.0'
            db-port: 27017
            db-image: mongo:6.0
    
    runs-on: ubuntu-latest
    
    services:
      database:
        image: ${{ matrix.db-image }}
        ports:
          - ${{ matrix.db-port }}:${{ matrix.db-port }}
        options: --health-cmd="pg_isready" --health-interval=10s
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run tests against ${{ matrix.db }} ${{ matrix.db-version }}
        env:
          DB_TYPE: ${{ matrix.db }}
          DB_PORT: ${{ matrix.db-port }}
        run: npm test
```

### Pattern 6: Matrix Outputs

```yaml
jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    outputs:
      artifact-${{ matrix.os }}: ${{ steps.build.outputs.artifact }}
    steps:
      - id: build
        run: |
          ARTIFACT="app-${{ matrix.os }}-${{ github.sha }}.zip"
          echo "artifact=$ARTIFACT" >> $GITHUB_OUTPUT
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Ubuntu artifact: ${{ needs.build.outputs.artifact-ubuntu-latest }}"
          echo "Windows artifact: ${{ needs.build.outputs.artifact-windows-latest }}"
          echo "macOS artifact: ${{ needs.build.outputs.artifact-macos-latest }}"
```

---

## 🎯 Practice Exercises

### Exercise 1: Dynamic Matrix
**Task:** Create a job that generates a matrix dynamically based on changed files.

<details>
<summary>Solution</summary>

```yaml
name: Dynamic Matrix

on: push

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - id: set-matrix
        run: |
          # Detect which packages changed
          if git diff HEAD^ HEAD --name-only | grep -q "frontend/"; then
            PACKAGES='["frontend"]'
          fi
          
          if git diff HEAD^ HEAD --name-only | grep -q "backend/"; then
            PACKAGES='["backend"]'
          fi
          
          # Default to both if no specific changes
          PACKAGES=${PACKAGES:-'["frontend","backend"]'}
          
          echo "matrix={\"package\":$PACKAGES}" >> $GITHUB_OUTPUT
  
  test:
    needs: detect-changes
    strategy:
      matrix: ${{ fromJSON(needs.detect-changes.outputs.matrix) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Testing ${{ matrix.package }}"
      - run: cd ${{ matrix.package }} && npm test
```
</details>

---

## 🎓 Pro-Tips

### Complex Include Patterns

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    node: [18, 20]
    include:
      # Override specific combination
      - os: ubuntu-latest
        node: 20
        # These properties are ADDED to the combination
        coverage: true
        timeout: 45
        name-suffix: "with coverage"
```

### Exclude Multiple Combinations

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node: [16, 18, 20, 22]
    exclude:
      # Exclude all macOS + Node 16
      - os: macos-latest
        node: 16
      
      # Exclude all macOS + Node 18
      - os: macos-latest
        node: 18
      
      # Exclude Windows + Node 22
      - os: windows-latest
        node: 22
```

### Matrix Best Practices

1. **Start small:** Begin with 2-3 combinations, expand as needed
2. **Use fail-fast: false:** See all failures, not just the first
3. **Name jobs clearly:** Use matrix variables in job names
4. **Control costs:** Use max-parallel on expensive runners
5. **Document matrix logic:** Comment why specific includes/excludes exist

---

## 📚 Complete Reference

### Advanced Matrix Syntax

```yaml
strategy:
  matrix:
    var1: [v1, v2]
    var2: [v1, v2]
    include:
      - var1: value
        var2: value
        custom: value
    exclude:
      - var1: value
        var2: value
  fail-fast: boolean
  max-parallel: number
```

### Dynamic Matrix

```yaml
jobs:
  setup:
    outputs:
      matrix: ${{ steps.gen.outputs.matrix }}
    steps:
      - id: gen
        run: echo 'matrix={"version":["1","2"]}' >> $GITHUB_OUTPUT
  
  test:
    needs: setup
    strategy:
      matrix: ${{ fromJSON(needs.setup.outputs.matrix) }}
```

---

**Next Chapter:** [Chapter 20 - Access Workflow Context Information](chapter-20-context.md)

**Coming Up:** Deep dive into all available context objects (github, env, job, steps, runner, needs) and using them effectively in workflows.
