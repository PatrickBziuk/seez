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
- [ ] Review and update GitHub Actions workflow
- [ ] Implement error log capture and extraction
- [ ] Add GitHub issue creation logic
- [ ] Test with simulated failures
- [ ] Document process in `docs/`
- [ ] Add/mark tasks in `docs/todo.md`

---

## Links
- [GitHub Actions docs](https://docs.github.com/en/actions)
- [GitHub REST API: Issues](https://docs.github.com/en/rest/issues/issues)
- [gh CLI](https://cli.github.com/manual/gh_issue_create)

---

## Task Reference
- Add to `docs/todo.md` as a new task: "Automate GitHub issue creation for CI build failures (see plan-10015-ci-auto-issue.md)"
