# Plan: FEAT-3 Export expenses as CSV

Issue: #3
Status: Approved
Approved-by: @telmosampaio
Author-agent: Copilot

## Goal
Add `GET /expenses.csv` to return expenses as spreadsheet-friendly CSV with the exact contract header, content type, amount formatting, RFC 4180 escaping, and newline behavior.

## Inputs
- Issue #3 contract from `docs/backlog.json` (FEAT-3).
- `docs/requirements.md` and `docs/architecture.md`.
- `src/server.js` (route handling and response helper).
- `src/store.js` (insertion-ordered `list()` is already available).
- `test/server.test.js` (HTTP test patterns).
- `.github/instructions/tests.instructions.md` (one test file per issue, issue-key test names, and boundary coverage).
- No `docs/memory/decisions.md` file is present.

## Files in scope
- `src/server.js`
- `test/csv-export.test.js`

## Steps
1. Add a `GET /expenses.csv` handler in `src/server.js` that reads `store.list()` and returns the exact CSV content type and header.
2. Format each expense in creation order with the required columns, two-decimal amounts, RFC 4180 quoting for values containing commas, quotes, or newlines, and `\n` line endings.
3. Add issue-prefixed HTTP tests in `test/csv-export.test.js` for empty and populated stores, content type and header, record order, amount formatting, and escaping of comma, quote, and newline values.

## Tests
- With an empty store, `GET /expenses.csv` returns 200, `content-type: text/csv; charset=utf-8`, and only `id,employee,date,category,amount,status,route\n`.
- With multiple created expenses, verify one CSV row per expense in creation order and two decimal places for amounts, including cents-level and whole-dollar amounts.
- Verify field values containing a comma, a double quote, or a newline are quoted and embedded double quotes are doubled.
- Verify the exact header and that all CSV lines end with `\n`.
- Run `npm test`.

## Risks
- The generic response helper defaults strings to `text/plain`; the CSV route must override it with the exact contract content type.
- Incorrect quote escaping or newline handling can corrupt spreadsheet rows; cover each specified special character and verify the resulting CSV string.
- Reordering records or emitting extra columns would break the contract; assert creation order and the exact header.

## Success criteria
- `GET /expenses.csv` returns status 200 and `content-type: text/csv; charset=utf-8`.
- The first line is exactly `id,employee,date,category,amount,status,route`; empty stores return only that header line.
- Populated exports contain one row per expense in creation order, with two-decimal amounts and RFC 4180 escaping.
- Lines end with `\n`, and `npm test` passes.
- Only the files listed under Files in scope change.

## Escalate to a human if
- Implementing the contract requires changing a file outside the listed scope.
- An existing route or response convention conflicts with the exact CSV content type or output shape.
- Tests still fail after two attempts.
