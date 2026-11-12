# Contoso Expense Service: instructions for Copilot

## Project
Node.js 22+, CommonJS, 'use strict', no dependencies. Tests use node:test and run with npm test.
Read docs/architecture.md and docs/requirements.md before changing code.

## Plan before you act
- Every code change starts from a plan in docs/plans/<KEY>-<slug>.md, copied from docs/plans/TEMPLATE.md.
- Do not edit src/ or test/ until the plan says "Status: Approved" and "Approved-by: @<human>". Only a human writes those two lines.
- Change only files listed under "## Files in scope". If another file must change, stop and ask.

## Contracts
- Field names, routes and error texts in issue contracts are exact. Copy them; never paraphrase.
- src/policy.js thresholds are compliance-sensitive. Never change them unless the approved plan says so.

## Pull requests
- Branch names: feat/<issue-number>-<slug> or fix/<issue-number>-<slug>.
- The PR description must contain "Plan: docs/plans/<file>.md" and "Closes #<number>".
- Fill in the "Agent trace" section of the PR template.