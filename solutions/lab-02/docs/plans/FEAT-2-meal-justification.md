# Plan: FEAT-2 Meals over the $60.00 per-diem need a justification

Issue: #2
Status: Approved
Approved-by: @OWNER
Author-agent: Planner

## Goal
Reject `meals` expenses above 60.00 without a justification of at least 10 characters, using the exact contract message, and store `justification` when present.

## Inputs
- Issue #2 contract
- docs/requirements.md
- src/expenses.js (already contains FEAT-1)

## Files in scope
- src/expenses.js
- test/meals.test.js

## Steps
1. Add `MEAL_PER_DIEM = 60` to src/expenses.js.
2. In `validateExpense`, when category is `meals`, amount > 60 and the trimmed `justification` is shorter than 10 characters, push `justification is required for meals over 60.00`.
3. In `normalizeExpense`, copy a trimmed non-empty `justification` onto the expense.
4. Add test/meals.test.js.
5. Run `npm test`.

## Tests
- 60.00 meal is valid; 60.01 meal without justification is rejected
- justification under 10 characters is rejected
- other categories are unaffected
- an 80.00 meal reports both the receipt and the justification errors
- justification is stored

## Risks
- Interaction with FEAT-1: both errors must be reported together (FR-6), not one masking the other.

## Success criteria
- `npm test` passes with 6 new tests
- Error text matches the contract exactly
- plan-check passes on the pull request

## Escalate to a human if
- "At least 10 characters" is unclear for whitespace-only input (decision: trim first)
