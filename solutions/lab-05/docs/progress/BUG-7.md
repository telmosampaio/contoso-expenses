# Progress: BUG-7

Plan: docs/plans/BUG-7-inclusive-thresholds.md
Branch: fix/7-inclusive-thresholds
Owner agent: Implementer

## Checklist
- [x] 1. Reproduce: add test/policy-boundaries.test.js and confirm 100.00 fails
- [x] 2. Fix the comparison in src/policy.js (`<` -> `<=`)
- [x] 3. Run `npm test` (all pass)
- [x] 4. Run `npm run eval -- --plan docs/plans/BUG-7-inclusive-thresholds.md` (golden cases 6/6)

## Decisions made during the task
- Kept `THRESHOLDS` values unchanged; only the comparison changed (D-003, D-004).

## Last checkpoint
Step 4 done. Next: human opens the pull request.
