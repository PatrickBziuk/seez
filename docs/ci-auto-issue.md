# Automated GitHub Issue Creation for Build Failures – Documentation

## Overview
This document describes the process and implementation for automatically creating a GitHub issue when a build fails in the CI pipeline. The goal is to ensure all build errors are tracked and actionable, with detailed error context for rapid triage.

---

## Workflow Summary
- The GitHub Actions workflow is updated to include a post-build step that runs on failure.
- If the build fails, the workflow captures the error log.
- A script parses the log to extract the error type, message, file, and line number (if available).
- The script uses the GitHub REST API or `gh` CLI to create a new issue in the repository, including the error details and a link to the failed workflow run.

---

## Implementation Details
1. **Workflow Update**
   - Add a `post` or `failure` step to the main build job in `.github/workflows/ci.yml`.
   - Use `if: failure()` to trigger only on build failure.
2. **Error Extraction**
   - Use a Node.js or shell script to parse the build log for the first error (regex for `Error:`, file paths, line numbers).
   - Sanitize output to avoid leaking secrets or sensitive data.
3. **Issue Creation**
   - Use a GitHub token (with `repo` scope) stored in repository secrets.
   - Use the `gh` CLI or REST API to create an issue with a title like `Build Failure: [Short error summary]` and a body containing the error details and workflow run link.
4. **Testing**
   - Simulate build failures to verify the workflow and issue creation.
5. **Documentation**
   - Update this doc and the plan file with implementation notes, edge cases, and troubleshooting.

---

## Example Workflow Snippet
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Install & Build
        run: pnpm install && pnpm run build
      - name: On Failure – Create Issue
        if: failure()
        run: |
          node scripts/extract-error.js build.log > error-summary.txt
          gh issue create --title "Build Failure: $(head -n1 error-summary.txt)" --body "$(cat error-summary.txt)\nSee run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}" --label build-failure,automated
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Error Extraction Script Example (Node.js)
```js
// scripts/extract-error.js
const fs = require('fs');
const log = fs.readFileSync(process.argv[2], 'utf8');
const match = log.match(/Error: ([^\n]+)/);
if (match) {
  console.log(match[1]);
  // Optionally extract file/line info
}
else {
  console.log('Unknown error');
}
```

---

## Security & Edge Cases
- Only the first error is reported to avoid noise.
- Truncate logs if too large.
- Sanitize output for secrets.
- Handle API rate limits and errors gracefully.

---

## Maintenance
- Update the script and workflow as error patterns or CI tools change.
- Review issues for false positives or missed errors.

---

## References
- [Plan 10015](./plan-10015-ci-auto-issue.md)
- [GitHub Actions docs](https://docs.github.com/en/actions)
- [gh CLI](https://cli.github.com/manual/gh_issue_create)
- [GitHub REST API: Issues](https://docs.github.com/en/rest/issues/issues)
