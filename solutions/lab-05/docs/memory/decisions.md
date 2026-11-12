# Project memory: decisions

Curated long-term memory for humans and agents. Keep entries short, factual and free of secrets.
Rules: one decision per row; `Review-by` is the expiry date; expired rows are ignored by agents until a human renews or removes them; superseded rows are struck through, not deleted.

| ID | Decision | Source | Decided | Review-by |
| --- | --- | --- | --- | --- |
| D-001 | Error texts in issue contracts are part of the public API and are copied exactly. | Issues #1-#6 | 2026-11-01 | 2027-05-01 |
| D-002 | No runtime dependencies; tests use `node:test` only. | docs/requirements.md | 2026-11-01 | 2027-05-01 |
| D-003 | All monetary thresholds are inclusive upper bounds (`<=`), and each one gets a boundary test. | BUG-7 root cause | 2026-11-12 | 2027-05-12 |
| D-004 | `src/policy.js` changes require an approved plan and a code-owner review. | CODEOWNERS, Lab 2 | 2026-11-01 | 2027-05-01 |
