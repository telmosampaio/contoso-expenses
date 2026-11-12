# Instructor notes

The lab steps were verified in two ways: every command, file and check was executed end to end in a scripted run of all six labs (73 of 73 checks passed), and every Copilot and GitHub UI step was checked against the current product documentation (November 2026). Copilot chat output itself cannot be scripted, so do one dry run before the first delivery.

## Delivery model

- This repository ([telmosampaio/gh600-agentic-labs](https://github.com/telmosampaio/gh600-agentic-labs)) is a **template**. Each student selects **Use this template > Create a new repository**, creates a public `<login>/contoso-expenses`, and clones their copy with **Git: Clone** in VS Code. Their copy has its own issues, Actions, rulesets and environments.
- Students never type git commands. Every git and GitHub CLI step is a prompt to the built-in **Agent**, which proposes the commands for the student to approve. The only typed command is the one-time interactive `gh auth login` in the setup.
- The Implementer agent is not allowed to commit or push; git work always goes through the built-in Agent at the student's request, so a human decides when work leaves the machine.
- After Lab 6, the policy hook blocks `gh pr merge`, force pushes, pushes to `main` and `git reset --hard`, so agents can open PRs but never merge them.

## What was executed

`instructor/verify-labs.sh` replays the labs: it creates a git repository from the starter, applies each lab's reference files in lab order on the same branches the labs use, and runs the checks a student or a workflow runs. `instructor/check-lab-snippets.py` checks that every JSON, YAML and agent snippet in `labs/*.md` is valid and matches the reference files, and that no lab asks students to type a git command.

| Area | Verified by running |
| --- | --- |
| Setup | Starter suite (20 tests), `npm ci`, server answers `/health`, `seed-issues.js` lists 8 issues |
| Plan gate (Labs 1 to 3) | `check-plan.js` with the same `PR_BODY`, `BASE_SHA`, `HEAD_SHA` the workflow passes, for every PR in the labs; negative cases: PR-template placeholder, missing Plan line, draft plan, out-of-scope file |
| Config-only and docs-only PRs | Pass with `no product code changed` (Labs 3 to 6) |
| Parallel features (Lab 4) | FEAT-5 and FEAT-6 in separate worktrees each pass alone; merging both conflicts in `src/server.js`; the resolved version passes 44 tests |
| Evaluation (Lab 5) | Scorecard fails GC-3 before the fix, reproducing test fails, fix scores 100%, drift in `src/store.js` is detected, history keeps one line per run; the `sed` line in `eval.yml` handles CRLF bodies |
| Hook (Lab 6) | Denies `rm -rf`, workflow edit, force push (both payload formats), edit of `src/policy.js`, shell redirect into a protected path, `gh pr merge`, push to `main`; allows `npm test`, reading a protected file, and every commit, push and `gh pr create` the labs ask Copilot to run |
| Static checks | All workflows pass actionlint; all JSON parses; all agent and instruction headers parse as YAML with required keys; every handoff target and subagent name exists; lab snippets match the reference files |
| Catch-up | `catch-up.js 6` on a fresh starter yields a green suite; `catch-up.js 4` removes the retired Reviewer |

## Not executable outside a live session

| Step | What to confirm in your dry run |
| --- | --- |
| Session Target, agent picker, Configure Tools, Allow buttons | Labels can move between monthly VS Code releases |
| Copilot running git and gh | Copilot proposes slightly different commands each time; students should read each one before **Allow** |
| Handoff buttons | Shown only with the Local harness (deprecated, removal planned for February 2027); labs use the agent picker instead |
| Terminal auto-approve rules | Some VS Code versions still prompt under Default Approvals; the lab tells students to approve manually |
| Hooks | Preview in VS Code; Copilot harness format (`version: 1`, `preToolUse`); the script also accepts the Local payload |
| Cloud agent | Paid plans only; the assigning user cannot approve the PR; workflows wait for **Approve and run workflows** |
| Ruleset bypass mode | **For pull requests only** keeps the Lab 2 direct-push checkpoint rejected for admins |

## Delivery tips

- A paid Copilot seat is strongly recommended. The labs make many agent requests, and a Free monthly allowance may run out before Lab 6.
- Run the setup before the session; it is the step most likely to need help (CLI sign-in, workspace trust, org policies).
- Students must seed the issues before opening any PR, so #1 to #8 match FEAT-1 to DOCS-8.
- Students who fall behind use the catch-up prompt at the end of the setup guide. Lab 4 catch-up also retires the Reviewer agent.

## Timing

| Block | Minutes |
| --- | --- |
| Setup | 20 |
| Lab 1 | 35 |
| Lab 2 | 40 |
| Lab 3 | 40 |
| Lab 4 | 45 |
| Lab 5 | 40 |
| Lab 6 | 40 |
| Total | 260 |

## Sources

- [GH-600 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-600)
- [Custom agents in VS Code](https://code.visualstudio.com/docs/agent-customization/custom-agents), [custom agent file reference](https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference), [subagents](https://code.visualstudio.com/docs/agents/subagents)
- [Agent hooks in VS Code](https://code.visualstudio.com/docs/agent-customization/hooks), [Copilot hooks configuration](https://docs.github.com/en/copilot/reference/hooks-configuration)
- [Agent harnesses and the Session Target](https://code.visualstudio.com/docs/agents/agent-harnesses), [approvals and permissions](https://code.visualstudio.com/docs/agents/run/approvals)
- [MCP servers in VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers), [restrict MCP access to a registry](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-mcp-usage/restrict-based-on-registry)
- [Customize the cloud agent environment](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-environment), [assign an issue to Copilot](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-a-pr), [cloud agent risks and mitigations](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations)
