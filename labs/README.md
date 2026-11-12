# GH-600 labs: Developing in Agentic AI Systems

Six hands-on labs, about 4 hours in total, follow one use case from start to finish: you lead a team of GitHub Copilot agents that extends the **Contoso Expense Service**, the small Node.js API in this repository. Every lab adds to the same repository in your own GitHub account, so what you configure in Lab 2 (agents, plan gate, rules) is what Labs 3 to 6 build on. You never type git commands: you tell Copilot what to do in git and approve what it runs.

| Lab | Module (deck) | Time | Backlog item | You build | GH-600 skills |
| --- | --- | --- | --- | --- | --- |
| [Setup](00-setup.md) | | 20 min | Seed issues #1 to #8 | Your copy of this repo, VS Code and Copilot ready | |
| [1](01-plan-approve-act.md) | 1 Foundations of agentic AI | 35 min | FEAT-1 receipt rule | Task card, structured plan, human approval, agent execution, first PR | 1.1, 1.2 |
| [2](02-architecture-sdlc.md) | 2 Agent architecture and SDLC | 40 min | FEAT-2 meal justification | Custom instructions, Planner / Implementer / Reviewer agents, plan-gate workflow, CODEOWNERS, ruleset | 1.1 to 1.3, 2.1 |
| [3](03-tools-mcp.md) | 3 Tooling, MCP, execution | 40 min | FEAT-3 CSV export | Tool matrix, read-only GitHub MCP server, approval settings, Copilot setup steps, cloud agent PR | 2.1 to 2.4 |
| [4](04-multi-agent-orchestration.md) | 4 Multi-agent orchestration | 45 min | FEAT-4 audit trail, FEAT-5 and FEAT-6 in parallel | Orchestrator with subagents, handoff log, worktree isolation, conflict resolution, agent lifecycle | 5.1 to 5.4 |
| [5](05-memory-state-evaluation.md) | 5 Memory, state, evaluation | 40 min | BUG-7 inclusive thresholds | Memory file with expiry, resumable progress file, evaluation scorecard in CI, CodeQL, root-cause analysis, tuning | 3.1 to 3.3, 4.1 to 4.3 |
| [6](06-guardrails-operations.md) | 6 Governance and operations | 40 min | DOCS-8 API docs | Autonomy matrix, preToolUse policy hook, least-privilege tokens, protected production environment, readiness review | 1.3, 6.1, 6.2 |

Skill numbers refer to the [GH-600 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-600) (for example 2.2 = Configure MCP servers).

## What you need from your Copilot plan

| Capability | Copilot Free | Pro, Pro+ | Business, Enterprise |
| --- | --- | --- | --- |
| Chat, agents, custom agents, subagents, hooks, MCP in VS Code (Labs 1 to 6) | Yes, within monthly limits | Yes | Yes, if your admin enables the policies |
| Copilot cloud agent: assign an issue to Copilot (Lab 3, Exercise 5) | No: use the local path in the lab | Yes | Yes, if enabled for the repo |
| MCP registry and allowlist (Lab 3, Exercise 3) | Read the walkthrough | Read the walkthrough | Org or enterprise owners can configure it |

Everything else (Actions, rulesets, environments with required reviewers, CodeQL) is free when your lab repository is **public**.

Instructors: see [instructor-notes.md](instructor-notes.md).
