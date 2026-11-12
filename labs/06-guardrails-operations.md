# Lab 6: Governance, guardrails and operations

**Module 6, 40 minutes.** Until now several rules were only instructions ("never edit .github", "only a human approves"). You right-size autonomy by risk, then replace instructions with technical controls: a `preToolUse` hook that blocks unsafe agent actions before they run, least-privilege tokens, and a production environment that waits for a human. Finally you check that low-risk work still flows fast (DOCS-8, #8) and collect the evidence for a readiness review.

**You will produce:** `docs/governance/autonomy.md`, a filled `config/agent-policy.json`, `.github/hooks/policy.json`, a `production` environment, `.github/workflows/deploy.yml`, a tuned CODEOWNERS, the DOCS-8 PR and `docs/governance/readiness.md`.

**Start:** **New Chat**, **Agent**: `Switch to main, pull the latest changes from origin, then create and switch to a branch named chore/lab6-guardrails.`

## Exercise 1: Classify actions and assign autonomy levels (6 min)

Create `docs/governance/autonomy.md` (Explorer: right-click `docs/governance` > **New File...**). Check each row against your own risk judgment and change the level where you disagree; be ready to defend it.

```markdown
# Agent autonomy levels

| Level | Meaning | Human involvement | Technical control |
| --- | --- | --- | --- |
| L3 Autonomous | Agent acts; merges after automated checks and a lightweight review | One approval, no plan, no code owner | Docs are outside planRequiredPaths and have no CODEOWNERS entry; required status checks |
| L2 Reviewed | Agent acts; a human reviews the pull request | PR approval | Ruleset: PR required, CODEOWNERS |
| L1 Approved | A human approves the plan before the agent acts and reviews after | Plan approval + code-owner review | plan-check, CODEOWNERS on docs/plans and src/policy.js, hook protectedPaths |
| L0 Human only | Agents may prepare, never execute | A human performs the action | Environment required reviewers, hook denyCommands |

## Action classification

| Action | Operational risk | Security risk | Compliance risk | Level |
| --- | --- | --- | --- | --- |
| Edit README.md or docs/ (not plans) | Low | Low | Low | L3 |
| Add tests | Low | Low | Low | L2 |
| Change application code in src/ (not policy) | Medium | Medium | Low | L2 |
| Change approval thresholds in src/policy.js | Medium | Low | High | L1 |
| Approve a plan (Status/Approved-by lines) | Medium | Medium | High | L0 |
| Change workflows, hooks, agents, CODEOWNERS, config | High | High | Medium | L1 |
| Destructive commands (rm -rf, force push, reset --hard) | High | High | Medium | L0 |
| Merge to main | Medium | Medium | Medium | L2 (ruleset) |
| Deploy to production | High | High | High | L0 (environment reviewer) |
```

## Exercise 2: Block unsafe actions with a hook (12 min)

The starter contains `scripts/agent-policy.js`. It reads one tool call as JSON, applies `config/agent-policy.json`, prints a deny decision or `{}` (no decision), and logs every call to `.agent-audit/hook-log.jsonl` (git-ignored).

1. Open `config/agent-policy.json` and replace its content:

```json
{
  "denyCommands": [
    "rm\\s+-rf?\\s",
    "Remove-Item\\b.*-Recurse",
    "git\\s+push\\b.*(--force|\\s-f\\b)",
    "git\\s+push\\s+(origin\\s+)?main\\b",
    "git\\s+reset\\s+--hard",
    "(curl|wget)\\b[^|]*\\|\\s*(sh|bash)",
    "npm\\s+publish",
    "gh\\s+pr\\s+merge",
    "gh\\s+repo\\s+delete"
  ],
  "protectedPaths": [
    ".github/workflows/**",
    ".github/hooks/**",
    ".github/agents/**",
    ".github/CODEOWNERS",
    "config/agent-policy.json",
    "src/policy.js"
  ],
  "planRequiredPaths": [
    "src/**",
    "test/**"
  ]
}
```

The policy protects itself and the hook file, so an agent cannot switch its own guardrails off. Note `gh pr merge` and pushes to `main`: from now on Copilot can open pull requests for you but never merge them.

2. Test the policy offline. In the terminal (**Terminal > New Terminal**; these commands work in Bash and PowerShell):

```bash
node scripts/agent-policy.js --event scripts/fixtures/deny-rm.json
node scripts/agent-policy.js --event scripts/fixtures/deny-workflow-edit.json
node scripts/agent-policy.js --event scripts/fixtures/deny-local-format.json
node scripts/agent-policy.js --event scripts/fixtures/allow-test.json
```

**Checkpoint:** the first three print JSON with `"permissionDecision":"deny"` and a reason; the last prints `{}`. The fixtures cover both payload shapes VS Code can send: the Copilot harness (`toolName`, `toolArgs`) and the legacy Local harness (`tool_name`, `tool_input`). Open a fixture file to see what a tool call looks like.

3. Register the hook for agent sessions. Create `.github/hooks/policy.json` (Explorer: right-click `.github` > **New File...** > `hooks/policy.json`):

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "command": "node scripts/agent-policy.js",
        "timeoutSec": 10
      }
    ]
  }
}
```

Save it. The Copilot harness in VS Code, Copilot CLI and Copilot cloud agent read hooks from `.github/hooks/*.json` (the cloud agent from the default branch), so after the merge this one file guards every surface.

4. Try to break the rules. **New Chat**, **Agent**, and send each prompt separately, waiting for the answer each time:

```text
Delete the docs/plans folder with rm -rf.
```

```text
Change node-version from 24 to 22 in .github/workflows/ci.yml.
```

```text
Run npm test.
```

**Checkpoint:** the first two tool calls are denied with the policy's reason (the agent reports that it was blocked and nothing changes); `npm test` runs. Open `.agent-audit/hook-log.jsonl` in the Explorer and find one line per tool call with its decision.

If nothing is blocked: confirm the workspace is trusted and the Session Target is **Copilot**, then open **View > Output** and pick **GitHub Copilot Chat Hooks** in the dropdown at the right of the Output panel to see hook errors. Hooks in VS Code are a preview feature; a hook that times out falls through to the normal approval prompts, which is why the timeout is short and the script makes no network calls.

## Exercise 3: Least privilege for workflow tokens (5 min)

1. **New Chat**, **Agent**:

```text
Without changing files, show every "permissions:" block in .github/workflows with the two lines that follow it, grouped by workflow file.
```

**Checkpoint:** every workflow declares `contents: read` and nothing more; no job elevates.

2. Set the repository default as a backstop:
   1. On github.com open **Settings**, then in the left sidebar **Actions > General**.
   2. Scroll to **Workflow permissions** and select **Read repository contents and packages permissions**.
   3. Clear **Allow GitHub Actions to create and approve pull requests**.
   4. Select **Save** in that section.

## Exercise 4: Human approval for production (8 min)

1. Create the environment:
   1. On github.com open **Settings**, then **Environments** in the left sidebar.
   2. Select **New environment**, enter the name `production`, and select **Configure environment**.
   3. Select **Required reviewers**, type your login in the search box and pick yourself. Leave **Prevent self-review** cleared (you are the only reviewer).
   4. Under **Deployment branches and tags**, open the dropdown (**No restriction**) and choose **Selected branches and tags**. Select **Add deployment branch or tag rule**, keep **Ref type: Branch**, type `main` in **Name pattern**, and select **Add rule**.
   5. Select **Save protection rules**.
2. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths-ignore:
      - "docs/**"
      - "**/*.md"

# Least privilege: read-only token by default; no job needs more.
permissions:
  contents: read

# Never run two production deployments at once; a newer run replaces an older pending one.
concurrency:
  group: deploy-production
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npm ci
      - run: npm test
      - name: Package release
        run: tar -czf release.tgz src package.json
      - uses: actions/upload-artifact@v6
        with:
          name: release-${{ github.sha }}
          path: release.tgz
          retention-days: 7

  deploy:
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 10
    # The production environment requires a human reviewer before this job starts.
    environment:
      name: production
      url: https://contoso-expenses.example.com
    steps:
      - uses: actions/download-artifact@v6
        with:
          name: release-${{ github.sha }}
      - name: Deploy (simulated)
        run: |
          ls -l release.tgz
          echo "Deployed ${GITHUB_SHA} to production (simulated) by run ${GITHUB_RUN_ID}, triggered by ${GITHUB_ACTOR}" | tee deploy-record.txt
      - uses: actions/upload-artifact@v6
        with:
          name: deploy-record-${{ github.sha }}
          path: deploy-record.txt
          retention-days: 90
```

You create this file by hand: the hook now blocks agents from writing under `.github/workflows/`.

3. Tune CODEOWNERS for velocity: docs and tests do not need a code-owner review, plans and sensitive code do. Replace the content of `.github/CODEOWNERS` (replace `<you>`) and save:

```text
# No default owner: docs and tests need a normal review, not a code-owner review.

# Compliance-sensitive code
/src/policy.js            @<you>

# Agent configuration, guardrails and automation (agents must not change these alone)
/.github/                 @<you>
/config/                  @<you>

# Plan approvals are a human decision
/docs/plans/              @<you>
```

4. Ship Exercises 1 to 4. **New Chat**, **Agent**:

```text
Commit all changes with the message "Lab 6: autonomy levels, policy hook, deploy workflow, CODEOWNERS", push the branch, and open a pull request against main with the GitHub CLI titled "Lab 6 guardrails" with the body "Configuration and docs only." Give me the URL.
```

The hook allows these commands: committing and pushing a branch is not on the deny list.

5. Open the PR, wait for the checks, and merge with the bypass (checkbox **Merge without waiting for requirements to be met (bypass rules)**, **Bypass rules and merge**, **Confirm merge**).
6. The merge to `main` starts **Deploy**. Open the **Actions** tab and select the newest **Deploy** run. `build` succeeds and `deploy` shows **Waiting** with a yellow banner.
7. Select **Review deployments** in the banner, tick **production**, type a comment such as `Approved after reviewing Lab 6 changes`, and select **Approve and deploy**.

**Checkpoint:** the deploy job finishes green; the run's **Summary** page lists a `deploy-record-...` artifact; and the repository home page shows **Deployments** in the right sidebar with `production` (select it to see your approval in the history).

## Exercise 5: Keep low-risk work fast: DOCS-8 (5 min)

1. **New Chat**, **Agent**: `Switch to main, pull from origin, then create and switch to a branch named docs/8-api.`
2. **New Chat**, **Docs Writer**:

```text
DOCS-8: add an "## API" section to README.md listing every route, its body or query parameters, and its error texts, from the code in src/.
```

Review the new section and select **Keep**.
3. Check two or three rows against `src/server.js` yourself.
4. **New Chat**, **Agent**:

```text
Commit README.md with the message "DOCS-8: document the API", push the branch, and open a pull request against main with the GitHub CLI titled "DOCS-8: API documentation" with the body "Closes #8". Give me the URL.
```

5. Open the PR and select **Show all checks**.

**Checkpoint:** **plan-check** passes with `no product code changed`, and no code-owner review is requested (the merge box only asks for 1 approval). Merge with the bypass, then open the **Actions** tab: **Deploy** did not start for this merge (`paths-ignore`). Low-risk work needs one review and no extra gates.

## Exercise 6: Production readiness review (4 min)

1. **New Chat**, **Agent**: `Switch to main, pull from origin, then create and switch to a branch named docs/readiness.`
2. Create `docs/governance/readiness.md` and fill in the evidence column with links (copy them from the browser address bar) or paths from your repository:

```markdown
# Production readiness review: Contoso Expense Service agents

| # | Control | Evidence (link or path) | Status |
| --- | --- | --- | --- |
| 1 | Autonomy levels defined | docs/governance/autonomy.md | |
| 2 | Plans required and approved by a human | plan-check runs; docs/plans/* Approved-by | |
| 3 | Branch protection on main | Settings > Rules > Rulesets > protect-main | |
| 4 | Code owners for sensitive paths | .github/CODEOWNERS | |
| 5 | Least-privilege agent tools | .github/agents/*.agent.md; docs/agents/tool-matrix.md | |
| 6 | Read-only GitHub MCP for planning | .vscode/mcp.json | |
| 7 | Deterministic guardrails (hooks) | .github/hooks/policy.json; .agent-audit/hook-log.jsonl | |
| 8 | Least-privilege GITHUB_TOKEN | permissions: contents: read in every workflow | |
| 9 | Human approval for production | production environment; Deploy run history | |
| 10 | Evaluation signals in CI | Agent evaluation artifact; CodeQL alerts | |
| 11 | Traceability of multi-agent work | docs/handoffs/*.md; PR agent traces | |
| 12 | Agent lifecycle managed | docs/agents/CHANGELOG.md; docs/agents-retired/ | |
```

3. **New Chat**, **Agent**: `Commit docs/governance/readiness.md with the message "Readiness review", push the branch, and open a pull request against main with the GitHub CLI titled "Readiness review" with the body "Docs only." Give me the URL.` Merge it with the bypass.

**Checkpoint:** every row has evidence. The rows you could not fill are your backlog for running agents in production.

## Discussion

- The deck warns against "relying only on prompt instructions". List three instructions from Lab 2 that are now enforced technically, and one that still is not.
- An agent could still write `Status: Approved` into a plan. Which control now catches that, and is it enough?
