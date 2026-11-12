# Plan: FEAT-1 Require a receipt for expenses over $75.00

Issue: #1
Status: Approved
Approved-by: @OWNER
Author-agent: Plan (built-in)

## Goal
Reject expenses above 75.00 that have no `receiptId`, using the exact contract message, and store `receiptId` when present.

## Inputs
- Issue #1 contract
- docs/requirements.md (FR-1, FR-6)
- src/expenses.js, src/server.js, test/expenses.test.js

## Files in scope
- src/expenses.js
- test/receipts.test.js

## Steps
1. Add `RECEIPT_THRESHOLD = 75` to src/expenses.js.
2. In `validateExpense`, when `amount > 75` and `receiptId` is missing or blank, push `receiptId is required for expenses over 75.00`.
3. In `normalizeExpense`, copy a trimmed non-empty `receiptId` onto the expense.
4. Add test/receipts.test.js with the boundary and storage tests below.
5. Run `npm test`.

## Tests
- 75.00 without receipt is valid (boundary)
- 75.01 without receipt is rejected with the exact message
- blank `receiptId` is rejected
- `receiptId` is stored by `normalizeExpense`

## Risks
- Existing HTTP tests post 42.50, so they are unaffected. Any client posting above 75.00 without a receipt now gets a 400 (intended).

## Success criteria
- `npm test` passes with the 4 new tests
- Error text matches the contract exactly
- Only the files in scope changed

## Escalate to a human if
- The contract conflicts with docs/requirements.md
- Tests still fail after 2 attempts
