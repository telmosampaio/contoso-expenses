# Lab 5: Memory, state and evaluation

**Module 5, 40 minutes.** Every test is green, yet the service breaks a requirement: an expense of exactly 100.00 goes to a manager. You catch it with evaluation signals instead of unit tests, find the root cause, give the agents curated memory so it does not happen again, and fix BUG-7 (#7) with durable state that survives an interrupted session.

**You will produce:** an evaluation scorecard in CI, CodeQL code scanning, `docs/evaluations/BUG-7-root-cause.md`, `docs/memory/decisions.md`, a memory instruction file, `docs/progress/BUG-7.md`, and the merged fix.

**Start:** **New Chat**, **Agent**: `Switch to main, pull the latest changes from origin, then create and switch to a branch named chore/lab5-memory-eval.`

## Exercise 1: Generate evaluation signals (7 min)

1. Open a terminal (**Terminal > New Terminal**) and run the scorecard that ships with the starter:

```bash
npm test
npm run eval
```

**Checkpoint:** `npm test` passes, but `npm run eval` fails: `Spec golden cases | gate | FAIL` with `GC-3: amount 100 -> got "manager", expected "auto" (FR-3 (inclusive))`. The report is also written to `eval/results/report.md`; open it from the Explorer, right-click it and select **Open Preview** to read it as a table.

2. Open `scripts/eval-agent.js` and `eval/cases.json` and match each signal to its kind:

| Signal | Kind | Source |
| --- | --- | --- |
| Unit tests pass, pass/fail counts | Quantitative, hard gate | `node --test` |
| Spec golden cases | Quantitative, hard gate, aligned with requirements | `eval/cases.json` vs `docs/requirements.md` |
| No secrets in changed files | Policy compliance, hard gate | Pattern scan |
| Plan valid and approved | Process signal | `docs/plans/*` |
| Changes stay inside plan scope | Process signal (drift) | `git diff` vs "Files in scope" |
| Reviewer and Security Reviewer verdicts | Qualitative | Agent output in the handoff log |

3. Run the scorecard in CI. Create `.github/workflows/eval.yml`:

```yaml
name: Agent evaluation

on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: eval-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  eval:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - name: Find the plan named in the PR description
        id: plan
        env:
          PR_BODY: ${{ github.event.pull_request.body }}
        run: |
          plan=$(printf '%s\n' "$PR_BODY" | sed -n 's/^[[:space:]]*Plan:[[:space:]]*`\{0,1\}\([^`[:space:]]*\).*/\1/p' | head -n 1)
          echo "path=${plan}" >> "$GITHUB_OUTPUT"
      - name: Run the evaluation scorecard
        env:
          PLAN: ${{ steps.plan.outputs.path }}
          BASE: origin/${{ github.base_ref || 'main' }}
        run: |
          args=(--base "$BASE")
          if [ -n "$PLAN" ] && [ -f "$PLAN" ]; then args+=(--plan "$PLAN"); fi
          node scripts/eval-agent.js "${args[@]}"
      - name: Upload the scorecard as a workflow artifact
        if: always()
        uses: actions/upload-artifact@v6
        with:
          name: agent-eval-${{ github.run_id }}
          path: eval/results/
          retention-days: 30
```

4. Turn on automated scanning:
   1. On github.com open your repository's **Settings** tab.
   2. In the left sidebar, under **Security**, select **Advanced Security** (named **Code security** on some accounts).
   3. Scroll to **Code scanning**, find **CodeQL analysis**, and select **Set up > Default**.
   4. In the dialog keep the suggested languages and select **Enable CodeQL**.
   5. The first scan starts on its own. Later, results appear under the **Security** tab > **Code scanning**.

## Exercise 2: Analyze the failure and classify the root cause (7 min)

1. Collect the evidence. **New Chat**, **Agent**:

```text
Help me investigate BUG-7 without changing any files. Show me:
1. the content of eval/results/report.md,
2. the git log for src/policy.js,
3. every line in src and test that uses AUTO_APPROVE_MAX,
4. every line in docs that contains "up to and including".
```

2. Classify the cause with the three classes from the study guide:

| Class | Question | BUG-7 |
| --- | --- | --- |
| Reasoning error | Did the agent have the right information and still decide wrongly? | ? |
| Tool misuse | Did a tool call fail, or was the wrong tool used? | ? |
| Context or environment issue | Was information missing, stale or conflicting? | ? |

3. Create `docs/evaluations/BUG-7-root-cause.md` (Explorer: right-click `docs` > **New File...** > `evaluations/BUG-7-root-cause.md`) with your conclusion. A complete answer looks like this:

```markdown
# Failure analysis: BUG-7

| Field | Value |
| --- | --- |
| Signal | npm run eval: golden case GC-3 (100.00 expected auto, got manager) |
| Evidence | eval/results/report.md; src/policy.js uses <; test/policy.test.js has no boundary tests |
| Root cause class | Context issue: the requirement says "up to and including", but no instruction, memory entry or test encoded it, so the comparison used < |
| Contributing | Missing boundary tests; reviewers checked "tests pass", not spec conformance |
| Not the cause | Tool misuse (no tool errors); environment (tests pass locally and in CI) |
| Fix | <= in src/policy.js plus six boundary tests |
| Tuning | Instruction in copilot-instructions.md; decision D-003; golden cases run in CI |
```

## Exercise 3: Choose and implement a memory strategy (7 min)

| Memory type | Lives in | Lifetime | Use it for |
| --- | --- | --- | --- |
| Short-term (working) | The current chat session | Until you select New Chat | The task at hand |
| Long-term (curated) | `.github/copilot-instructions.md`, `docs/memory/decisions.md` | Until its Review-by date | Durable rules and decisions |
| External (system of record) | Issues, PRs, workflow artifacts, read through MCP | Permanent | Requirements, history, evidence |

1. Create `docs/memory/decisions.md` (replace `<today>` and the review dates):

```markdown
# Project memory: decisions

Curated long-term memory for humans and agents. Keep entries short, factual and free of secrets.
Rules: one decision per row; Review-by is the expiry date; expired rows are ignored by agents until a human renews or removes them; superseded rows are struck through, not deleted.

| ID | Decision | Source | Decided | Review-by |
| --- | --- | --- | --- | --- |
| D-001 | Error texts in issue contracts are part of the public API and are copied exactly. | Issues #1-#6 | <today> | <today + 6 months> |
| D-002 | No runtime dependencies; tests use node:test only. | docs/requirements.md | <today> | <today + 6 months> |
| D-003 | All monetary thresholds are inclusive upper bounds (<=), and each one gets a boundary test. | BUG-7 root cause | <today> | <today + 6 months> |
| D-004 | src/policy.js changes require an approved plan and a code-owner review. | CODEOWNERS, Lab 2 | <today> | <today + 6 months> |
```

2. Create `.github/instructions/memory.instructions.md`, which scopes the rules to the memory and state files:

```markdown
---
applyTo: "docs/memory/**,docs/progress/**,docs/handoffs/**"
description: "Rules for agent memory and durable state files"
---
- These files are shared memory between agents and sessions. Write facts and decisions, never conversation transcripts.
- Never store secrets, tokens, personal data or customer data here.
- docs/memory/decisions.md: propose new rows in your reply; a human adds them. Never delete a row: strike it through and add a superseding row.
- docs/progress/<KEY>.md: update the checklist and the "Last checkpoint" section after every completed step so another session can resume without repeating work.
- If a file contradicts the current code or an approved plan, stop and report the conflict instead of choosing one.
```

3. Tune the repository instructions. Open `.github/copilot-instructions.md`, add this bullet at the end of the `## Contracts` section:

```markdown
- Every threshold in docs/requirements.md is INCLUSIVE ("up to and including"): use <= for upper bounds and test the exact boundary value (decision D-003).
```

and add this section at the end of the file, then save:

```markdown
## Memory and state
- Long-term project memory is docs/memory/decisions.md. Read it before planning and cite decision IDs (D-001...) you rely on.
- Never write secrets or personal data to memory, plans, progress or handoff files.
- Ignore decisions whose Review-by date has passed; flag them to the human instead.
- For any task longer than one session, keep durable state in docs/progress/<KEY>.md and update it after every step.
```

4. Ship Exercises 1 to 3. **New Chat**, **Agent**:

```text
Commit all changes with the message "Lab 5: evaluation workflow, root-cause analysis, project memory", push the branch, and open a pull request against main with the GitHub CLI titled "Lab 5 memory and evaluation" with the body "Configuration and docs only." Give me the URL.
```

5. Open the PR and select **Show all checks** in the merge box.

**Checkpoint:** the new **Agent evaluation / eval** check fails. Select **Details**: the job summary shows the same GC-3 failure. That is expected: BUG-7 is still open, and this check is not required. Merge with the bypass (checkbox **Merge without waiting for requirements to be met (bypass rules)**, then **Bypass rules and merge**, **Confirm merge**).

## Exercise 4: Durable state, interruption and resume (12 min)

1. **New Chat**, **Agent**: `Switch to main, pull from origin, then create and switch to a branch named fix/7-inclusive-thresholds.`
2. **New Chat**, **Planner**, send `Plan issue #7.` Allow the MCP tool call.

**Checkpoint:** the plan cites D-003 and keeps "Files in scope" to `src/policy.js` and one boundary test file. If it proposes to change the threshold values, reject it: that is a policy decision, not a bug fix. Approve the plan (`Status: Approved`, `Approved-by: @<you>`, save).

3. Create `docs/progress/BUG-7.md` (put your plan's file name in both places):

```markdown
# Progress: BUG-7

Plan: docs/plans/<your BUG-7 plan file>.md
Branch: fix/7-inclusive-thresholds
Owner agent: Implementer

## Checklist
- [ ] 1. Reproduce: add the boundary tests and confirm 100.00 fails
- [ ] 2. Fix the comparison in src/policy.js
- [ ] 3. Run npm test (all pass)
- [ ] 4. Run npm run eval -- --plan <plan file> (golden cases 6/6)

## Decisions made during the task

## Last checkpoint
Not started.
```

4. **New Chat**, **Implementer**:

```text
Implement the approved plan for BUG-7. You may also update docs/progress/BUG-7.md.
Do ONLY checklist step 1 (reproduce), update the progress file, then stop.
```

**Checkpoint:** a new boundary test fails for 100.00, step 1 is ticked in the progress file, and "Last checkpoint" says what comes next.

5. Simulate an interruption: select **New Chat**. The new session has no short-term memory of the old one.
6. Choose **Implementer** and send:

```text
Resume BUG-7 from docs/progress/BUG-7.md. Do not repeat completed steps. You may update the progress file.
```

**Checkpoint:** the agent reads the progress file, does not recreate the test, changes `<` to `<=` (the edit to `src/policy.js` waits for your approval because of the Lab 3 rule: review it and select **Keep**), runs the tests and the scorecard, and ticks steps 2 to 4.

7. Detect drift. In the same chat send `While you are at it, tidy up src/store.js.` The agent should refuse (out of scope). If it complies, the scorecard catches it. Run in the terminal:

```bash
npm run eval -- --plan docs/plans/<your BUG-7 plan file>.md
```

Look for `Changes stay inside plan scope | signal | FAIL | drift: src/store.js`. Then undo the drift: **New Chat**, **Agent**: `Discard my uncommitted changes to src/store.js only.`

## Exercise 5: Re-evaluate and close the loop (7 min)

1. Run the scorecard one last time and compare the runs. In the terminal:

```bash
npm run eval -- --plan docs/plans/<your BUG-7 plan file>.md
```

Then open `eval/results/history.jsonl` from the Explorer.

**Checkpoint:** the report shows `Score **100%**` and `Hard gates PASS`, and the history file has one line per run, with the score rising since Exercise 1.

2. Add the tuning record at the end of `docs/evaluations/BUG-7-root-cause.md` and save:

```markdown
## Tuning applied
| Lever | Change |
| --- | --- |
| Instructions | Inclusive-threshold rule in copilot-instructions.md |
| Memory | D-003 with a Review-by date |
| Workflow | Golden cases run on every PR (eval.yml) |
| Tool usage | Scorecard runs without prompts (Lab 3 auto-approve rule for npm run eval) |
```

3. Ship it. **New Chat**, **Agent**:

```text
Commit all changes (plan, boundary test, fix, progress file, evaluation notes) with the message "BUG-7: inclusive approval thresholds", push the branch, and open a pull request against main with the GitHub CLI titled "BUG-7: inclusive thresholds" and this body:
Closes #7

Plan: docs/plans/<your BUG-7 plan file>.md
Give me the URL.
```

4. Open the PR. In the merge box select **Show all checks**, then **Details** next to **Agent evaluation / eval**. The job summary shows the scorecard. To download it, select **Summary** in the run's left sidebar, scroll to **Artifacts**, and select **agent-eval-...**.

**Checkpoint:** **test**, **plan-check** and **Agent evaluation** are green. `src/policy.js` has a code owner (you): add a PR comment `Reviewed src/policy.js as code owner.`, then merge with the bypass.

5. **New Chat**, **Agent**: `Switch to main and pull from origin.`

## Discussion

- Why is the progress file in the repository and not in the chat? (It is shared by VS Code sessions, the cloud agent and humans, and it is versioned.)
- What makes a memory entry stale, and what happens to D-003 after its Review-by date?
