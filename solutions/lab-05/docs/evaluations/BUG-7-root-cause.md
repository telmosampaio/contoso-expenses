# Failure analysis: BUG-7

| Field | Value |
| --- | --- |
| Signal | `npm run eval`: golden case GC-3 (100.00 -> expected auto, got manager) |
| Evidence | eval/results/report.md, src/policy.js line with `<`, test/policy.test.js has no boundary tests |
| Root cause class | Context issue: the requirement says "up to and including", but no instruction, memory entry or test encoded it, so the generated comparison used `<` |
| Contributing | Missing boundary tests (evaluation gap); reviewers checked "tests pass", not "spec conformance" |
| Not the cause | Tool misuse (no tool errors in logs); environment (tests pass in CI and locally) |
| Fix | `<=` in src/policy.js + six boundary tests |
| Tuning | Instruction added to copilot-instructions.md; decision D-003; golden cases run in CI (eval.yml) |
