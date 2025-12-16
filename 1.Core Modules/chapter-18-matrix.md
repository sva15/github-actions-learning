# Chapter 18: Using a Matrix for Your Jobs

## 🎯 Phase 1: Core Explanation

### The Product Testing Analogy
Think of matrix strategies like **product compatibility testing**:

| Testing Scenario | GitHub Actions Matrix |
|------------------|----------------------|
| **Test phone app on:** | **Test code on:** |
| - iPhone 13, 14, 15 | - Node 18, 20, 22 |
| - iOS 15, 16, 17 | - Ubuntu, Windows, macOS |
| - Portrait/Landscape | - With/without feature flags |
| **Total tests:** 3×3×2 = 18 | **Total jobs:** Combinations |

### One-Sentence Definition
**Matrix strategies automatically generate multiple job variations by defining a set of configuration parameters, with GitHub Actions creating one job per combination, enabling comprehensive cross-platform and cross-version testing without repeating workflow code.**

### Why Matrix Strategies Matter

**Without matrix:**
```yaml
jobs:
  test-node-18-ubuntu: ...
  test-node-18-windows: ...
  test-node-18-macos: ...
  test-node-20-ubuntu: ...
  test-node-20-windows: ...
  # 9 separate job definitions! 😱
```

**With matrix:**
```yaml
jobs:
  test:
    strategy:
      matrix:
        node: [18, 20, 22]
        os: [ubuntu-latest, windows-latest, macos-latest]
    # 9 jobs automatically generated! ✨
```

### 💡 Production Reality

**Fact 1:** Matrix builds are how professional teams ensure compatibility. If you support Node 18, 20, and 22 on 3 OS types, matrix is non-negotiable.

**Fact 2:** Matrix jobs run **in parallel** by default, which can exhaust your concurrent job limit (20 for free tier).

**Fact 3:** The `max-parallel` setting is a cost control mechanism I wish teams used more often!

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: Basic Matrix (Single Dimension)

```yaml
jobs:
  test:
    strategy:
      matrix:
        node: [18, 20, 22]
    
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      
      - run: npm test
```

**Result:** 3 jobs created
- Job 1: node = 18
- Job 2: node = 20
- Job 3: node = 22

### Pattern 2: Multi-Dimensional Matrix

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

**Result:** 6 jobs (3 OS × 2 Node versions)
1. ubuntu + node 18
2. ubuntu + node 20
3. windows + node 18
4. windows + node 20
5. macos + node 18
6. macos + node 20

### Pattern 3: Matrix with Include

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [18, 20]
        include:
          # Add extra specific combination
          - os: macos-latest
            node: 20
            experimental: true
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      
      - if: matrix.experimental
        run: echo "This is an experimental build"
      
      - run: npm test
```

**Result:** 5 jobs
- 4 from base matrix (2 OS × 2 Node)
- 1 additional (macos + node 20 + experimental flag)

### Pattern 4: Matrix with Exclude

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
        exclude:
          # Don't test Node 18 on macOS (deprecated)
          - os: macos-latest
            node: 18
          
          # Don't test Node 22 on Windows (beta)
          - os: windows-latest
            node: 22
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

**Result:** 7 jobs (9 possible - 2 excluded)

### Pattern 5: Fail-Fast Strategy

```yaml
jobs:
  test:
    strategy:
      fail-fast: false  # Continue testing even if one fails
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
    
    runs-on: ${{ matrix.os }}
    steps:
      - run: npm test
```

**Default behavior (`fail-fast: true`):**
- If ANY matrix job fails → Cancel all remaining jobs

**With `fail-fast: false`:**
- All jobs run to completion regardless of failures

### Pattern 6: Max Parallel

```yaml
jobs:
  test:
    strategy:
      max-parallel: 2  # Only run 2 jobs concurrently
      matrix:
        version: [1, 2, 3, 4, 5, 6]
    
    runs-on: ubuntu-latest
    steps:
      - run: test-version-${{ matrix.version }}
```

**Execution:**
- Batch 1: Jobs 1, 2 (parallel)
- Batch 2: Jobs 3, 4 (parallel)
- Batch 3: Jobs 5, 6 (parallel)

**Use case:** Limit resource usage or API rate limits

### Pattern 7: Complex Matrix with Custom Variables

```yaml
jobs:
  test:
    strategy:
      matrix:
        include:
          - name: "Production Config"
            os: ubuntu-latest
            node: 20
            env: production
            timeout: 30
          
          - name: "Staging Config"
            os: ubuntu-latest
            node: 18
            env: staging
            timeout: 15
          
          - name: "Dev Config"
            os: windows-latest
            node: 22
            env: development
            timeout: 10
    
    name: ${{ matrix.name }}
    runs-on: ${{ matrix.os }}
    timeout-minutes: ${{ matrix.timeout }}
    
    env:
      NODE_ENV: ${{ matrix.env }}
    
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      
      - run: npm test
```

### Complete Example: Cross-Platform Testing

```yaml
name: Cross-Platform Tests

on: [push, pull_request]

jobs:
  test:
    name: Test on ${{ matrix.os }} with Node ${{ matrix.node }}
    
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
        exclude:
          # Node 18 EOL for macOS
          - os: macos-latest
            node: 18
        include:
          # Add Node 16 for Ubuntu (legacy support)
          - os: ubuntu-latest
            node: 16
            legacy: true
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Legacy compatibility tests
        if: matrix.legacy
        run: npm run test:legacy
```

---

## 🎯 Practice Exercises

### Exercise 1: Basic OS Matrix
**Task:** Create a matrix that tests on Ubuntu, Windows, and macOS.

<details>
<summary>Solution</summary>

```yaml
name: OS Matrix

on: push

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      - run: echo "Testing on ${{ matrix.os }}"
```
</details>

### Exercise 2: Version Matrix
**Task:** Test on Python versions 3.8, 3.9, 3.10, 3.11

<details>
<summary>Solution</summary>

```yaml
name: Python Matrix

on: push

jobs:
  test:
    strategy:
      matrix:
        python: ['3.8', '3.9', '3.10', '3.11']
    
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python }}
      
      - run: python --version
      - run: pytest
```
</details>

### Exercise 3: Combined Matrix with Exclusions
**Task:** Create matrix for Node (18, 20, 22) on (Ubuntu, Windows, macOS) but exclude Node 18 on macOS and Node 22 on Windows.

<details>
<summary>Solution</summary>

```yaml
name: Combined Matrix

on: push

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
        exclude:
          - os: macos-latest
            node: 18
          - os: windows-latest
            node: 22
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```
</details>

---

## 🎓 Pro-Tips

### Performance Optimization

**Control Parallel Execution:**
```yaml
strategy:
  max-parallel: 5  # Free tier: 20 concurrent jobs max
  matrix:
    version: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

**Cost Control on macOS:**
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    include:
      # Only test latest Node on expensive macOS
      - os: macos-latest
        node: 22
```

### Naming Jobs Clearly

```yaml
# ❌ Default name: "test (ubuntu-latest, 18)"
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest]
        node: [18]

# ✅ Descriptive name: "Test on Ubuntu with Node 18"
jobs:
  test:
    name: Test on ${{ matrix.os }} with Node ${{ matrix.node }}
    strategy:
      matrix:
        os: [ubuntu-latest]
        node: [18]
```

### Common Matrix Patterns

**Browser Testing:**
```yaml
matrix:
  browser: [chrome, firefox, safari, edge]
```

**Database Testing:**
```yaml
matrix:
  db: [postgres:13, postgres:14, postgres:15]
  include:
    - db: postgres:13
      db-port: 5432
```

**Feature Flag Testing:**
```yaml
matrix:
  feature: [enabled, disabled]
  environment: [staging, production]
```

---

## 📚 Complete Reference

### Matrix Syntax

```yaml
strategy:
  matrix:
    dimension1: [value1, value2]
    dimension2: [value1, value2]
    include:
      - dimension1: value
        dimension2: value
        extra: value
    exclude:
      - dimension1: value
        dimension2: value
  fail-fast: true|false
  max-parallel: number
```

### Accessing Matrix Values

```yaml
${{ matrix.variable-name }}

# Examples:
runs-on: ${{ matrix.os }}
node-version: ${{ matrix.node }}
if: matrix.experimental == true
```

---

**Next Chapter:** [Chapter 19 - Additional Matrix Configuration](chapter-19-matrix-advanced.md)

**Coming Up:** Advanced matrix patterns including dynamic matrices, matrix outputs, and combining matrices with other workflow features.
