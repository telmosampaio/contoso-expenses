# Contoso Expense Service: requirements

The service accepts employee expense claims, validates them and routes each one to the right approver.

## Functional requirements

| ID | Requirement |
| --- | --- |
| FR-1 | An expense has `employee`, `amount` (USD, positive, at most 2 decimals), `category` and `date` (ISO, not in the future). `description` is optional (max 200 characters). |
| FR-2 | Allowed categories: `travel`, `meals`, `lodging`, `supplies`, `software`. |
| FR-3 | Expenses **up to and including** 100.00 are auto-approved (`route: auto`, `status: approved`). |
| FR-4 | Expenses above 100.00 and **up to and including** 1000.00 need a manager (`route: manager`, `status: pending_approval`). |
| FR-5 | Expenses above 1000.00 need finance (`route: finance`, `status: pending_approval`). |
| FR-6 | Invalid requests return `400` with `{ "errors": [ ... ] }` listing every problem. |

New requirements arrive as GitHub issues created from `docs/backlog.json` (FEAT-1 to DOCS-8). Each issue carries its own contract: field names, routes and exact error texts. Agents must follow the contract word for word.

## Non-functional requirements

- Node.js 22 or later, no runtime dependencies.
- Every behavior change ships with tests (`npm test`).
- `src/policy.js` is compliance-sensitive: changes need an approved plan and a code-owner review.
