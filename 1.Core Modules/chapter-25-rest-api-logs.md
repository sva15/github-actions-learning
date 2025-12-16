# Chapter 25: Access Workflow Logs from REST API

## 🎯 Phase 1: Core Explanation

### The Security Camera System Analogy
Think of workflow log access like a **security camera DVR system**:

| DVR System | GitHub Actions REST API |
|------------|------------------------|
| **Live view** | Watch workflow run in UI |
| **Recordings** | Stored workflow logs |
| **Playback** | Download logs via API |
| **Search** | Query runs by status/date |
| **Remote access** | API access from anywhere |

### One-Sentence Definition
**The GitHub Actions REST API provides programmatic access to workflow runs, job details, and execution logs, enabling automated log retrieval, analysis, monitoring dashboards, and integration with external logging systems.**

### Why API Access Matters

**Without API access:**
- ❌ Manual log downloads from UI
- ❌ Can't automate log analysis
- ❌ No custom dashboards
- ❌ Can't integrate with external tools

**With API access:**
- ✅ Automated log collection
- ✅ Custom monitoring dashboards
- ✅ Failure pattern detection
- ✅ Compliance logging
- ✅ Integration with ELK, Splunk, etc.

### 💡 Production Reality

**Fact 1:** Many enterprises use the API to aggregate logs from hundreds of repositories into centralized monitoring systems.

**Fact 2:** Log retention is 90 days for public repos, 400 days for private (GitHub Enterprise). Use API to archive critical logs longer.

**Fact 3:** Logs are returned as **compressed archives** - you must decompress them programmatically.

---

## 🛠️ Phase 2: Implementation Drill

### Pattern 1: List Workflow Runs

**Using curl:**
```bash
curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/actions/runs
```

**Using GitHub CLI:**
```bash
gh api \
  -H "Accept: application/vnd.github+json" \
  /repos/OWNER/REPO/actions/runs

# Simplified
gh run list --limit 20 --json conclusion,status,databaseId,startedAt
```

**Response (sample):**
```json
{
  "total_count": 150,
  "workflow_runs": [
    {
      "id": 1234567890,
      "name": "CI",
      "status": "completed",
      "conclusion": "success",
      "workflow_id": 123456,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:35:00Z",
      "run_number": 42,
      "event": "push",
      "head_branch": "main"
    }
  ]
}
```

### Pattern 2: Get Specific Workflow Run

```bash
RUN_ID=1234567890

curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/runs/$RUN_ID

# With GitHub CLI
gh run view $RUN_ID --json conclusion,jobs,status
```

### Pattern 3: Download Workflow Logs

```bash
# Download logs (returns ZIP archive)
curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/runs/$RUN_ID/logs \
  -o workflow-logs.zip

# Extract
unzip workflow-logs.zip

# With GitHub CLI
gh run download $RUN_ID --name artifact-name
```

**Important:** Logs are compressed. Must decompress before reading.

### Pattern 4: Query Failed Runs

```bash
# List failed runs
curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/repos/OWNER/REPO/actions/runs?status=failure"

# With GitHub CLI
gh run list --limit 50 --status failure --json databaseId,conclusion,createdAt,headBranch
```

### Pattern 5: Automated Log Collection Script

```bash
#!/bin/bash
# collect-logs.sh - Collect logs from last 10 runs

OWNER="your-org"
REPO="your-repo"
OUTPUT_DIR="./logs"

mkdir -p "$OUTPUT_DIR"

# Get last 10 run IDs
RUN_IDS=$(gh api \
  "/repos/$OWNER/$REPO/actions/runs?per_page=10" \
  --jq '.workflow_runs[].id')

for RUN_ID in $RUN_IDS; do
  echo "Downloading logs for run $RUN_ID..."
  
  curl -L \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    "https://api.github.com/repos/$OWNER/$REPO/actions/runs/$RUN_ID/logs" \
    -o "$OUTPUT_DIR/run-$RUN_ID.zip"
  
  # Extract
  unzip -q "$OUTPUT_DIR/run-$RUN_ID.zip" -d "$OUTPUT_DIR/run-$RUN_ID"
  rm "$OUTPUT_DIR/run-$RUN_ID.zip"
  
  echo "Saved to $OUTPUT_DIR/run-$RUN_ID"
done
```

### Pattern 6: Python Script for Log Analysis

```python
import requests
import zipfile
import io

GITHUB_TOKEN = "ghp_your_token"
OWNER = "your-org"
REPO = "your-repo"

headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "X-GitHub-Api-Version": "2022-11-28"
}

# Get recent runs
url = f"https://api.github.com/repos/{OWNER}/{REPO}/actions/runs"
response = requests.get(url, headers=headers)
runs = response.json()["workflow_runs"]

for run in runs[:5]:  # Last 5 runs
    run_id = run["id"]
    conclusion = run["conclusion"]
    
    if conclusion == "failure":
        # Download logs
        logs_url = f"{url}/{run_id}/logs"
        logs_response = requests.get(logs_url, headers=headers)
        
        # Extract and analyze
        with zipfile.ZipFile(io.BytesIO(logs_response.content)) as z:
            for filename in z.namelist():
                with z.open(filename) as f:
                    content = f.read().decode('utf-8')
                    if "error" in content.lower():
                        print(f"Error found in {run_id}/{filename}")
```

### Pattern 7: Get Job Logs

```bash
# List jobs in a run
gh api /repos/OWNER/REPO/actions/runs/$RUN_ID/jobs

# Get specific job logs
JOB_ID=123456789
curl -L \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/repos/OWNER/REPO/actions/jobs/$JOB_ID/logs"
```

---

## 🎯 Practice Exercises

### Exercise 1: List Recent Runs
**Task:** Use GitHub CLI to list last 10 workflow runs with their conclusions.

<details>
<summary>Solution</summary>

```bash
gh run list --limit 10 --json databaseId,conclusion,status,createdAt,headBranch \
  --jq '.[] | "ID: \(.databaseId) | Status: \(.conclusion) | Branch: \(.headBranch)"'
```
</details>

### Exercise 2: Download Failed Run Logs
**Task:** Download logs for the most recent failed workflow run.

<details>
<summary>Solution</summary>

```bash
#!/bin/bash

# Get most recent failed run ID
FAILED_RUN=$(gh run list --status failure --limit 1 --json databaseId --jq '.[0].databaseId')

if [ -z "$FAILED_RUN" ]; then
  echo "No failed runs found"
  exit 1
fi

echo "Downloading logs for failed run: $FAILED_RUN"

gh run download $FAILED_RUN

echo "Logs downloaded to current directory"
```
</details>

---

## 🎓 Pro-Tips

### API Rate Limits

```bash
# Check rate limit status
gh api rate_limit

# For authenticated requests: 5,000 requests/hour
# For unauthenticated: 60 requests/hour
```

### Pagination

```bash
# Get more results
curl "https://api.github.com/repos/OWNER/REPO/actions/runs?per_page=100&page=2"

# GitHub CLI handles pagination automatically
gh run list --limit 200
```

### Real-World Use Cases

**1. Automated Failure Alerts:**
```bash
#!/bin/bash
# cron job: */15 * * * * /path/to/check-failures.sh

FAILURES=$(gh run list --status failure --limit 5 --created "$(date -d '15 minutes ago' -Iseconds)")

if [ -n "$FAILURES" ]; then
  # Send alert to Slack/PagerDuty
  curl -X POST $SLACK_WEBHOOK -d "{\"text\":\"GitHub Actions failures detected\"}"
fi
```

**2. Compliance Logging:**
```python
# Archive all logs for compliance (90-day retention → long-term storage)
import boto3  # For S3 upload

def archive_logs():
    runs = get_all_runs()
    for run in runs:
        logs = download_run_logs(run['id'])
        upload_to_s3(logs, f"github-logs/{run['id']}.zip")
```

**3. Custom Dashboards:**
Track metrics like:
- Success rate by branch
- Average execution time
- Most frequent failures
- Cost analysis per workflow

---

## 📚 Complete API Reference

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /repos/{owner}/{repo}/actions/runs` | List runs |
| `GET /repos/{owner}/{repo}/actions/runs/{run_id}` | Get run details |
| `GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs` | Download logs (ZIP) |
| `GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs` | List jobs in run |
| `POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun` | Re-run workflow |
| `POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel` | Cancel run |

### Query Parameters

```bash
# Filter by status
?status=completed|in_progress|queued

# Filter by conclusion
?conclusion=success|failure|cancelled|skipped

# Filter by actor
?actor=username

# Filter by branch
?branch=main

# Filter by event
?event=push|pull_request|workflow_dispatch

# Pagination
?per_page=100&page=2
```

---

## 🎯 Knowledge Check

- [ ] Can list workflow runs via API
- [ ] Understand log downloads return ZIP archives
- [ ] Know how to query failed runs
- [ ] Can integrate logs with external systems
- [ ] Understand rate limits and pagination

---

**Next Chapter:** [Chapter 26 - workflow_dispatch Input Options](chapter-26-workflow-dispatch-inputs.md)

**Coming Up:** Master advanced input types for manual workflows including choice, boolean, environment, and number inputs with validation patterns.
