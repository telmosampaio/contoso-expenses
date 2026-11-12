## Agent task card

**Objective:** <the outcome, one sentence>

**Inputs (required before the agent starts)**
- Issue contract (this issue)
- docs/requirements.md
- <files the agent must read>

**Outputs (artifacts the agent must produce)**
- Plan: `docs/plans/<KEY>-<slug>.md` (Status: Approved before any code change)
- Code + tests on branch `feat/<number>-<slug>`
- Pull request whose description includes `Plan: docs/plans/<file>.md`

**Success criteria**
- [ ] `npm test` passes
- [ ] Contract error texts match exactly
- [ ] Only files listed in the plan changed

**Constraints**
- Do not change `src/policy.js` thresholds
- No new dependencies

**Escalate to a human when**
- The contract is ambiguous
- A change outside the plan's scope seems necessary
- Tests still fail after 2 attempts
