# Chapter 7: Workflow to Generate ASCII Artwork (Practical Example)

## 🎯 Phase 1: Core Explanation

### The Art Gallery Analogy
Think of this workflow as an **automated art studio**:
- **Input:** Plain text or images
- **Processing:** Third-party tools convert to ASCII
- **Output:** Text-based artwork in logs or as artifacts
- **Purpose:** Demonstrates installing tools, processing data, and producing visible results

This chapter is a **practical demonstration** bringing together concepts from previous chapters: checkout, multi-line commands, third-party tools, and command

-line processing.

### One-Sentence Definition
**This workflow demonstrates real-world tool integration by installing and using command-line utilities (like `figlet`, `cowsay`, `jp2a`) to generate ASCII art from text and images within a GitHub Actions pipeline.**

### Why This Matters in Production
While ASCII art seems trivial, the patterns taught here apply to:
- **Image processing:** Converting/optimizing images in CI/CD
- **Report generation:** Creating visual dashboards from data
- **QR codes:** Generating QR codes for app builds
- **Diagrams:** Auto-generating architecture diagrams from code

**It's about learning tool integration, not the art itself.**

### 💡 Production Insight
I've used similar workflows to:
- Generate QR codes linking to staging environments
- Create deployment banners in Slack notifications
- Convert project logos to terminal-friendly format for CLI tools
- Auto-generate ASCII tables for build reports

---

## 🛠️ Phase 2: Implementation Drill

### Example 1: Basic Figlet Banner

```yaml
name: ASCII Banner Generator

on: workflow_dispatch

jobs:
  banner:
    runs-on: ubuntu-latest
    steps:
      - name: Install figlet
        run: sudo apt-get update && sudo apt-get install -y figlet
      
      - name: Generate banner
        run: |
          echo "Generating ASCII banner..."
          figlet "GitHub Actions"
          echo ""
          figlet -f big "CI/CD Pipeline"
```

**Output in logs:**
```
  ____ _ _   _   _       _        _        _   _                 
 / ___(_) |_| | | |_   _| |__    / \   ___| |_(_) ___  _ __  ___ 
| |  _| | __| |_| | | | | '_ \  / _ \ / __| __| |/ _ \| '_ \/ __|
| |_| | | |_|  _  | |_| | |_) |/ ___ \ (__| |_| | (_) | | | \__ \
 \____|_|\__|_| |_|\__,_|_.__//_/   \_\___|\__|_|\___/|_| |_|___/
```

### Example 2: Cowsay with Dynamic Content

```yaml
name: Dynamic Cowsay

on:
  push:
    branches: [main]

jobs:
  cow-message:
    runs-on: ubuntu-latest
    steps:
      - name: Install cowsay
        run: sudo apt-get update && sudo apt-get install -y cowsay
      
      - name: Generate message
        run: |
          MESSAGE="Build triggered by ${{ github.actor }} on branch ${{ github.ref_name }}"
          /usr/games/cowsay "$MESSAGE"
      
      - name: Fortune cow
        run: |
          sudo apt-get install -y fortune
          /usr/games/fortune | /usr/games/cowsay
```

**Output:**
```
 _______________________________________
/ Build triggered by octocat on branch \
\ main                                  /
 ---------------------------------------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

### Example 3: Image to ASCII with jp2a

```yaml
name: Image to ASCII

on: workflow_dispatch

jobs:
  image-art:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Install jp2a
        run: sudo apt-get update && sudo apt-get install -y jp2a
      
      - name: Download sample image
        run: |
          wget https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png
      
      - name: Convert to ASCII
        run: |
          echo "Converting GitHub logo to ASCII..."
          jp2a --width=80 GitHub-Mark.png
      
      - name: Convert with colors (if terminal supports)
        run: |
          jp2a --width=80 --colors GitHub-Mark.png || echo "Color not supported in logs"
```

### Example 4: Complete ASCII Art Pipeline

```yaml
name: ASCII Art Pipeline

on:
  workflow_dispatch:
    inputs:
      text:
        description: 'Text to convert'
        required: true
        default: 'Hello World'
      font:
        description: 'Figlet font'
        required: false
        default: 'standard'

jobs:
  generate-art:
    name: 🎨 Generate ASCII Art
    runs-on: ubuntu-latest
    steps:
      - name: Install tools
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            figlet \
            cowsay \
            toilet \
            lolcat
      
      - name: List available fonts
        run: |
          echo "Available figlet fonts:"
          ls /usr/share/figlet/*.flf | head -10
      
      - name: Generate with Figlet
        run: |
          echo "=== FIGLET OUTPUT ==="
          figlet -f "${{ github.event.inputs.font }}" "${{ github.event.inputs.text }}"
      
      - name: Generate with Toilet
        run: |
          echo "=== TOILET OUTPUT ==="
          toilet -f mono12 "${{ github.event.inputs.text }}"
      
      - name: Generate with Cowsay
        run: |
          echo "=== COWSAY OUTPUT ==="
          cowsay "${{ github.event.inputs.text }}"
      
      - name: Combined effect
        run: |
          echo "=== COMBINED ==="
          figlet "${{ github.event.inputs.text }}" | cowsay -n
      
      - name: Save to file
        run: |
          mkdir -p artwork
          figlet "${{ github.event.inputs.text }}" > artwork/banner.txt
          cowsay "${{ github.event.inputs.text }}" > artwork/cow.txt
          echo "✅ Artwork saved to files"
      
      - name: Upload artwork as artifact
        uses: actions/upload-artifact@v4
        with:
          name: ascii-artwork
          path: artwork/
```

### Example 5: QR Code Generation (Practical Use Case)

```yaml
name: Generate QR Code

on:
  push:
    branches: [main]

jobs:
  qr-code:
    runs-on: ubuntu-latest
    steps:
      - name: Install qrencode
        run: sudo apt-get update && sudo apt-get install -y qrencode
      
      - name: Generate QR code for commit
        run: |
          # Generate QR code as ASCII
          COMMIT_URL="https://github.com/${{ github.repository }}/commit/${{ github.sha }}"
          echo "Commit URL: $COMMIT_URL"
          qrencode -t ANSI "$COMMIT_URL"
      
      - name: Generate QR as PNG
        run: |
          mkdir -p qr-codes
          DEPLOY_URL="https://staging.example.com/${{ github.run_id }}"
          qrencode -o qr-codes/staging.png "$DEPLOY_URL"
      
      - name: Upload QR code
        uses: actions/upload-artifact@v4
        with:
          name: qr-codes
          path: qr-codes/
```

---

## 🎯 Practice Exercises

### Exercise 1: Simple Banner
**Task:** Create a workflow that:
1. Installs figlet
2. Generates a banner with your name
3. Runs on workflow_dispatch

<details>
<summary>Solution</summary>

```yaml
name: Personal Banner

on: workflow_dispatch

jobs:
  banner:
    runs-on: ubuntu-latest
    steps:
      - name: Install figlet
        run: sudo apt-get update && sudo apt-get install -y figlet
      
      - name: Generate banner
        run: figlet "Your Name Here"
```
</details>

### Exercise 2: Build Status Cow
**Task:** Create a workflow that:
1. Checks out code
2. Runs on push to main
3. Uses cowsay to announce "Build Started"
4. Uses figlet to show "Success!" at the end

<details>
<summary>Solution</summary>

```yaml
name: Build with Cow

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install tools
        run: sudo apt-get update && sudo apt-get install -y cowsay figlet
      
      - name: Announce start
        run: /usr/games/cowsay "Build Started for ${{ github.repository }}"
      
      - name: Simulate build
        run: |
          echo "Building..."
          sleep 2
          echo "Build complete!"
      
      - name: Celebrate success
        run: figlet "Success!"
```
</details>

### Exercise 3: Custom Artwork Pipeline
**Task:** Create a workflow with manual input that:
1. Accepts a message as input
2. Generates 3 different ASCII styles
3. Saves all to files
4. Uploads as artifact

<details>
<summary>Solution</summary>

```yaml
name: Custom Artwork

on:
  workflow_dispatch:
    inputs:
      message:
        description: 'Your message'
        required: true

jobs:
  artwork:
    runs-on: ubuntu-latest
    steps:
      - name: Install tools
        run: sudo apt-get update && sudo apt-get install -y figlet cowsay toilet
      
      - name: Create output directory
        run: mkdir -p output
      
      - name: Generate Figlet version
        run: figlet "${{ github.event.inputs.message }}" > output/figlet.txt
      
      - name: Generate Cowsay version
        run: /usr/games/cowsay "${{ github.event.inputs.message }}" > output/cowsay.txt
      
      - name: Generate Toilet version
        run: toilet "${{ github.event.inputs.message }}" > output/toilet.txt
      
      - name: Display all
        run: |
          echo "=== FIGLET ==="
          cat output/figlet.txt
          echo "=== COWSAY ==="
          cat output/cowsay.txt
          echo "=== TOILET ==="
          cat output/toilet.txt
      
      - name: Upload artwork
        uses: actions/upload-artifact@v4
        with:
          name: ascii-art
          path: output/
```
</details>

---

## 🧩 Phase 3: Synthesis Challenge

### Advanced Challenge: Deployment Banner Generator

**Requirements:**
Create a workflow that generates a comprehensive deployment banner:
1. Runs on tags (v*.*.*)
2. Extracts version from tag
3. Generates banner with:
   - Product name (figlet)
   - Version number (toilet)
   - Deployment message (cowsay)
   - Release URL QR code
4. Saves all to branded-release.txt
5. Posts the banner to deployment logs

**Difficulty:** ⭐⭐⭐⭐ (Advanced)

<details>
<summary>Hints</summary>

- Use `github.ref_name` to get tag
- Use `sed` or `${variable//pattern/}` to extract version
- Combine outputs with `>`  and `>>`
- QR code needs the full release URL
</details>

<details>
<summary>✅ Solution</summary>

```yaml
name: Deployment Banner

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  banner:
    name: 🎨 Generate Deployment Banner
    runs-on: ubuntu-latest
    steps:
      - name: Install tools
        run: |
          sudo apt-get update
          sudo apt-get install -y figlet cowsay toilet qrencode
      
      - name: Extract version
        id: version
        run: |
          VERSION=${{ github.ref_name }}
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "clean_version=${VERSION#v}" >> $GITHUB_OUTPUT
      
      - name: Generate banner
        run: |
          {
            echo "╔════════════════════════════════════════╗"
            echo "║                                        ║"
            figlet -c -w 80 "MyApp Deploy"
            echo "║                                        ║"
            echo "╚════════════════════════════════════════╝"
            echo ""
            toilet -f mono12 "Version ${{ steps.version.outputs.clean_version }}"
            echo ""
            /usr/games/cowsay "Deploying to production! 🚀"
            echo ""
            echo "Release URL:"
            RELEASE_URL="https://github.com/${{ github.repository }}/releases/tag/${{ steps.version.outputs.version }}"
            echo "$RELEASE_URL"
            echo ""
            qrencode -t ANSI "$RELEASE_URL"
          } > deployment-banner.txt
      
      - name: Display banner
        run: cat deployment-banner.txt
      
      - name: Upload banner
        uses: actions/upload-artifact@v4
        with:
          name: deployment-banner
          path: deployment-banner.txt
      
      - name: Add to summary
        run: |
          {
            echo "## 🎨 Deployment Banner"
            echo '```'
            cat deployment-banner.txt
            echo '```'
          } >> $GITHUB_STEP_SUMMARY
```
</details>

---

## 🎓 Phase 4: Pro-Tips & Real-World Applications

### 🚀 Real Production Use Cases

#### 1. Build Notification Banners
```yaml
# Send to Slack/Discord with ASCII art
- name: Generate success banner
  run: |
    BANNER=$(figlet "BUILD SUCCESS")
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -H 'Content-Type: application/json' \
      -d "{\"text\": \"\`\`\`\n$BANNER\n\`\`\`\"}"
```

#### 2. Version Comparison Tables
```yaml
# Generate ASCII table comparing versions
- name: Version comparison
  run: |
    sudo apt-get install -y boxes
    {
      echo "Old Version | New Version | Status"
      echo "v1.2.3      | v1.2.4      | ✅ Updated"
    } | boxes -d stone
```

#### 3. PR Review Checklists
```yaml
# Auto-comment on PRs with formatted checklist
- name: Generate checklist
  run: |
    figlet "PR Checklist" > checklist.txt
    cat >> checklist.txt << 'EOF'
    ☐ Tests passing
    ☐ Documentation updated
    ☐ Changelog entry added
    EOF
```

### ⚡ Performance Considerations

```yaml
# ❌ Installing tools every time
- run: sudo apt-get install -y figlet

# ✅ Cache installed tools (if frequently used)
- uses: actions/cache@v3
  with:
    path: /usr/bin/figlet
    key: figlet-v1

- name: Install if not cached
  run: |
    if [ ! -f /usr/bin/figlet ]; then
      sudo apt-get update && sudo apt-get install -y figlet
    fi
```

### 🎨 Available ASCII Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| `figlet` | Large text banners | `apt-get install figlet` |
| `cowsay` | Cow speech bubbles | `apt-get install cowsay` |
| `toilet` | Colored ASCII text | `apt-get install toilet` |
| `jp2a` | Image → ASCII | `apt-get install jp2a` |
| `qrencode` | QR code generator | `apt-get install qrencode` |
| `boxes` | Drawing boxes around text | `apt-get install boxes` |
| `lolcat` | Rainbow colors | `gem install lolcat` |
| `asciinema` | Terminal recording | `apt-get install asciinema` |

### 🔧 Debugging Tips

```yaml
# Check if tool is installed
- name: Verify installation
  run: |
    which figlet || echo "figlet not found"
    figlet --version
    
    # List available fonts
    ls -la /usr/share/figlet/

# Handle installation errors
- name: Safe install
  run: |
    sudo apt-get update || echo "Update failed"
    sudo apt-get install -y figlet || {
      echo "::error::Failed to install figlet"
      exit 1
    }
```

---

## 📚 Quick Reference

### Figlet Usage
```bash
# Basic
figlet "Hello"

# Choose font
figlet -f big "Hello"
figlet -f slant "Hello"

# Center text
figlet -c "Hello"

# Set width
figlet -w 120 "Hello"

# List fonts
ls /usr/share/figlet/*.flf
```

### Cowsay Usage
```bash
# Basic
cowsay "Hello"

# Different cow
cowsay -f dragon "Hello"
cowsay -f tux "Hello"

# No cow (thought bubble)
cowsay -n "Hello"

# List cows
cowsay -l
```

### QREncode Usage
```bash
# ASCII output
qrencode -t ANSI "https://example.com"

# PNG file
qrencode -o qr.png "https://example.com"

# UTF8 (better support)
qrencode -t UTF8 "https://example.com"
```

---

## 🎯 Knowledge Check

- [ ] Can install third-party ASCII tools in workflows
- [ ] Understand how to generate text banners
- [ ] Know how to pass dynamic content to ASCII generators
- [ ] Can save ASCII output to files
- [ ] Understand practical applications beyond novelty

### Real-World Takeaway
The techniques here teach you:
- ✅ Installing OS packages in CI/CD
- ✅ Processing text/images with command-line tools
- ✅ Generating visual feedback in logs
- ✅ Creating artifacts from processed data

**These patterns apply to ANY command-line tool, not just ASCII art!**

---

**Next Chapter:** [Chapter 8 - Executing Shell Scripts in Workflow](chapter-08-shell-scripts.md)

**Coming Up:** Learn how to organize complex logic into reusable shell scripts, source them in workflows, and manage script files in your repository structure.
