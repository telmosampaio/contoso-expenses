# Lab 2: Agent architecture and SDLC integration

**Module 2, 40 minutes.** Lab 1 relied on you remembering every rule. Now you turn the rules into architecture: repository instructions, three specialized custom agents with distinct responsibilities, a plan gate that runs as a required status check, and code owners plus a ruleset on `main`. You deliver FEAT-2 (#2, meal justification) through the new pipeline.

**You will produce:** `.github/copilot-instructions.md`, `.github/instructions/tests.instructions.md`, three files in `.github/agents/`, `.github/workflows/plan-check.yml`, `.github/CODEOWNERS`, a `protect-main` ruleset and a merged FEAT-2 pull request.

**Start:** the Status Bar shows `main` and you pulled the latest changes at the end of Lab 1. Exercises 1 to 3 commit configuration straight to `main`; that is allowed only because the ruleset does not exist yet (Exercise 5).

**Creating files in this lab:** in the Explorer, right-click the parent folder and select **New File...** (or **New Folder...** for a folder), type the name, press `Enter`, paste the content, and save with `Ctrl+S` (`Cmd+S`). To create a file inside a folder that does not exist yet, type the whole path in the **New File...** box, for example `.github/agents/planner.agent.md`; VS Code creates the folders for you.

## Exercise 1: Repository and path-specific instructions (6 min)

1. Create `.github/copilot-instructions.md`:

```markdown
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
```

2. Create `.github/instructions/tests.instructions.md`. The `applyTo` glob makes it apply only when the agent works on test files:

```markdown
---
applyTo: "test/**"
description: "Conventions for test files in the Contoso Expense Service"
---
- Use node:test and node:assert/strict only. No test frameworks.
- One test file per issue: test/<feature>.test.js. Prefix each test name with the issue key, for example 'FEAT-2: ...'.
- Always test boundaries: the threshold itself, one cent above and one cent below.
- Pass a fixed today (new Date('2026-06-15T12:00:00Z')) to validateExpense. Never depend on the real clock.
```

3. In a **New Chat** with the **Ask** agent, send `What must happen before you are allowed to edit src/?`. Under the answer, select **Used n references** (the collapsed line at the top of the response) to expand the list.

**Checkpoint:** the answer describes the approved-plan rule and the references list `.github/copilot-instructions.md`.

## Exercise 2: Three agents, three responsibilities (12 min)

One agent that does everything is the first anti-pattern in the deck. You split planning, implementation and review, and give each agent only the tools its job needs.

Create the three files below in `.github/agents/`. (Alternative: Command Palette > **Chat: New Custom Agent**, choose the workspace `.github/agents` location, give the name, and replace the generated content.)

`.github/agents/planner.agent.md`:

```markdown
---
name: Planner
description: "Turns a GitHub issue into a structured, reviewable plan in docs/plans/. Never writes code."
argument-hint: "Issue key or number, for example FEAT-2 or #2"
tools: ['read', 'search', 'edit', 'todo']
handoffs:
  - label: Implement approved plan
    agent: Implementer
    prompt: The plan above is now approved. Implement it exactly, following its steps and file scope.
    send: false
---
You are the **Planner** for the Contoso Expense Service. You plan; you never implement.

## Your job
1. Read the issue contract (the user pastes it, or find it by key in docs/backlog.json), docs/requirements.md, docs/architecture.md and the code the change touches.
2. Write exactly ONE file: docs/plans/<KEY>-<slug>.md, copied from docs/plans/TEMPLATE.md, with every section filled in.
3. Set "Status: Draft" and leave "Approved-by:" empty. Only a human approves a plan.
4. Reply with: the plan path, the goal, the files in scope, and any open questions.

## Rules
- Never create or edit files outside docs/plans/. Never run commands.
- "Files in scope" lists every file that may change, including new test files. Keep it minimal.
- Steps are numbered, small and checkable. Tests always include boundary values.
- If the contract is ambiguous, write the question under "Escalate to a human if" instead of guessing.
```

`.github/agents/implementer.agent.md`:

```markdown
---
name: Implementer
description: "Implements an APPROVED plan from docs/plans/ inside its file scope, then runs the tests."
argument-hint: "Path to an approved plan, for example docs/plans/FEAT-2-meal-justification.md"
tools: ['read', 'search', 'edit', 'execute', 'todo']
handoffs:
  - label: Review the change
    agent: Reviewer
    prompt: Review the uncommitted changes against the approved plan named above.
    send: false
---
You are the **Implementer** for the Contoso Expense Service.

## Gate: check before you change anything
1. Open the plan file you were given. If it does not exist, or "Status:" is not "Approved", or "Approved-by:" is empty, STOP and reply exactly: "Plan not approved. Ask a human to approve it first." Do nothing else.
2. Read every file listed under "## Files in scope".

## While working
- Follow the plan's steps in order and track them with the todo list.
- Edit only files listed under "## Files in scope". If another file must change, stop and explain why.
- Copy contract field names and error texts exactly.
- Run npm test. If it fails, fix and retry at most 2 times, then stop and report the failure.

## When done
Reply with: files changed, test result (pass and fail counts), and any deviation from the plan.
Never commit, push or open pull requests. A human does that.
```

`.github/agents/reviewer.agent.md`:

```markdown
---
name: Reviewer
description: "Read-only reviewer. Checks a change against its approved plan, the issue contract and the tests. Never edits files."
argument-hint: "Path to the approved plan the change implements"
tools: ['read', 'search', 'execute']
---
You are the **Reviewer**. You never edit files. The only commands you may run are git status, git diff, git diff --name-only and npm test.

Check the uncommitted changes (or the branch diff against main) against the plan you are given and report in exactly this format:

## Review: <plan path>
Verdict: APPROVE | REQUEST_CHANGES

| Check | Result | Evidence |
| --- | --- | --- |
| Plan is approved | PASS/FAIL | Status and Approved-by lines |
| Only files in scope changed | PASS/FAIL | output of git diff --name-only |
| Contract texts are exact | PASS/FAIL | quoted strings and file:line |
| Boundary tests exist | PASS/FAIL | test names |
| npm test passes | PASS/FAIL | pass/fail counts |

### Findings
1. <file>:<line> <problem> -> <suggested fix>

Use REQUEST_CHANGES if any check fails.
```

**Checkpoint:** open the agent picker in the chat input: it lists **Planner**, **Implementer** and **Reviewer**. If one is missing, check its header: every `description` that contains a colon must be in quotes, as above, or the YAML breaks and the agent silently disappears.

Note the role split: the Implementer may not commit or push. In these labs git work is always done by the built-in **Agent** at your request, so the human decides when work leaves the machine.

The `handoffs` buttons appear only when the Session Target is **Local** (the legacy harness). With the default **Copilot** target you move between agents with the agent picker, as in Exercise 4; the handoff prompts show what each transition carries.

## Exercise 3: Make the plan a required check, not a request (6 min)

Asking an agent to plan is not a control. A failing status check is. The starter already contains the checker (`scripts/check-plan.js`); you wire it into CI.

1. Create `.github/workflows/plan-check.yml`:

```yaml
name: Plan check

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

permissions:
  contents: read

jobs:
  plan-check:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - name: Check plan and scope
        env:
          PR_BODY: ${{ github.event.pull_request.body }}
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: node scripts/check-plan.js
```

The gate requires a plan only when a PR changes product code (`src/**`, `test/**`, set in `config/agent-policy.json`). It then checks that the plan named in the PR body exists, is approved, and lists every changed product file. Configuration under `.github/` is governed by code owners instead (Exercise 5). The PR body reaches the script through an environment variable, never pasted into the `run:` script, so text in a PR cannot inject shell commands.

2. Commit Exercises 1 to 3 to `main`. **New Chat**, **Agent**:

```text
I am on main. Commit everything under .github with the message "Agent instructions, custom agents and plan gate" and push main to origin.
```

Read and **Allow** each command.

**Checkpoint:** on github.com, your repository's file list shows a new `.github` commit message at the top.

## Exercise 4: Deliver FEAT-2 through the pipeline (10 min)

1. **New Chat**, **Agent**: `Create and switch to a new branch named feat/2-meal-justification.` Allow the command.
2. **New Chat**, choose **Planner** in the agent picker, and send `FEAT-2`. When it finishes, open the plan it wrote in `docs/plans/` (select the file name in the response, or find it in the Explorer).
3. Review it with the Lab 1 checklist. Watch for the interaction the contract calls out: an 80.00 meal needs both a receipt and a justification. Approve it by editing `Status: Approved` and `Approved-by: @<you>` in the file and saving.
4. Switch the agent picker (same chat) to **Implementer** and send the plan path, for example `docs/plans/FEAT-2-meal-justification.md`. Select **Allow** for `npm test` and **Keep** for the edits after reviewing them.
5. Test the gate on purpose: change the plan back to `Status: Draft` and save. **New Chat**, **Implementer**, send the plan path again.

**Checkpoint:** it replies `Plan not approved. Ask a human to approve it first.` and changes nothing. Set `Status: Approved` again and save.

6. Choose **Reviewer** in the agent picker and send the plan path. Allow `git diff` and `npm test` when asked.

**Checkpoint:** the Reviewer answers in the table format with `Verdict: APPROVE`. If it requests changes, paste its findings into a chat with the Implementer, then review again.

7. Open the PR **without** a plan line, on purpose. **New Chat**, **Agent**:

```text
Commit all changes with the message "FEAT-2: meals over 60.00 need a justification", push the branch to origin, and open a pull request against main with the GitHub CLI, titled "FEAT-2: meal justification", with the body "Closes #2" only. Give me the URL.
```

8. Open the PR URL. In the merge box at the bottom of the **Conversation** tab, the **Plan check / plan-check** check fails (red X). Select **Details** next to it, then scroll to the job summary at the top of the run page (or expand the **Check plan and scope** step): it says `No plan referenced`.
9. Fix the description. Back on the PR **Conversation** tab, select **...** on the first comment (your PR description), choose **Edit**, replace the text with the block below, and select **Update comment**:

```text
Closes #2

Plan: docs/plans/FEAT-2-meal-justification.md

Agent trace: Planner drafted, @<you> approved, Implementer built, Reviewer APPROVE.
```

(If your plan file has a different name, use that name.)

**Checkpoint:** editing the description re-runs the check within a minute. **plan-check** turns green; its **Details** page shows the plan path, the approver and the files in scope.

10. Merge: select **Merge pull request**, then **Confirm merge**.
11. **New Chat**, **Agent**: `Switch to main and pull the latest changes from origin.`

## Exercise 5: Code owners and a ruleset on main (6 min)

1. Create `.github/CODEOWNERS` (replace `<you>`):

```text
# Default owner for everything
*                @<you>

# Compliance-sensitive code and agent configuration
/src/policy.js   @<you>
/.github/        @<you>
/config/         @<you>
```

2. **New Chat**, **Agent**: `Commit .github/CODEOWNERS with the message "Add code owners" and push main to origin.` This is the last direct push to `main`.
3. Create the ruleset on github.com:
   1. Open your repository and select **Settings** (last tab in the repository bar).
   2. In the left sidebar, under **Code and automation**, select **Rules > Rulesets**.
   3. Select **New ruleset > New branch ruleset**.
   4. **Ruleset Name**: `protect-main`. **Enforcement status**: **Active**.
   5. **Bypass list**: select **Add bypass**, tick **Repository admin**, select **Add selected**. In the new row, open the mode dropdown (it shows **Always allow**) and choose **For pull requests only**. This lets you merge your own PRs while direct pushes stay blocked even for you.
   6. **Target branches**: select **Add target > Include default branch**.
   7. **Branch rules**: keep **Restrict deletions** and **Block force pushes** selected. Select **Require a pull request before merging**; in the options that appear set **Required approvals** to `1` and select **Require review from Code Owners**.
   8. Select **Require status checks to pass**, then **Add checks**. Type `test`, select **test** (GitHub Actions) from the list; type `plan-check` and select **plan-check**.
   9. Scroll down and select **Create**.
4. Prove that it works. **New Chat**, **Agent**:

```text
On main, create an empty commit with the message "try a direct push" and push it to origin. Report exactly what git says.
```

**Checkpoint:** the push is rejected with `GH013: Repository rule violations found`. Then send:

```text
Undo that empty commit: reset my local main to match origin/main.
```

From now on you merge your own PRs with the bypass. You work alone, so nobody else can approve them. To merge with the bypass: on the PR's **Conversation** tab, scroll to the merge box, select the checkbox **Merge without waiting for requirements to be met (bypass rules)**, then select **Bypass rules and merge** (it may read **Merge pull request**) and **Confirm merge**. Every bypass is recorded in the ruleset's **Insights**, the audit trail a real team reviews.

## Discussion

- Which rules are now enforced technically (checks, rulesets) and which still rely on agent instructions?
- The deck's knowledge check asks how to prevent planless execution from being merged. Which two settings in this lab answer it?
