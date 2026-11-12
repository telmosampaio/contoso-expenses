# Architecture

```
HTTP request
   │
   ▼
src/server.js   routing, JSON parsing, HTTP status codes (no business rules)
   │
   ├── src/expenses.js   validation + normalization (pure functions)
   ├── src/policy.js     approval routing thresholds (compliance-sensitive)
   └── src/store.js      in-memory storage
```

| Path | Purpose |
| --- | --- |
| `src/` | Application code |
| `test/` | `node:test` unit and HTTP tests |
| `scripts/` | Lab tooling: plan gate, evaluation scorecard, hook policy, issue seeding, catch-up |
| `config/agent-policy.json` | Guardrail rules: which paths need a plan (Lab 2) and what agents may not do (Lab 6) |
| `docs/plans/` | Agent plans (one file per issue) |
| `docs/handoffs/` | Multi-agent handoff logs (Lab 4) |
| `docs/progress/` | Durable task state for resuming agent work (Lab 5) |
| `docs/memory/` | Curated long-term project memory (Lab 5) |
| `docs/governance/` | Autonomy levels and readiness evidence (Lab 6) |
| `eval/` | Golden cases and evaluation results (Lab 5) |
| `solutions/` | Reference files per lab, used by `scripts/catch-up.js` |

Conventions: CommonJS, `'use strict'`, 2-space indent, no dependencies, error texts are part of the API contract.
