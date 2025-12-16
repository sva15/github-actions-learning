# Chapter 26: workflow_dispatch Input Options

## 🎯 Phase 1: Core Explanation

### The Restaurant Order Form Analogy
Think of workflow_dispatch inputs like a **restaurant ordering system**:

| Order Form | workflow_dispatch Input |
|------------|------------------------|
| **Dropdown menu** | `type: choice` |
| **Checkbox (extra cheese)** | `type: boolean` |
| **Text field (special instructions)** | `type: string` |
| **Number (quantity)** | `type: number` |
| **Location selector** | `type: environment` |

### One-Sentence Definition
**workflow_dispatch inputs are strongly-typed parameters (string, choice, boolean, number, environment) that users provide when manually triggering workflows, enabling dynamic, user-controlled workflow behavior with built-in validation and UI controls.**

### Why Typed Inputs Matter

**Without typed inputs:**
- ❌ Everything is a string
- ❌ No validation
- ❌ Poor UX (free text for everything)
- ❌ Error-prone

**With typed inputs:**
- ✅ Type-safe parameters
- ✅ Built-in validation
- ✅ Better UI (dropdowns, checkboxes)
- ✅ Self-documenting workflows

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: String Input

```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy (e.g., v1.2.3)'
        required: true
        type: string
        default: 'latest'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy version
        run: |
          echo "Deploying version: ${{ inputs.version }}"
          ./deploy.sh ${{ inputs.version }}
```

**UI Display:** Text input field with placeholder

### Pattern 2: Choice Input (Dropdown)

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - development
          - staging
          - production
        default: staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - run: echo "Deploying to ${{ inputs.environment }}"
```

**UI Display:** Dropdown menu with 3 options

### Pattern 3: Boolean Input (Checkbox)

```yaml
on:
  workflow_dispatch:
    inputs:
      debug:
        description: 'Enable debug logging'
        required: false
        type: boolean
        default: false
      
      skip_tests:
        description: 'Skip test execution'
        required: false
        type: boolean
        default: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - if: inputs.debug == true
        run: echo "::debug::Debug mode enabled"
      
      - if: inputs.skip_tests == false
        run: npm test
```

**UI Display:** Checkboxes

### Pattern 4: Number Input

```yaml
on:
  workflow_dispatch:
    inputs:
      timeout:
        description: 'Timeout in minutes'
        required: false
        type: number
        default: 30
      
      replicas:
        description: 'Number of replicas'
        required: true
        type: number
        default: 3

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: ${{ inputs.timeout }}
    steps:
      - run: |
          echo "Deploying ${{ inputs.replicas }} replicas"
          echo "Timeout: ${{ inputs.timeout }} minutes"
```

**UI Display:** Number input field

### Pattern 5: Environment Input

```yaml
on:
  workflow_dispatch:
    inputs:
      target_environment:
        description: 'Deployment environment'
        required: true
        type: environment

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.target_environment }}
    steps:
      - run: |
          echo "Deploying to environment: ${{ inputs.target_environment }}"
          # Uses environment-specific secrets and protection rules
```

**UI Display:** Dropdown of configured environments

### Pattern 6: Combined Inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      # Choice
      deployment_type:
        description: 'Type of deployment'
        type: choice
        options:
          - rolling
          - blue-green
          - canary
        default: rolling
      
      # Environment
      environment:
        description: 'Target environment'
        type: environment
        required: true
      
      # String
      version:
        description: 'Version tag'
        type: string
        default: 'latest'
      
      # Number
      timeout:
        description: 'Deployment timeout (minutes)'
        type: number
        default: 30
      
      # Boolean
      dry_run:
        description: 'Perform dry run'
        type: boolean
        default: true
      
      # Boolean
      send_notifications:
        description: 'Send deployment notifications'
        type: boolean
        default: true

jobs:
  deploy:
    name: Deploy ${{ inputs.version }} to ${{ inputs.environment }}
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    timeout-minutes: ${{ inputs.timeout }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate inputs
        run: |
          echo "Deployment Configuration:"
          echo "  Type: ${{ inputs.deployment_type }}"
          echo "  Environment: ${{ inputs.environment }}"
          echo "  Version: ${{ inputs.version }}"
          echo "  Timeout: ${{ inputs.timeout }} min"
          echo "  Dry Run: ${{ inputs.dry_run }}"
          echo "  Notifications: ${{ inputs.send_notifications }}"
      
      - name: Check dry run mode
        if: inputs.dry_run == true
        run: echo "🔍 DRY RUN MODE - No actual deployment"
      
      - name: Execute deployment
        if: inputs.dry_run == false
        run: |
          ./deploy.sh \
            --type ${{ inputs.deployment_type }} \
            --env ${{ inputs.environment }} \
            --version ${{ inputs.version }}
      
      - name: Send notifications
        if: inputs.send_notifications == true && inputs.dry_run == false
        run: |
          echo "📧 Sending deployment notifications"
          ./notify.sh "${{ inputs.environment }}" "${{ inputs.version }}"
```

### Pattern 7: Input Validation

```yaml
jobs:
  validate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Validate version format
        run: |
          VERSION="${{ inputs.version }}"
          
          # Check semver format (v1.2.3)
          if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "::error::Invalid version format: $VERSION"
            echo "Expected format: v1.2.3"
            exit 1
          fi
          
          echo "✅ Version format valid: $VERSION"
      
      - name: Validate timeout range
        run: |
          TIMEOUT=${{ inputs.timeout }}
          
          if [ $TIMEOUT -lt 5 ] || [ $TIMEOUT -gt 120 ]; then
            echo "::error::Timeout must be between 5 and 120 minutes"
            exit 1
          fi
          
          echo "✅ Timeout valid: $TIMEOUT minutes"
```

---

## 🎯 Practice Exercises

### Exercise 1: Basic Deployment Workflow
**Task:** Create workflow_dispatch with environment (choice), version (string), and dry-run (boolean).

<details>
<summary>Solution</summary>

```yaml
name: Manual Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        type: choice
        options: [dev, staging, prod]
      version:
        description: 'Version'
        type: string
        default: 'latest'
      dry_run:
        description: 'Dry run'
        type: boolean
        default: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: |
          echo "Environment: ${{ inputs.environment }}"
          echo "Version: ${{ inputs.version }}"
          echo "Dry run: ${{ inputs.dry_run }}"
```
</details>

### Exercise 2: Validated Input
**Task:** Add validation for version to match semver format (v1.2.3).

<details>
<summary>Solution</summary>

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Validate version
        run: |
          if [[ ! "${{ inputs.version }}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "::error::Version must match v1.2.3 format"
            exit 1
          fi
      
      - run: echo "Deploying ${{ inputs.version }}"
```
</details>

---

## 🎓 Pro-Tips

### Input Type Comparison

| Type | UI Control | Use Case | Example |
|------|------------|----------|---------|
| `string` | Text field | Free text input | Version, commit SHA |
| `choice` | Dropdown | Predefined options | Environment, deployment type |
| `boolean` | Checkbox | Yes/No flags | Debug mode, skip tests |
| `number` | Number field | Numeric values | Timeout, replicas |
| `environment` | Environment dropdown | Protected environments | Staging, production |

### Best Practices

**1. Clear Descriptions:**
```yaml
# ❌ BAD
version:
  description: 'Version'

# ✅ GOOD
version:
  description: 'Semantic version to deploy (e.g., v1.2.3 or latest)'
```

**2. Sensible Defaults:**
```yaml
# ✅ GOOD - Safe defaults
inputs:
  dry_run:
    default: true  # Default to safe option
  environment:
    default: staging  # Default to non-prod
```

**3. Use Choice Over String When Possible:**
```yaml
# ❌ LESS IDEAL - Typo-prone
log_level:
  type: string
  description: 'debug, info, warn, or error'

# ✅ BETTER - No typos possible
log_level:
  type: choice
  options: [debug, info, warn, error]
```

---

## 📚 Complete Input Reference

### All Input Types

```yaml
on:
  workflow_dispatch:
    inputs:
      # String
      my_string:
        description: 'String description'
        required: true|false
        type: string
        default: 'value'
      
      # Choice
      my_choice:
        description: 'Choice description'
        required: true
        type: choice
        options:
          - option1
          - option2
        default: option1
      
      # Boolean
      my_boolean:
        description: 'Boolean description'
        required: false
        type: boolean
        default: true|false
      
      # Number
      my_number:
        description: 'Number description'
        required: false
        type: number
        default: 42
      
      # Environment
      my_environment:
        description: 'Environment description'
        required: true
        type: environment
```

### Accessing Inputs

```yaml
steps:
  - run: echo "${{ inputs.input_name }}"
  - run: echo "${{ github.event.inputs.input_name }}"  # Alternative
```

---

## 🎯 Knowledge Check

- [ ] Understand all 5 input types
- [ ] Can create choice inputs with options
- [ ] Know how to use boolean inputs conditionally
- [ ] Can validate inputs in workflow steps
- [ ] Understand environment input type

---

**Next Chapter:** [Chapter 27 - Configure Workflows for Webhook Events](chapter-27-webhook-events.md)

**Coming Up:** Learn to trigger workflows from external systems using repository_dispatch and custom webhook events.
