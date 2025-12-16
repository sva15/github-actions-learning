# Chapter 24: Enable Step Debug Logging

## 🎯 Phase 1: Core Explanation

### The Flight Recorder Analogy
Debug logging is like an **airplane's black box recorder**:
- **Normal mode** = Basic flight data
- **Debug mode** = Every sensor, every decision
- **Post-incident** = Replay what went wrong

### One-Sentence Definition
**Debug logging provides detailed diagnostic output for workflow execution by enabling `ACTIONS_STEP_DEBUG` and `ACTIONS_RUNNER_DEBUG` secrets, revealing internal GitHub Actions processing, environment setup, and step execution details invisible in normal logs.**

---

## 🛠️ Phase 2: Implementation Patterns

### Pattern 1: Enable Debug via Repository Secrets

**Setup (one-time):**
1. Go to Settings → Secrets and variables → Actions
2. Add repository secret:
   - Name: `ACTIONS_STEP_DEBUG`
   - Value: `true`
3. Add repository secret:
   - Name: `ACTIONS_RUNNER_DEBUG`
   - Value: `true`

**Result:** All workflow runs now have debug logging

### Pattern 2: Re-run with Debug (Easier Method)

1. Go to failed workflow run
2. Click "Re-run jobs" dropdown
3. Select "Re-run all jobs" → "Enable debug logging"
4. Check the box → "Re-run jobs"

**Result:** Only this run has debug logging

### Pattern 3: Debug Output in Workflow

```yaml
steps:
  - name: Debug information
    run: |
      echo "::debug::This is debug level"
      echo "::notice::This is notice level"
      echo "::warning::This is a warning"
      echo "::error::This is an error"
  
  - name: Set outputs with debug
    run: |
      echo "::debug::Setting output variable"
      echo "result=success" >> $GITHUB_OUTPUT
```

### Pattern 4: Conditional Debug Steps

```yaml
steps:
  - if: runner.debug == '1'
    run: |
      echo "Debug mode is enabled"
      env | sort
      ls -laR
```

---

## 📚 Debug Output Examples

**Normal log:**
```
Run npm test
> test
> jest
PASS ./test.js
```

**Debug log:**
```
##[debug]Evaluating: npm test
##[debug]Evaluating Index:
##[debug]..Evaluating npm:
##[debug]..=> 'npm'
##[debug]..Evaluating test:
##[debug]..=> 'test'
##[debug]=> 'npm test'
##[debug]Starting: npm test
Run npm test
##[debug]Node Action run completed with exit code '0'
```

---

## 🎯 Practice Exercise

**Task:** Enable debug logging and identify why a workflow fails.

<details>
<summary>Solution Steps</summary>

1. Go to failed workflow → "Re-run jobs"
2. Enable debug logging
3. Review debug output for:
   - Environment variables
   - Path resolution
   - File permissions
   - Command execution details
</details>

---

## 🎓 Pro-Tips

### Debug Workflow Commands

```yaml
steps:
  - run: echo "::debug::Debug message (only visible when debug enabled)"
  - run: echo "::notice::Notice message (always visible)" 
  - run: echo "::warning::Warning message"
  - run: echo "::error::Error message"
```

### Debugging Common Issues

| Issue | What to Check in Debug Logs |
|-------|---------------------------|
| File not found | Path resolution, working directory |
| Permission denied | File permissions, runner user |
| Command fails | Environment variables, PATH |
| Secret not working | Whether secret exists (won't show value) |

---

**Next Chapter:** [Chapter 25-28 - Final Chapters](chapter-25-28-final.md)
