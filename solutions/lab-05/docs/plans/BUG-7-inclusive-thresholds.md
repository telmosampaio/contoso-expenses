# Plan: BUG-7 $100.00 expenses must be auto-approved

Issue: #7
Status: Approved
Approved-by: @OWNER
Author-agent: Planner

## Goal
Make the auto-approve threshold inclusive so 100.00 routes to `auto` (FR-3), without changing any threshold value.

## Inputs
- Issue #7, docs/requirements.md FR-3 to FR-5, eval/cases.json
- Evaluation report showing GC-3 failing
- Decision D-003 (inclusive thresholds)

## Files in scope
- src/policy.js
- test/policy-boundaries.test.js

## Steps
1. Add test/policy-boundaries.test.js with the six boundary cases from eval/cases.json; confirm 100.00 fails.
2. Change `<` to `<=` for `AUTO_APPROVE_MAX` in src/policy.js.
3. Run `npm test`.
4. Run `npm run eval -- --plan docs/plans/BUG-7-inclusive-thresholds.md`.

## Tests
- 0.01, 99.99, 100.00 -> auto; 100.01, 1000.00 -> manager; 1000.01 -> finance

## Risks
- Compliance-sensitive file: needs code-owner review. Values in `THRESHOLDS` must not change.

## Success criteria
- `npm test` passes; eval golden cases 6/6; scope check PASS; score 100%

## Escalate to a human if
- Any threshold value seems wrong (that is a policy decision, not a bug fix)
