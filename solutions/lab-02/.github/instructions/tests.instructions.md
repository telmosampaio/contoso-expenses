---
applyTo: "test/**"
description: "Conventions for test files in the Contoso Expense Service"
---
- Use `node:test` and `node:assert/strict` only. No test frameworks.
- One test file per issue: `test/<feature>.test.js`. Prefix each test name with the issue key, for example `'FEAT-2: ...'`.
- Always test boundaries: the threshold itself, one cent above and one cent below.
- Pass a fixed `today` (`new Date('2026-06-15T12:00:00Z')`) to `validateExpense`. Never depend on the real clock.
