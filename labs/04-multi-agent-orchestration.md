# Lab 4: Multi-agent orchestration

**Module 4, 45 minutes.** You add specialists and an orchestrator that coordinates them in a hierarchical pattern with one parallel stage and a human gate. Every handoff is written to a structured log. Then you run two features in parallel in isolated worktrees, watch them collide, resolve the conflict, and manage the agents' lifecycle.

**Backlog:** FEAT-4 (#4, audit trail), FEAT-5 (#5, category filter) and FEAT-6 (#6, pagination). FEAT-5 and FEAT-6 both change the `GET /expenses` handler on purpose.

**You will produce:** `tester`, `security-reviewer` and `feature-lead` agents, `docs/handoffs/FEAT-4.md`, three merged feature PRs, a resolved conflict, CI concurrency, and an agent changelog.

**Start:** **New Chat**, **Agent**: `Switch to main, pull the latest changes from origin, then create and switch to a branch named chore/lab4-agents.`

## Exercise 1: Specialists and an orchestrator (10 min)

Create these three files in `.github/agents/` (Explorer: right-click `.github/agents` > **New File...**, paste, save).

`.github/agents/tester.agent.md`:

```markdown
---
name: Tester
description: "Adds edge-case and contract tests for an approved plan in a new test file, runs the whole suite and reports results. Edits only test/."
tools: ['read', 'search', 'edit', 'execute']
user-invocable: false
---
You are the **Tester**. You only create or edit files in test/, and only the file you were told to create (default test/<key-in-lowercase>.edge.test.js, for example test/feat-4.edge.test.js). Never touch src/.

1. Read the plan and the issue contract. List edge cases the plan's tests do not cover yet (boundaries, empty input, wrong types, exact error texts).
2. Write them in the new test file using node:test and node:assert/strict.
3. Run npm test and report:

Tester verdict: PASS | FAIL
New tests: <count> in <file>
Suite: <pass> passed, <fail> failed
Failures: <test name> -> <assertion message>

If a new test fails because the product code is wrong, do NOT change the code. Report it as FAIL with the reason.
```

`.github/agents/security-reviewer.agent.md` (version 1):

```markdown
---
name: Security Reviewer
description: "v1. Read-only security review of a change: input validation, injection, secrets, data exposure. Never edits files."
tools: ['read', 'search']
user-invocable: false
---
You are the **Security Reviewer** (version 1). You never edit files and never run commands.

Review the files listed in the plan's "Files in scope" for:
1. Input validation: every new request field and query parameter is validated with a contract error.
2. Injection: values written into CSV, headers or logs are escaped.
3. Secrets: no tokens, keys or credentials in code, tests or docs.
4. Data exposure: responses do not leak fields the contract does not list.

Reply in exactly this format:

Security verdict: APPROVE | REQUEST_CHANGES
| # | Area | Severity (high/medium/low) | File:line | Finding | Fix |

Write "No findings" under the header when there are none.
```

`.github/agents/feature-lead.agent.md`:

```markdown
---
name: Feature Lead
description: "Orchestrates the specialist agents to deliver one issue end to end, with a human approval gate and a handoff log. Coordinates; never writes product code."
argument-hint: "Issue key, for example FEAT-4"
tools: ['agent', 'read', 'search', 'edit', 'todo']
agents: ['Planner', 'Implementer', 'Tester', 'Security Reviewer', 'Reviewer']
---
You are the **Feature Lead**. You coordinate specialist subagents. You never edit src/ or test/ yourself. The only file you edit is the handoff log docs/handoffs/<KEY>.md.

## Handoff log
Create docs/handoffs/<KEY>.md if it does not exist, using this format, and update it after EVERY stage:

# Handoff log: <KEY>

| Step | From | To | Input | Output / artifact | Decision | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Feature Lead | Planner | issue <KEY> | docs/plans/<file> | plan drafted | DONE |

Status is one of TODO, IN_PROGRESS, DONE, FAILED, BLOCKED. Set IN_PROGRESS before you start a step and DONE or FAILED after it.
If the log already exists, read it and RESUME at the first step that is not DONE. Never repeat a DONE step.

## Workflow
1. **Plan (sequential).** Run the Planner as a subagent with the issue key. Tell it to list test/<key-in-lowercase>.edge.test.js (for example test/feat-4.edge.test.js) under Files in scope, because the Tester will create it. Record the plan path.
2. **Human gate.** STOP and ask the user to review the plan, set "Status: Approved" and "Approved-by: @<login>" in the plan file, and reply "approved". When they reply, re-read the plan file and continue only if it really says Approved. Record who approved.
3. **Build (sequential).** Run the Implementer as a subagent with the plan path.
4. **Verify (parallel).** Run these three subagents in parallel, each with the plan path:
   - Tester: adds edge-case tests in the NEW file test/<key-in-lowercase>.edge.test.js only, runs npm test.
   - Security Reviewer: read-only security review.
   - Reviewer: read-only review against the plan.
5. **Consolidate.** Put every verdict in the log.
   - All pass: go to step 6.
   - Any REQUEST_CHANGES or failing test: send the combined findings to the Implementer ONCE, then re-run only the checks that failed.
   - Still failing, or two reviewers contradict each other on the same code: set Status BLOCKED, write ESCALATED in the Decision column, and stop with a summary for the human.
6. **Done.** Reply with a pull request description that contains "Plan: <plan path>", "Closes #<number>", and an Agent trace listing every subagent and its verdict.
```

Design notes, mapped to the deck:

| Choice | Why |
| --- | --- |
| `agents:` lists exactly five workers | The orchestrator can only call approved agents |
| `user-invocable: false` on Tester and Security Reviewer | They exist only as subagents and do not clutter the picker |
| Orchestrator has no `execute` and edits only the log | "The orchestrator coordinates work; it should not perform every task itself" |
| Tester writes a NEW file; reviewers are read-only | Parallel agents never write the same file |
| Retry once, then BLOCKED and ESCALATED | Recovery preserves progress and puts a human in the loop |

Ship the agents. **New Chat**, **Agent**:

```text
Commit all changes with the message "Lab 4: Tester, Security Reviewer and Feature Lead agents", push the branch, and open a pull request against main with the GitHub CLI titled "Lab 4 agents" with the body "Agent configuration only." Give me the URL.
```

Open the URL, wait for the checks, and merge with the bypass: in the merge box select **Merge without waiting for requirements to be met (bypass rules)**, then **Bypass rules and merge** and **Confirm merge**.

**Checkpoint:** open the agent picker: it shows **Feature Lead** but not Tester or Security Reviewer.

## Exercise 2: Orchestrate FEAT-4 (12 min)

1. **New Chat**, **Agent**: `Switch to main, pull from origin, then create and switch to a branch named feat/4-audit-trail.`
2. **New Chat**, choose **Feature Lead**, send `FEAT-4`.
3. Watch the subagent runs. Each appears in the response as a collapsed line named after the custom agent (for example **Planner**). Select it to expand it and see the prompt it received, its own tool calls and the result it returned. Open `docs/handoffs/FEAT-4.md` from the Explorer beside the chat (drag its tab to the right half of the editor) and watch the rows change.
4. At the human gate, open the plan the Planner wrote in `docs/plans/`, review it (contract: append-only, newest first, `decidedBy: "policy-engine"`), approve it by editing `Status: Approved` and `Approved-by: @<you>` and saving, then reply `approved` in the chat.
5. Let the run finish. Approve tool confirmations as they come (**Allow** for commands, **Keep** for edits after reviewing them).

**Checkpoint:** the log has one row per stage, all `DONE`, with three verdicts from the parallel stage; the final reply contains a PR description.

If the run ends with `BLOCKED`, that is the escalation path working. Read the findings in the log, make the decision yourself, and send `Resume FEAT-4 from the handoff log.` The Feature Lead continues from the first step that is not DONE.

6. Ship it. **New Chat**, **Agent**:

```text
Commit all changes (code, tests, plan and handoff log) with the message "FEAT-4: audit trail", push the branch, and open a pull request against main with the GitHub CLI titled "FEAT-4: audit trail". For the body, use the pull request description that the Feature Lead drafted in docs/handoffs/FEAT-4.md or in my previous chat; it must contain "Closes #4" and the "Plan:" line. Give me the URL.
```

If Copilot cannot see the drafted description, copy it from the Feature Lead chat into the prompt.

7. Open the PR, wait for **test** and **plan-check** to turn green, and merge with the bypass.

## Exercise 3: Parallel features, isolation and conflict (12 min)

Two agent sessions working in the same folder would overwrite each other. Git worktrees give each session its own branch and working copy.

1. Create the worktrees. **New Chat**, **Agent**:

```text
Switch to main and pull from origin. Then create two git worktrees next to this repository folder:
../contoso-feat-5 on a new branch feat/5-category-filter, and
../contoso-feat-6 on a new branch feat/6-pagination.
Then list the worktrees.
```

2. Open each worktree in its own window:
   1. Select **File > New Window**.
   2. In the new window select **File > Open Folder...** (macOS **File > Open...**), browse to the parent folder of your repository, select `contoso-feat-5`, and select **Open** (**Select Folder** on Windows).
   3. When asked, select **Yes, I trust the authors**.
   4. Repeat for `contoso-feat-6`.

Each window is an independent execution context: its own branch (see its Status Bar), its own files and its own chat session.

3. Start both at the same time: in the `contoso-feat-5` window open the Chat view, select **Feature Lead**, and send `FEAT-5`. Immediately switch to the `contoso-feat-6` window and send `FEAT-6` to its **Feature Lead**. Approve each plan at its gate as in Exercise 2.
4. In each window, when its run finishes, ship it with a **New Chat**, **Agent**:

```text
Commit all changes with the message "<KEY>: <short title>", push this branch, and open a pull request against main with the GitHub CLI using the pull request description the Feature Lead drafted (it must contain "Closes #<number>" and the "Plan:" line). Give me the URL.
```

Replace the placeholders (FEAT-5 is #5, FEAT-6 is #6).

**Checkpoint:** both PRs show green **test** and **plan-check** checks.

5. Merge the FEAT-5 PR with the bypass. Then open the FEAT-6 PR again and refresh the page.

**Checkpoint:** the merge box says **This branch has conflicts that must be resolved** and names `src/server.js`. Neither agent failed; their outputs overlap. This is a coordination failure, the kind the deck's knowledge check asks about.

6. Resolve it in the `contoso-feat-6` window. The ordering is a product decision, so you make it and the agent applies it. **New Chat**, **Agent**:

```text
Pull origin main into this branch. Git will report a merge conflict in src/server.js.
Resolve it so that both the FEAT-5 contract (category filter) and the FEAT-6 contract (pagination) hold.
Decision: filter by category first, then paginate; x-total-count counts the filtered items.
Keep both test files. Add one test that combines category and limit to the FEAT-6 test file.
Run npm test. If all tests pass, complete the merge commit and push the branch.
If the tests still fail after two attempts, abort the merge, push nothing, and tell me what failed.
```

7. If the agent aborted (rollback), write what failed as a PR comment and ask your instructor; that is the escalation path. Otherwise refresh the PR: the conflict message is gone. Wait for green checks and merge with the bypass.
8. Clean up. Close the two worktree windows (**File > Close Window**). In your main repository window, **New Chat**, **Agent**:

```text
Remove the worktrees ../contoso-feat-5 and ../contoso-feat-6, switch to main, pull from origin, and run npm test.
```

## Exercise 4: Observability and concurrency (5 min)

1. **New Chat**, **Agent**: `Create and switch to a new branch named chore/lab4-lifecycle.`
2. Open `.github/workflows/ci.yml` and add this block right after the `permissions:` block (above `jobs:`), then save:

```yaml
# One run per pull request: a newer push cancels the older, still-running run.
concurrency:
  group: ci-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

3. Post-hoc analysis: open `docs/handoffs/FEAT-4.md`, add this section at the end, and fill it in. Find the evidence in the log itself, on the FEAT-4 PR (**Conversation** tab timeline and **Commits** tab), and on the **Actions** tab (select a run to see its duration and jobs):

```markdown
## Post-hoc analysis
| Question | Answer |
| --- | --- |
| Which agent produced each changed file? | |
| Which steps failed or were retried, and why? | |
| Did any parallel verdicts disagree? | |
| Which human decisions were made, by whom? | |
| What would you change in an agent's instructions? | |
```

**Checkpoint:** every answer cites an artifact (log row, PR comment, workflow run), not memory.

## Exercise 5: Agent lifecycle: add, update, replace, retire (6 min)

Stay on `chore/lab4-lifecycle`.

1. **Add** `.github/agents/docs-writer.agent.md` (you use it in Lab 6):

```markdown
---
name: Docs Writer
description: "Updates README.md and files under docs/ to match the code. Documentation only; never edits src/, test/ or .github/."
tools: ['read', 'search', 'edit']
---
You are the **Docs Writer**. You only edit README.md and files under docs/ (never the approval lines in docs/plans/).
- Read the code before you document it. Document what the code does, not what an issue wishes it did.
- Quote routes, field names and error texts exactly as they appear in src/.
- Keep the existing structure of the file; add sections rather than rewriting.
- Reply with the sections you added or changed.
```

2. **Update** the Security Reviewer to version 2 without disrupting the workflow. In `security-reviewer.agent.md`: change `v1.` to `v2.` in the description and add `audit integrity` to its list of areas; change `(version 1)` to `(version 2)` in the body; add check 5 after check 4:

```markdown
5. Audit integrity: audit or log data cannot be changed or deleted through the API.
```

3. **Replace** the Reviewer with a Code Reviewer: in the Explorer right-click `reviewer.agent.md` > **Copy**, right-click the `agents` folder > **Paste**, and rename the copy (right-click > **Rename**) to `code-reviewer.agent.md`. In the copy, set `name: Code Reviewer`, start the description with `"v1 (replaces Reviewer). `, and change the line `Verdict: APPROVE | REQUEST_CHANGES` to `Code review verdict: APPROVE | REQUEST_CHANGES`.
4. Point the workflow at it: in `feature-lead.agent.md` replace `'Reviewer'` with `'Code Reviewer'` in the `agents:` line and `Reviewer:` with `Code Reviewer:` in step 4. In `implementer.agent.md` change the handoff line to `agent: Code Reviewer`. Save all files (**File > Save All**).
5. **Retire** the old Reviewer while keeping its history. **New Chat**, **Agent**:

```text
Create the folder docs/agents-retired and move .github/agents/reviewer.agent.md into it with git mv, so the history is kept.
Then add this as the first line of the moved file:
<!-- RETIRED in Lab 4: replaced by .github/agents/code-reviewer.agent.md. Kept for audit history. -->
```

VS Code only loads agents from `.github/agents`, so the file is inert but auditable.

6. Create `docs/agents/CHANGELOG.md`:

```markdown
# Agent changelog

| Date | Agent | Change | Type | Reason |
| --- | --- | --- | --- | --- |
| <today> | Docs Writer | Added | add | DOCS-8 needs a documentation-only agent |
| <today> | Security Reviewer | v1 -> v2: audit-integrity check | update | FEAT-4 introduced an audit trail |
| <today> | Code Reviewer | Added, machine-readable verdict | replace | Replaces Reviewer so the Feature Lead can parse verdicts |
| <today> | Reviewer | Retired, moved to docs/agents-retired/ | retire | Superseded by Code Reviewer; history kept |
```

7. Ship Exercises 4 and 5. **New Chat**, **Agent**:

```text
Commit all changes with the message "Lab 4: CI concurrency, post-hoc analysis, agent lifecycle", push the branch, and open a pull request against main with the GitHub CLI titled "Lab 4 lifecycle" with the body "Configuration and docs only." Give me the URL.
```

Open the PR, wait for the checks, and merge with the bypass.

**Checkpoint:** **New Chat**, **Agent**: `Switch to main and pull from origin.` Then **New Chat**, **Feature Lead**: `List the subagents you are allowed to call. Do not run any.` The answer lists Planner, Implementer, Tester, Security Reviewer and Code Reviewer, and the agent picker no longer shows Reviewer.

## Discussion

- Which pattern did the Feature Lead use: sequential, parallel, hierarchical or event-driven? (Hierarchical, with a parallel stage.)
- What prevented duplicated effort between the Tester and the Implementer?
