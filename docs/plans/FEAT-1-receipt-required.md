# Plan: FEAT-1 Require a receipt for expenses over $75.00

Issue: #1
Status: Approved
Approved-by: @telmosampaio
Author-agent: Copilot

## Goal
Require a non-empty `receiptId` for `POST /expenses` requests with an amount greater than 75.00, return the contract's exact validation error when it is missing or empty, and store it on accepted expense records. An amount of exactly 75.00 remains valid without a receipt.

## Inputs
- GitHub issue #1 and `docs/backlog.json` (FEAT-1 contract).
- `docs/requirements.md` (invalid-request response behavior).
- `src/expenses.js`, `src/server.js`, and `src/store.js` (validation, request handling, and record persistence flow).
- Existing test patterns in `test/server.test.js` and validation coverage in `test/expenses.test.js`.
- No `docs/memory/decisions.md` file is present.

## Files in scope
- `src/expenses.js`
- `test/receipts.test.js`

## Steps
1. Extend expense validation to require a non-empty `receiptId` only when `amount` is greater than 75.00, using the exact contract error text for missing or empty values.
2. Preserve `receiptId` during normalization when it is present so the existing POST handler stores it in the expense record.
3. Add focused request-level tests in `test/receipts.test.js` for the threshold, validation response, and stored receipt value.

## Tests
- POST an expense for 75.00 without `receiptId`; expect success.
- POST an expense for 75.01 without `receiptId`; expect 400 and error text exactly `receiptId is required for expenses over 75.00`.
- POST an expense for 75.01 with a non-empty `receiptId`; expect success and the same `receiptId` on the returned expense record.
- POST an expense over 75.00 with an empty `receiptId`; expect 400 and the exact contract error text.

## Risks
- Applying the rule at 75.00 instead of strictly above it would reject a valid boundary case; include explicit 75.00 and 75.01 tests.
- Validation without normalization would accept the receipt but omit it from the stored record; verify the successful POST response includes it.
- Changing request handling or approval policy is unnecessary and risks changing unrelated behavior; reuse the existing validation error path.

## Success criteria
- Expenses over 75.00 without a non-empty `receiptId` return 400 with exactly `receiptId is required for expenses over 75.00`.
- An expense of exactly 75.00 succeeds without a receipt.
- A supplied non-empty `receiptId` appears on the created expense record.
- `npm test` passes.
- Only the files listed under Files in scope change.

## Escalate to a human if
- The contract is ambiguous about the required behavior for a supplied value that is not a string.
- Implementing the contract requires changing a file outside the listed scope.
- Tests still fail after two attempts.
