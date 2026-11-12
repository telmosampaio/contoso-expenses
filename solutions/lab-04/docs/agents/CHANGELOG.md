# Agent changelog

Agents are versioned like any other software component. Every change is made in a pull request so its history is auditable.

| Date | Agent | Change | Type | Reason |
| --- | --- | --- | --- | --- |
| Lab 4 | Docs Writer | Added | add | DOCS-8 needs a documentation-only agent |
| Lab 4 | Security Reviewer | v1 -> v2: added audit-integrity check | update | FEAT-4 introduced an audit trail |
| Lab 4 | Code Reviewer | Added, machine-readable verdict line | replace | Replaces Reviewer so the Feature Lead can parse verdicts |
| Lab 4 | Reviewer | Retired, file moved to docs/agents-retired/ | retire | Superseded by Code Reviewer; history kept in git and in docs/agents-retired |
