# Contoso Expense Service (GH-600 lab repository)

A small Node.js service that validates expense claims and routes them to an approver. In the GH-600 labs a team of GitHub Copilot agents (planner, implementer, tester, reviewers, an orchestrator) extends it feature by feature, under the guardrails you configure.

## Labs

Start with **[labs/00-setup.md](labs/00-setup.md)**, then follow the labs in order: [labs/README.md](labs/README.md).

Students: do not clone this repository directly. Select **Use this template > Create a new repository** to make your own public copy, then clone that copy (the setup guide walks you through it).

## Quick start

```bash
npm ci      # no dependencies; creates nothing but proves npm works
npm test    # 20 tests should pass
npm start   # http://localhost:3000/health
```

Try it:

```bash
curl -s -X POST localhost:3000/expenses -H 'content-type: application/json' \
  -d '{"employee":"ana","amount":42.5,"category":"travel","date":"2026-01-10"}'
```

## Lab tooling

| Command | Used in | What it does |
| --- | --- | --- |
| `node scripts/seed-issues.js` | Setup | Creates the backlog issues FEAT-1 to DOCS-8 in your repository (needs `gh`) |
| `npm run check-plan -- --plan <file>` | Labs 1-2 | Validates a plan file; in CI it also checks scope against the PR diff |
| `npm run eval -- --plan <file>` | Lab 5 | Evaluation scorecard: tests, spec golden cases, secrets, plan, scope |
| `node scripts/agent-policy.js` | Lab 6 | `preToolUse` hook that blocks risky agent actions |
| `node scripts/catch-up.js <lab> --owner <login>` | Any | Copies reference solutions for labs 1..N |
| `bash instructor/verify-labs.sh` | Instructors | Replays all six labs end to end with the reference files (73 checks) |

See `docs/architecture.md` and `docs/requirements.md`.
