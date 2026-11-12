---
applyTo: "docs/memory/**,docs/progress/**,docs/handoffs/**"
description: "Rules for agent memory and durable state files"
---
- These files are shared memory between agents and sessions. Write facts and decisions, never conversation transcripts.
- Never store secrets, tokens, personal data or customer data here.
- `docs/memory/decisions.md`: propose new rows in your reply; a human adds them. Never delete a row: strike it through and add a superseding row.
- `docs/progress/<KEY>.md`: update the checklist and the "Last checkpoint" section after every completed step so another session can resume without repeating work.
- If a file contradicts the current code or an approved plan, stop and report the conflict instead of choosing one.
