# Plan: Automated GitHub Issue Creation for Build Failures in CI

**Plan Number:** 10015
**Feature Title:** Automated GitHub Issue Creation for Build Failures
**Goal:**
Automatically create a GitHub issue with detailed error information whenever the deployment pipeline (CI) build fails, to improve error tracking and team response.

---

## Steps
1. **Research**: Review current GitHub Actions workflow and error reporting best practices.
2. **Error Capture**: Add a step to the workflow to capture build logs on failure.
3. **Error Extraction**: Implement logic (e.g., Node.js script or shell) to parse logs and extract error type, message, file, and line number.
4. **Issue Creation**: Use the GitHub API (REST or gh CLI) to create an issue with the extracted error details.
5. **Security**: Ensure secrets (tokens) are handled securely and logs are sanitized.
6. **Testing**: Simulate build failures to verify issue creation and error detail quality.
7. **Documentation**: Document the workflow, error extraction logic, and usage in the repo docs.

---

## Edge Cases
- Multiple errors: Only the first/most relevant error is reported.
- Log size: Truncate or summarize if too large.
- API rate limits: Handle gracefully.
- Sensitive data: Sanitize logs before posting.

---

## Impact
- Faster awareness and triage of build issues.
- Centralized error tracking and discussion.
- Improved team workflow and transparency.

---

## Checklist
- [x] Review and update GitHub Actions workflow
- [x] Implement error log capture and extraction
- [x] Add GitHub issue creation logic
- [ ] Test with simulated failures
- [x] Document process in `docs/ci-auto-issue.md`
- [x] Add/mark tasks in `docs/todo.md`

---

## Links
- [GitHub Actions docs](https://docs.github.com/en/actions)
- [GitHub REST API: Issues](https://docs.github.com/en/rest/issues/issues)
- [gh CLI](https://cli.github.com/manual/gh_issue_create)

---

## Task Reference
- Add to `docs/todo.md` as a new task: "Automate GitHub issue creation for CI build failures (see plan-10015-ci-auto-issue.md)"


# Automated GitHub Issue Creation for Build Failures – Documentation

## Overview
This document describes the process and implementation for automatically creating a GitHub issue when a build fails in the CI pipeline. The goal is to ensure all build errors are tracked and actionable, with detailed error context for rapid triage.

---

# CI Build Failure Auto-Issue Workflow

This project automatically creates a GitHub issue when the CI build fails on the main branch. The workflow:

1. **Build Step**: If the build fails, the workflow captures the build log.
2. **Error Extraction**: The script `scripts/extract-error.js` parses the log and outputs a summary (error type, file, line, column).
3. **Issue Creation**: The workflow uses the `gh` CLI to create a GitHub issue with the error summary and a link to the failed run.
4. **Security**: The workflow uses the built-in `GITHUB_TOKEN` and only posts a truncated, sanitized error summary.

## References
- See `.github/workflows/actions.yaml` for implementation.
- See `scripts/extract-error.js` for error parsing logic.
- Plan: `docs/plan-10015-ci-auto-issue.md`

## Testing
- Simulate a build failure (e.g., break a build step) and push to `main` to verify issue creation.
- Review the created issue for error detail and sensitive data.

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
