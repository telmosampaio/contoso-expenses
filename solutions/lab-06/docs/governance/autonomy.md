# Agent autonomy levels

| Level | Meaning | Human involvement | Technical control |
| --- | --- | --- | --- |
| L3 Autonomous | Agent acts; merges after automated checks and a lightweight review | One approval, no plan, no code owner | Docs are outside planRequiredPaths and have no CODEOWNERS entry; required status checks |
| L2 Reviewed | Agent acts; a human reviews the pull request | PR approval | Ruleset: PR required, CODEOWNERS |
| L1 Approved | A human approves the plan before the agent acts and reviews after | Plan approval + code-owner review | plan-check, CODEOWNERS on docs/plans and src/policy.js, hook protectedPaths |
| L0 Human only | Agents may prepare, never execute | A human performs the action | Environment required reviewers, hook denyCommands |

## Action classification

| Action | Operational risk | Security risk | Compliance risk | Level |
| --- | --- | --- | --- | --- |
| Edit README.md or docs/ (not plans) | Low | Low | Low | L3 |
| Add tests | Low | Low | Low | L2 |
| Change application code in src/ (not policy) | Medium | Medium | Low | L2 |
| Change approval thresholds in src/policy.js | Medium | Low | High | L1 |
| Approve a plan (Status/Approved-by lines) | Medium | Medium | High | L0 |
| Change workflows, hooks, agents, CODEOWNERS, config | High | High | Medium | L1 |
| Destructive commands (rm -rf, force push, reset --hard) | High | High | Medium | L0 |
| Merge to main | Medium | Medium | Medium | L2 (ruleset) |
| Deploy to production | High | High | High | L0 (environment reviewer) |
