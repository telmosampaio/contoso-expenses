# Plan: FEAT-4

Issue: #4
Status: Approved
Approved-by: @OWNER
Author-agent: Planner

## Goal
Record every approval routing decision in an append-only audit log and expose it at `GET /audit`, newest first.

## Inputs
- Issue #4 contract
- src/server.js

## Files in scope
- src/audit.js
- src/server.js
- test/audit.test.js
- test/helpers.js
- test/feat-4.edge.test.js

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
