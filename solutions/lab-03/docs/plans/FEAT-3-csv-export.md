# Plan: FEAT-3 Export expenses as CSV

Issue: #3
Status: Approved
Approved-by: @OWNER
Author-agent: Planner

## Goal
Add `GET /expenses.csv` that returns every expense as RFC 4180 CSV with the exact header from the contract.

## Inputs
- Issue #3 contract (read through the github-readonly MCP server)
- src/server.js, src/store.js

## Files in scope
- src/csv.js
- src/server.js
- test/csv.test.js

## Steps
1. Create src/csv.js with `COLUMNS`, `escapeCsv` and `toCsv` (pure functions).
2. In src/server.js, route `GET /expenses.csv` to `toCsv(store.list())` with `content-type: text/csv; charset=utf-8`.
3. Add test/csv.test.js covering header, decimals, escaping and the HTTP route.
4. Run `npm test`.

## Tests
- empty store returns only the header line
- 42.5 renders as 42.50
- comma, double quote and newline escaping
- HTTP status, content type and first two lines

## Risks
- Route ordering: `/expenses.csv` must not be captured by the `/expenses/:id` matcher.

## Success criteria
- `npm test` passes with 4 new tests
- Header line matches the contract exactly
- plan-check passes on the pull request

## Escalate to a human if
- A column in the contract does not exist on stored expenses
