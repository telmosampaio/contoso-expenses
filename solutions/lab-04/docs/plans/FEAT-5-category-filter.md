# Plan: FEAT-5

Issue: #5
Status: Approved
Approved-by: @OWNER
Author-agent: Planner

## Goal
Support `GET /expenses?category=<name>` with the exact contract error for unknown categories.

## Inputs
- Issue #5 contract
- src/server.js

## Files in scope
- src/server.js
- test/filter.test.js
- test/helpers.js

## Steps
1. Implement the contract in the files in scope.
2. Add tests for every contract rule and boundary.
3. Run `npm test`.

## Tests
- One test per contract bullet, including the exact error text

## Risks
- FEAT-5 and FEAT-6 both change the `GET /expenses` handler: expect a merge conflict if they run in parallel.

## Success criteria
- `npm test` passes
- plan-check passes on the pull request

## Escalate to a human if
- Another open pull request changes the same handler
