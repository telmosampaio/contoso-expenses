# Production readiness review: Contoso Expense Service agents

| # | Control | Evidence (link or path) | Status |
| --- | --- | --- | --- |
| 1 | Autonomy levels defined | docs/governance/autonomy.md | |
| 2 | Plans required and approved by a human | plan-check runs on PRs; docs/plans/* Approved-by | |
| 3 | Branch protection on main | Settings > Rules > Rulesets > protect-main | |
| 4 | Code owners for sensitive paths | .github/CODEOWNERS | |
| 5 | Least-privilege agent tools | .github/agents/*.agent.md tools; docs/agents/tool-matrix.md | |
| 6 | Read-only GitHub MCP for planning | .vscode/mcp.json | |
| 7 | Deterministic guardrails (hooks) | .github/hooks/policy.json, config/agent-policy.json, .agent-audit/hook-log.jsonl | |
| 8 | Least-privilege GITHUB_TOKEN | `permissions: contents: read` in every workflow | |
| 9 | Human approval for production | Environment `production` with required reviewer; Deploy run history | |
| 10 | Evaluation signals in CI | eval.yml artifact; CodeQL alerts | |
| 11 | Traceability of multi-agent work | docs/handoffs/*.md; PR Agent trace sections | |
| 12 | Agent lifecycle managed | docs/agents/CHANGELOG.md; docs/agents-retired/ | |
