# Plan: FEAT-2 Require justification for meals over $60.00

Issue: #2
Status: Approved
Approved-by: @telmosampaio
Author-agent: Copilot

## Goal
Require a `justification` for meal expenses above 60.00 when its trimmed string length is at least 10 characters. Return the contract's exact validation error when it is absent or invalid, and store a supplied justification on the created expense record. Other categories and meals of exactly 60.00 remain unaffected.

## Inputs
- `docs/backlog.json` (FEAT-2 contract; issue number follows the FEAT-1 #1 mapping in `docs/plans/FEAT-1-receipt-required.md`).
- `docs/requirements.md` (expense validation and invalid-request response behavior).
- `docs/architecture.md` (validation and normalization belong in `src/expenses.js`; HTTP handling is in `src/server.js`).
- `src/expenses.js` (current validation and normalization, including FEAT-1 `receiptId` handling).
- `src/server.js` and `src/store.js` (POST validation flow and record persistence).
- `test/receipts.test.js`, `test/expenses.test.js`, and `test/server.test.js` (existing validation and HTTP test patterns).
- No `docs/memory/decisions.md` file is present.

## Files in scope
- `src/expenses.js`
- `test/justifications.test.js`

## Steps
1. Add conditional validation in `src/expenses.js`: only for `category === 'meals'` and `amount > 60`, require a string whose trimmed length is at least 10; use the exact FEAT-2 error text for all unmet cases.
2. Preserve a supplied `justification` in normalized expenses so the existing POST and store flow includes it on the record.
3. Add focused POST tests in `test/justifications.test.js` for the threshold, invalid and valid justification values, unaffected categories, persistence, and the independent FEAT-1 receipt requirement.

## Tests
- POST a meal for exactly 60.00 without a justification; expect success.
- POST a meal for 60.01 without a justification; expect 400 and error text exactly `justification is required for meals over 60.00`.
- POST a meal above 60.00 with a non-string value, whitespace-only value, or a value with 9 characters after trimming; expect 400 and the exact contract error text.
- POST a meal above 60.00 with exactly 10 characters after trimming; expect success and the supplied justification on the expense record.
- POST a non-meal expense above 60.00 without a justification; expect success.
- POST an $80.00 meal without a receipt and justification; expect both the FEAT-1 receipt error and the FEAT-2 justification error. POST the same meal with a valid receipt but no justification; expect the FEAT-2 error. With both valid fields, expect success and both values stored.
- Run `npm test`.

## Risks
- Using `>= 60.00` instead of `> 60.00` would reject the explicitly exempt boundary; cover 60.00 and 60.01.
- Checking the untrimmed length could accept whitespace-padded short values; cover trimmed lengths of 9 and 10.
- Making the rule category-independent or interfering with receipt validation would alter unrelated behavior; test another category and the combined $80 meal case.
- Validation without normalization would accept a justification but omit it from the stored record; assert persistence through the POST response.

## Success criteria
- Only meals with amounts greater than 60.00 require a string justification with at least 10 characters after trimming.
- Invalid required justifications return HTTP 400 with exactly `justification is required for meals over 60.00`.
- Other categories and meals at exactly 60.00 remain unaffected.
- Accepted justifications are present on created expense records, and FEAT-1 receipt behavior remains independent.
- `npm test` passes.
- Only the files listed under Files in scope change.

## Escalate to a human if
- The contract is intended to store a trimmed justification rather than preserve its supplied string.
- Implementing the contract requires changing a file outside the listed scope.
- Tests still fail after two attempts.
