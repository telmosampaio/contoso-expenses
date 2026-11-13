# Agent tool matrix

| Agent | Needs to | Tools granted | Explicitly not granted |
| --- | --- | --- | --- |
| Planner | Read code and the issue; write one plan file | read, search, edit (docs/plans only, by instruction), todo, github-readonly/* | execute, any GitHub write tool |
| Implementer | Edit files in plan scope; run tests | read, search, edit, execute, todo | GitHub MCP, web |
| Reviewer | Read the diff; run tests | read, search, execute (git diff, npm test only, by instruction) | edit |