# Lab 3: Tools, MCP and execution environments

**Module 3, 40 minutes.** Agents act through tools, so every tool is an authorization decision. You map the tools each agent needs, connect the Planner to GitHub through a read-only remote MCP server, tune tool approvals, prepare the cloud execution environment, and let an agent create a branch and pull request on its own for FEAT-3 (#3, CSV export).

**You will produce:** `docs/agents/tool-matrix.md`, `.vscode/mcp.json`, `.vscode/settings.json`, an updated Planner, `.github/workflows/copilot-setup-steps.yml`, an approved FEAT-3 plan and a merged FEAT-3 pull request.

**Start:** **New Chat**, **Agent**:

```text
Switch to main, pull the latest changes from origin, then create and switch to a new branch named chore/lab3-tooling.
```

## Exercise 1: Identify the tools each agent needs (6 min)

1. Create `docs/agents/tool-matrix.md` (Explorer: right-click `docs` > **New File...** > type `agents/tool-matrix.md`):

```markdown
# Agent tool matrix

| Agent | Needs to | Tools granted | Explicitly not granted |
| --- | --- | --- | --- |
| Planner | Read code and the issue; write one plan file | read, search, edit (docs/plans only, by instruction), todo, github-readonly/* | execute, any GitHub write tool |
| Implementer | Edit files in plan scope; run tests | read, search, edit, execute, todo | GitHub MCP, web |
| Reviewer | Read the diff; run tests | read, search, execute (git diff, npm test only, by instruction) | edit |
```

2. In the Chat view choose **Reviewer** in the agent picker. Then select the **Configure Tools** button in the chat input (the icon that looks like a wrench and screwdriver, next to the agent and model pickers).

**Checkpoint:** in the list that opens, only the tool sets from the Reviewer's `tools:` line are selected. Press `Esc` to close it without changes. Notice the column "by instruction": those limits are behavioral, not technical. Lab 6 makes them technical.

## Exercise 2: Add the GitHub remote MCP server, read-only (10 min)

1. Create `.vscode/mcp.json` (Explorer: right-click `.vscode` > **New File...** > `mcp.json`):

```json
{
  "servers": {
    "github-readonly": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "X-MCP-Toolsets": "issues,pull_requests,actions",
        "X-MCP-Readonly": "true"
      }
    }
  }
}
```

Two least-privilege controls are in play: `X-MCP-Toolsets` exposes only three toolsets, and `X-MCP-Readonly` removes every write tool from them.

2. Save the file. A small **Start** link (CodeLens) appears just above the line `"github-readonly": {`. Select **Start**.
3. When VS Code asks whether the server may sign in with GitHub, select **Allow**, choose your account, and approve in the browser if asked. Back in VS Code, the CodeLens changes to **Running** and shows a tool count.
4. Inspect it: Command Palette > **MCP: List Servers** > **github-readonly** > **Show Output**. The Output panel at the bottom shows the connection log and the discovered tools.

**Checkpoint:** the server is running and none of the listed tools creates, updates or comments. If it cannot start and you use a Business or Enterprise seat, the **MCP servers in Copilot** policy is probably disabled: ask your admin, and paste issue text into the Planner meanwhile.

5. Give the Planner, and only the Planner, the server. Open `.github/agents/planner.agent.md` and make three edits:
   - Change the `tools` line to:

```markdown
tools: ['read', 'search', 'edit', 'todo', 'github-readonly/*']
```

   - Replace step 1 under `## Your job` with:

```markdown
1. Fetch the issue with the github-readonly MCP tools (owner and repository come from the git remote of this workspace). If the tools are unavailable, ask the user to paste the issue.
```

   - Add this line under `## Rules`:

```markdown
- You have read-only GitHub access. If asked to comment on, label or close an issue, say that a human or another agent must do it.
```

   Save the file.

6. **New Chat**, **Planner**, send `Plan issue #3.` When the chat asks to run an MCP tool (for example `issue_read` from `github-readonly`), read it and select **Allow**.

**Checkpoint:** expand the tool call in the response: it names the `github-readonly` server. The Planner wrote `docs/plans/FEAT-3-csv-export.md` with `Status: Draft`. Review it, then approve it by editing `Status: Approved` and `Approved-by: @<you>` and saving.

7. Test the boundary. In the same chat send `Now add a comment to issue #3 saying that planning is done.`

**Checkpoint:** the Planner declines because it has no write tool. The refusal comes from the missing tool, not from good manners: that is least privilege.

## Exercise 3: MCP registries and allowlists (5 min, walkthrough)

Organizations decide which MCP servers developers may run. You can look at both sides without admin rights.

1. Open the Extensions view (the four-squares icon in the Activity Bar, `Ctrl+Shift+X`) and type `@mcp` in its search box. This is the MCP server gallery, backed by a registry. Find the GitHub MCP server entry and select it to read its details. Do not install anything.
2. Open Settings (**File > Preferences > Settings**, macOS **Code > Settings > Settings**) and type `chat.mcp.access` in the search box. It controls whether VS Code runs all servers, only registry servers, or none. When an organization policy manages it, the setting is greyed out with a note. Do not change it.
3. Read how an organization or enterprise owner sets the same control on GitHub: in the organization's **Settings > Copilot > Policies** (enterprises: **AI controls > MCP**), they enable **MCP servers in Copilot**, enter an **MCP Registry URL**, and set **Restrict MCP access to registry servers** to **Allow all** or **Registry only**. The policy follows the organization that assigns the Copilot seat.

**Checkpoint question:** with **Registry only** selected and no registry URL configured, which servers can run? (None. Answer in the discussion.)

## Exercise 4: Tool approval rules (5 min)

1. Open `.vscode/settings.json` and replace its content with:

```json
{
  "files.eol": "\n",
  "chat.tools.terminal.autoApprove": {
    "npm test": true,
    "npm run eval": true,
    "npm run check-plan": true,
    "git status": true,
    "git diff": true,
    "git log": true,
    "git push": false,
    "rm": false,
    "curl": false
  },
  "chat.tools.edits.autoApprove": {
    "**/.github/**": false,
    "**/.vscode/**": false,
    "**/config/**": false,
    "**/src/policy.js": false,
    "**/.env": false
  }
}
```

Save. `true` runs the command without asking; `false` always asks, even if you chose to auto-approve a session.

2. **New Chat**, **Agent**, send `Run git status, then npm test, and summarize both outputs.`
3. Then send `Add a comment line at the top of .github/workflows/ci.yml.` When the edit appears, select **Undo** (or decline the confirmation).

**Checkpoint:** read-only commands and tests run without asking (some VS Code versions still ask; then approve manually), while the edit under `.github/` always waits for you. Safe, repetitive actions get faster; sensitive ones keep a human decision. From now on, `git push` always asks before it runs.

## Exercise 5: Prepare the cloud environment and let the agent open the PR (10 min)

1. Create `.github/workflows/copilot-setup-steps.yml`:

```yaml
name: "Copilot Setup Steps"

on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml
  pull_request:
    paths:
      - .github/workflows/copilot-setup-steps.yml

jobs:
  # The job MUST be called copilot-setup-steps or Copilot ignores it.
  copilot-setup-steps:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
    steps:
      - name: Check out code
        uses: actions/checkout@v6
      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
      - name: Install dependencies
        run: npm ci
      - name: Verify the baseline is green
        run: npm test
```

2. Commit everything from this lab and open a PR. **New Chat**, **Agent**:

```text
Commit all changes with the message "Lab 3: tool matrix, read-only GitHub MCP, approvals, Copilot setup steps, FEAT-3 plan", push the branch to origin, and open a pull request against main with the GitHub CLI titled "Lab 3 tooling" with the body "Configuration and the approved FEAT-3 plan. No product code." Give me the URL.
```

The `git push` asks for approval because of your new rule: read it and select **Allow**.

3. Open the PR. In the merge box, select **Show all checks**.

**Checkpoint:** **plan-check** is green; its **Details** page says `no product code changed`. **Copilot Setup Steps** also ran because the file changed.

4. Merge with the bypass: select **Merge without waiting for requirements to be met (bypass rules)**, then **Bypass rules and merge** and **Confirm merge**. (The code-owner review is still required; that is why you need the bypass.)
5. Validate the environment on `main`: select the **Actions** tab, choose **Copilot Setup Steps** in the left list, select **Run workflow** on the right, keep **Branch: main**, and select the green **Run workflow** button. Refresh after a few seconds and open the new run. It must be green before you delegate work; Copilot uses the setup steps only from the default branch.

**Path A (Copilot Pro, Pro+, Business, Enterprise): delegate to Copilot cloud agent**

6. Open **Issues > FEAT-3** (#3). In the right sidebar select **Assignees**, then **Copilot**. A dialog opens.
7. In the dialog keep the repository and the base branch `main`, leave the agent as **Copilot**, and in **Optional prompt** enter:

```text
Implement the approved plan docs/plans/FEAT-3-csv-export.md exactly. Change only its files in scope.
The pull request description must include the line "Plan: docs/plans/FEAT-3-csv-export.md".
```

Select **Assign** (the button can read **Start task**).
8. Within a minute Copilot adds an 👀 reaction and links a draft PR in the issue timeline. Open the PR and select **View session** to follow the logs: the setup steps run first, then its tool calls and test runs.
9. When Copilot finishes and requests your review, scroll to the merge box and select **Approve and run workflows**: workflows do not run on agent pushes until a human with write access approves.
10. Review the **Files changed** tab against the plan. If the description lacks the Plan line, edit it (**...** > **Edit** on the description). To ask for a change, write a PR comment that starts with `@copilot`.
11. Select **Ready for review** at the bottom of the PR to leave draft state.

**Checkpoint:** **test** and **plan-check** are green. Because you assigned the issue, your approval does not count toward required approvals, so merge with the bypass (checkbox, **Bypass rules and merge**, **Confirm merge**).

**Path B (Copilot Free, or cloud agent unavailable): same scope, local agent**

6. **New Chat**, **Agent**: `Switch to main, pull from origin, then create and switch to a branch named feat/3-csv-export.`
7. **New Chat**, **Implementer**, send `docs/plans/FEAT-3-csv-export.md`. Allow `npm test` and keep the edits after reviewing them.
8. **New Chat**, **Agent**:

```text
Commit all changes with the message "FEAT-3: CSV export", push the branch, and open a pull request against main with the GitHub CLI titled "FEAT-3: CSV export" and this body:
Closes #3

Plan: docs/plans/FEAT-3-csv-export.md
Give me the URL.
```

9. Open the PR, wait for **test** and **plan-check** to turn green, and merge with the bypass.

In both paths finish with **New Chat**, **Agent**: `Switch to main, pull from origin, and run npm test.`

## Exercise 6: Safe execution paths (4 min)

Match each control to the place you already configured it. Write your answers as a comment on your FEAT-3 PR (the **Add a comment** box at the bottom of its **Conversation** tab, then **Comment**).

| Requirement | Where it lives in this repo |
| --- | --- |
| Error handling and retries | Implementer: run tests, fix, retry at most 2 times, then stop |
| Escalation path | Plan section "Escalate to a human if"; Implementer stops on out-of-scope changes |
| Rollback | The **Revert** button near the bottom of a merged PR creates a reverting PR that goes through the same checks |
| Environment constraints | `copilot-setup-steps.yml` (Node 24, `npm ci`, 15-minute timeout) |
| Branch-based scope | Agent work happens on `feat/...` or `copilot/...` branches; `main` accepts only PRs |
| Traceability | Cloud agent commits are authored by Copilot with you as co-author; the session log is linked from the PR |

## Discussion

- Why does the Planner get GitHub through MCP while the Implementer gets none?
- What would you add to `copilot-setup-steps.yml` if the project needed a private package registry?
