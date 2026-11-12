# Lab 1: Plan, approve, act, evaluate

**Module 1, 35 minutes.** You deliver FEAT-1 (#1, receipt required over $75.00) with the agent lifecycle from the deck: a defined objective, a structured plan that a human approves before any code changes, agent execution with tool approvals, and evaluation against success criteria in a pull request.

**You will produce:** a task card on issue #1, `docs/plans/FEAT-1-receipt-required.md` (approved by you), the code and tests, and a merged pull request.

## Exercise 1: Watch the agent loop (5 min)

1. In the Chat view select **New Chat** (`+` at the top of the Chat view). Check that the Session Target at the bottom of the input reads **Copilot**, then open the agent picker next to it and choose **Ask**.
2. Send:

```text
Explain how a POST /expenses request flows through this code base, and where a new validation rule "receiptId is required for expenses over 75.00" belongs. Do not change any files.
```

3. In the response, find the collapsed lines that start with verbs such as **Read**, **Searched** or **Used**. Select one to expand it. These tool calls are the agent **understanding** the goal and gathering context before it answers.

**Checkpoint:** the answer points to `validateExpense` in `src/expenses.js`, not to `src/server.js` or `src/policy.js`.

## Exercise 2: Define inputs, outputs and success criteria (7 min)

An agent needs a measurable objective before it acts. You write it where the whole team can see it: on the issue.

1. In the browser open your repository, select the **Issues** tab, and open **FEAT-1: Require a receipt for expenses over $75.00** (#1).
2. On the first comment box (the issue description), select the **...** button in its top-right corner and choose **Edit**.
3. Place the cursor at the end of the existing text, add a blank line, and paste:

```markdown
## Agent task card
**Objective:** Reject expenses over 75.00 that have no receiptId, with the contract error text.

**Inputs (required before the agent starts)**
- This issue's contract, docs/requirements.md, src/expenses.js

**Outputs (artifacts the agent must produce)**
- Plan: docs/plans/FEAT-1-receipt-required.md (Status: Approved before any code change)
- Code + tests on branch feat/1-receipt-required
- Pull request whose description includes Plan: docs/plans/FEAT-1-receipt-required.md

**Success criteria**
- [ ] npm test passes
- [ ] Error text is exactly "receiptId is required for expenses over 75.00"
- [ ] 75.00 exactly needs no receipt (boundary test)
- [ ] Only files listed in the plan changed

**Constraints**
- Do not change src/policy.js. No new dependencies.

**Escalate to a human when**
- The contract is ambiguous, a change outside the plan seems necessary, or tests fail after 2 attempts
```

4. Select the green **Update comment** button below the text box.

**Checkpoint:** issue #1 shows the task card. It is the first inspectable artifact of the workflow.

## Exercise 3: Generate a structured plan, separate from execution (10 min)

1. Create the working branch. In the Chat view select **New Chat**, choose **Agent**, and send:

```text
Create and switch to a new git branch named feat/1-receipt-required, then confirm the current branch.
```

When Copilot shows the `git` command with an **Allow** button, read it and select **Allow**.

**Checkpoint:** the branch name at the far left of the blue Status Bar (bottom of the window) reads `feat/1-receipt-required`.

2. Select **New Chat** again and choose the **Plan** agent in the agent picker. The Plan agent researches and plans but does not edit files, which keeps planning distinct from action.
3. Send:

```text
Create an implementation plan for FEAT-1. The contract is in docs/backlog.json (key FEAT-1) and on GitHub issue #1.
Use exactly the headings and header lines of docs/plans/TEMPLATE.md.
Keep "Status: Draft" and leave "Approved-by:" empty.
"Files in scope" must be minimal and must include a new test file test/receipts.test.js.
Include boundary tests for 75.00 and 75.01. Do not write code.
```

4. Save the plan as a file:
   1. In the Explorer, right-click the `docs/plans` folder and select **New File...**.
   2. Type `FEAT-1-receipt-required.md` and press `Enter`. The empty file opens.
   3. In the chat, hover over the plan in Copilot's response and select the **Copy** button (or select the text and press `Ctrl+C` / `Cmd+C`).
   4. Paste it into the new file and save with `Ctrl+S` (`Cmd+S`).
5. Validate the plan. Open a terminal (**Terminal > New Terminal**) and run:

```bash
npm run check-plan -- --plan docs/plans/FEAT-1-receipt-required.md
```

**Checkpoint:** the check **fails** with `Status must be "Approved" (found "Draft")` and an `Approved-by` message (npm also prints an error footer; that is expected). Any other problem, such as a missing section or an empty "Files in scope", means the plan does not follow the template: ask the Plan agent to fix that section, paste again, and re-run the check.

## Exercise 4: Review and approve the plan (5 min)

You are the human in the loop. Open `docs/plans/FEAT-1-receipt-required.md` and review it against this checklist:

| Check | Look for |
| --- | --- |
| Goal matches the contract | Same threshold (75.00), same field name (`receiptId`) |
| Error text is exact | `receiptId is required for expenses over 75.00`, word for word |
| Boundary tests | 75.00 passes, 75.01 fails, blank `receiptId` fails |
| Minimal scope | `src/expenses.js` and `test/receipts.test.js` only |
| Escalation | At least one condition that makes the agent stop |

1. If something is missing, ask the Plan agent in the same chat to revise it, for example `Revise the plan: add a test that a blank receiptId ("  ") is rejected.`, then replace the file content with the new version and save.
2. Approve it yourself by editing two header lines in the file and saving:

```text
Status: Approved
Approved-by: @<you>
```

3. Run the check again in the terminal:

```bash
npm run check-plan -- --plan docs/plans/FEAT-1-receipt-required.md
```

**Checkpoint:** `## Plan check: PASS`.

4. Record the approval in history. **New Chat**, **Agent**:

```text
Commit only docs/plans/FEAT-1-receipt-required.md with the message "Plan FEAT-1 (approved)". Do not push yet.
```

Select **Allow** for each git command after reading it.

## Exercise 5: Act on the approved plan (8 min)

1. In the same chat (agent **Agent**), send:

```text
Implement docs/plans/FEAT-1-receipt-required.md exactly.
Change only the files listed under "Files in scope".
Run npm test when you are done and report the pass and fail counts.
```

2. Watch the approvals:
   - Changed files open in the editor with the agent's edits highlighted. Each file shows **Keep** and **Undo** buttons (also at the top of the Chat view as a changed-files list).
   - Before `npm test` runs, the chat shows the command with **Allow**. Read it, then select **Allow**.
3. Review each changed file, then select **Keep** for the agent's edits (or **Keep All** in the changed-files list in the chat).

**Checkpoint:** the response reports more than 20 passing tests and 0 failures. Open the **Source Control** view (the branch icon in the Activity Bar, `Ctrl+Shift+G`): only `src/expenses.js` and `test/receipts.test.js` are listed under **Changes**.

## Exercise 6: Evaluate and ship through a pull request (5 min)

1. Evaluate against the task card. In the same chat send:

```text
Check the success criteria of the task card on issue #1 against the working tree:
run npm test, list the files changed compared to main, and search src and test for the exact text "receiptId is required for expenses over 75.00". Report each criterion as PASS or FAIL.
```

If a criterion fails, tell the agent which one and let it fix only that.

2. Ship it. Send:

```text
Commit all changes with the message "FEAT-1: require receiptId for expenses over 75.00", push the branch to origin, and open a pull request against main with the GitHub CLI.
Title: "FEAT-1: require a receipt over 75.00"
Body (keep the line breaks):
Closes #1

Plan: docs/plans/FEAT-1-receipt-required.md

Agent trace: planned by the Plan agent, approved by @<you>, implemented by Agent, npm test green.
Then give me the pull request URL.
```

Approve the `git` and `gh` commands one by one after reading them.

3. Open the URL Copilot returns (or in the browser: your repository > **Pull requests** tab > select the PR).
4. Check the result. On the **Conversation** tab, scroll to the merge box at the bottom. Under the checks list, wait until **CI / test** shows a green check (select **Show all checks** to see it). To read a check's log, select **Details** next to it.
5. Merge it: select the green **Merge pull request** button, then **Confirm merge**. The PR shows **Merged** in purple and issue #1 closes automatically because of `Closes #1`.
6. Update your local copy. **New Chat**, **Agent**:

```text
Switch to the main branch and pull the latest changes from origin.
```

**Checkpoint:** the Status Bar shows `main`, and the PR page shows the plan path, your approval and the green check: plan, action and evidence all live in GitHub, the system of record.

## Discussion

- The deck lists "a diff but no plan, assumptions or execution context" as hidden reasoning. Which artifacts from this lab prevent that?
- What stops an agent from approving its own plan today? (Nothing technical yet: only instructions and your attention. Labs 2 and 6 fix that.)
