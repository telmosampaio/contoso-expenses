#!/usr/bin/env bash
# Requires: bash, git, node 22+, python3 with PyYAML, actionlint, curl. Usage: bash instructor/verify-labs.sh
# End-to-end simulation of the GH-600 labs as a student would run them (local git + scripts).
# GitHub-hosted steps (Copilot chat, rulesets, Actions UI) are simulated by running the same
# scripts the workflows run, with the same environment variables.
set -uo pipefail
SRC="${SRC:-$(cd "$(dirname "$0")/.." && pwd)}"
W=/tmp/student
OWNER=student-login
PASS=0; FAIL=0
ok()   { echo "  PASS  $1"; PASS=$((PASS+1)); }
bad()  { echo "  FAIL  $1"; FAIL=$((FAIL+1)); }
expect() { # expect <desc> <expected-exit> <cmd...>
  local desc=$1 want=$2; shift 2
  "$@" > /tmp/out.txt 2>&1; local got=$?
  if [ "$got" = "$want" ]; then ok "$desc"; else bad "$desc (exit $got, wanted $want)"; sed 's/^/        /' /tmp/out.txt | head -15; fi
}
tests_pass() { local n; n=$(npm test 2>&1 | grep -E '^# pass' | awk '{print $3}'); local f; f=$(npm test 2>&1 | grep -E '^# fail' | awk '{print $3}');
  if [ "$f" = "0" ]; then ok "npm test: $n passed ($1)"; else bad "npm test: $f failed ($1)"; fi; }
plancheck() { # plancheck <branch> <body> <want> <desc>
  local base head; base=$(git merge-base main "$1"); head=$(git rev-parse "$1")
  git checkout -q "$1"
  expect "plan-check: $4" "$3" env PR_BODY="$2" BASE_SHA="$base" HEAD_SHA="$head" node scripts/check-plan.js
  git checkout -q main
}
copy_from() { # copy_from <lab> <paths...>  (copy only some files from a lab solution)
  local lab=$1; shift
  for p in "$@"; do mkdir -p "$(dirname "$p")"; sed "s/@OWNER\b/@$OWNER/g" "$SRC/solutions/lab-0$lab/$p" > "$p"; done
}
merge() { git merge -q --no-ff "$1" -m "Merge pull request: $1" && ok "merged $1" || bad "merge $1"; }

rm -rf "$W" /tmp/wt-*; mkdir -p "$W"; cp -r "$SRC/." "$W/"; cd "$W"
git init -q -b main; git config user.email s@example.com; git config user.name student
git add .; git commit -qm "Initial commit"

echo "== Setup"
tests_pass "starter"
expect "seed-issues dry run lists 8 issues" 0 bash -c "node scripts/seed-issues.js --dry-run | grep -c 'issue create' | grep -qx 8"
expect "app starts and /health answers" 0 bash -c "PORT=3999 node src/server.js & p=\$!; sleep 0.7; curl -sf localhost:3999/health | grep -q ok; r=\$?; kill \$p; exit \$r"

echo "== Lab 1"
git checkout -q -b feat/1-receipt-required
copy_from 1 docs/plans/FEAT-1-receipt-required.md src/expenses.js test/receipts.test.js
expect "draft plan template is rejected" 1 node scripts/check-plan.js --plan docs/plans/TEMPLATE.md
expect "approved FEAT-1 plan validates" 0 node scripts/check-plan.js --plan docs/plans/FEAT-1-receipt-required.md
tests_pass "FEAT-1"
git add -A; git commit -qm "FEAT-1"; git checkout -q main; merge feat/1-receipt-required

echo "== Lab 2"
copy_from 2 .github/copilot-instructions.md .github/instructions/tests.instructions.md .github/agents/planner.agent.md \
  .github/agents/implementer.agent.md .github/agents/reviewer.agent.md .github/workflows/plan-check.yml .github/CODEOWNERS
git add -A; git commit -qm "Agent configuration and plan gate"; ok "config committed to main before ruleset"
git checkout -q -b feat/2-meal-justification
copy_from 2 docs/plans/FEAT-2-meal-justification.md src/expenses.js test/meals.test.js
tests_pass "FEAT-2"
git add -A; git commit -qm "FEAT-2"
plancheck feat/2-meal-justification "$(cat .github/pull_request_template.md)" 1 "PR template placeholder fails"
plancheck feat/2-meal-justification "Closes #2" 1 "missing Plan line fails"
plancheck feat/2-meal-justification "Closes #2
Plan: docs/plans/FEAT-2-meal-justification.md" 0 "valid plan passes"
git checkout -q -b drift feat/2-meal-justification; echo "// drift" >> src/store.js; git commit -qam drift; git checkout -q main
plancheck drift "Plan: docs/plans/FEAT-2-meal-justification.md" 1 "out-of-scope src/store.js fails"
git branch -qD drift
merge feat/2-meal-justification
expect "direct push to main would be blocked by ruleset (simulated: n/a locally)" 0 true

echo "== Lab 3"
git checkout -q -b chore/lab3-tooling
copy_from 3 .vscode/mcp.json .vscode/settings.json .github/agents/planner.agent.md .github/workflows/copilot-setup-steps.yml docs/agents/tool-matrix.md
git add -A; git commit -qm "Lab 3 tooling"
plancheck chore/lab3-tooling "Tooling" 0 "config-only PR needs no plan"
merge chore/lab3-tooling
git checkout -q -b docs/3-plan; copy_from 3 docs/plans/FEAT-3-csv-export.md; git add -A; git commit -qm "Plan FEAT-3"
plancheck docs/3-plan "Plan for #3" 0 "plan-only PR needs no plan"
merge docs/3-plan
git checkout -q -b copilot/feat-3-csv-export; copy_from 3 src/csv.js src/server.js test/csv.test.js; git add -A; git commit -qm "FEAT-3"
tests_pass "FEAT-3"
plancheck copilot/feat-3-csv-export "Closes #3
Plan: docs/plans/FEAT-3-csv-export.md" 0 "cloud-agent PR with plan passes"
merge copilot/feat-3-csv-export

echo "== Lab 4"
git checkout -q -b chore/lab4-agents
copy_from 4 .github/agents/feature-lead.agent.md .github/agents/tester.agent.md .github/agents/security-reviewer.agent.md \
  .github/agents/code-reviewer.agent.md .github/agents/docs-writer.agent.md .github/agents/implementer.agent.md \
  .github/workflows/ci.yml docs/agents/CHANGELOG.md
mkdir -p docs/agents-retired; git mv .github/agents/reviewer.agent.md docs/agents-retired/reviewer.agent.md
sed -i '1i <!-- RETIRED in Lab 4: replaced by .github/agents/code-reviewer.agent.md. Kept for audit history. -->' docs/agents-retired/reviewer.agent.md
git add -A; git commit -qm "Lab 4 agents"; merge chore/lab4-agents
git checkout -q -b feat/4-audit-trail
copy_from 4 docs/plans/FEAT-4-audit-trail.md docs/handoffs/FEAT-4.md src/audit.js test/audit.test.js test/helpers.js test/feat-4.edge.test.js
# FEAT-4 server = lab-03 server + audit only
python3 - <<'EOF'
s=open('src/server.js').read()
s=s.replace("const { toCsv } = require('./csv');","const { toCsv } = require('./csv');\nconst { createAuditLog } = require('./audit');")
s=s.replace("function createApp({ store = createStore() } = {}) {","function createApp({ store = createStore(), audit = createAuditLog() } = {}) {")
s=s.replace("""    if (req.method === 'POST' && path === '/expenses') {""","""    if (req.method === 'GET' && path === '/audit') {
      return send(res, 200, audit.list());
    }

    if (req.method === 'POST' && path === '/expenses') {""")
s=s.replace("""        return send(res, 201, record);""","""        audit.record({ expenseId: record.id, route, decidedBy: 'policy-engine' });
        return send(res, 201, record);""")
s=s.replace("  return { server, store };","  return { server, store, audit };")
open('src/server.js','w').write(s)
EOF
tests_pass "FEAT-4"
git add -A; git commit -qm "FEAT-4"
plancheck feat/4-audit-trail "Closes #4
Plan: docs/plans/FEAT-4-audit-trail.md" 0 "FEAT-4 PR"
merge feat/4-audit-trail
# Parallel FEAT-5 / FEAT-6 in isolated worktrees from the same main
git worktree add -q -b feat/5-category-filter /tmp/wt-search main
git worktree add -q -b feat/6-pagination /tmp/wt-paging main
( cd /tmp/wt-search && sed "s/@OWNER\b/@$OWNER/g" $SRC/solutions/lab-04/docs/plans/FEAT-5-category-filter.md > docs/plans/FEAT-5-category-filter.md && cp $SRC/solutions/lab-04/test/filter.test.js test/ && python3 - <<'EOF'
s=open('src/server.js').read()
s=s.replace("const { createAuditLog } = require('./audit');","const { createAuditLog } = require('./audit');\nconst { CATEGORIES } = require('./expenses');")
s=s.replace("""      const items = store.list();
      return send(res, 200, items);""","""      let items = store.list();
      const category = url.searchParams.get('category');
      if (category !== null) {
        if (!CATEGORIES.includes(category)) return send(res, 400, { errors: [`unknown category: ${category}`] });
        items = items.filter((e) => e.category === category);
      }
      return send(res, 200, items);""")
open('src/server.js','w').write(s)
EOF
git add -A && git commit -qm FEAT-5 )
( cd /tmp/wt-paging && sed "s/@OWNER\b/@$OWNER/g" $SRC/solutions/lab-04/docs/plans/FEAT-6-pagination.md > docs/plans/FEAT-6-pagination.md && python3 - <<'EOF'
s=open('src/server.js').read()
s=s.replace("""      const items = store.list();
      return send(res, 200, items);""","""      const params = url.searchParams;
      const limit = params.get('limit') === null ? 50 : (/^\\d+$/.test(params.get('limit')) ? Number(params.get('limit')) : NaN);
      const offset = params.get('offset') === null ? 0 : (/^\\d+$/.test(params.get('offset')) ? Number(params.get('offset')) : NaN);
      if (Number.isNaN(limit) || Number.isNaN(offset)) {
        return send(res, 400, { errors: ['limit and offset must be non-negative integers'] });
      }
      const all = store.list();
      return send(res, 200, all.slice(offset, offset + Math.min(limit, 100)), { 'x-total-count': String(all.length) });""")
open('src/server.js','w').write(s)
EOF
cat > test/pagination.test.js <<'EOF'
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { withServer, post } = require('./helpers');
test('FEAT-6: limit and offset', () => withServer(async (url) => {
  for (let i = 1; i <= 5; i++) await post(url, { employee: `e${i}`, amount: i, category: 'supplies', date: '2026-01-10' });
  const res = await fetch(`${url}/expenses?limit=2&offset=1`);
  assert.equal(res.headers.get('x-total-count'), '5');
  assert.deepEqual((await res.json()).map((e) => e.employee), ['e2', 'e3']);
}));
EOF
git add -A && git commit -qm FEAT-6 )
for d in /tmp/wt-search:FEAT-5-category-filter /tmp/wt-paging:FEAT-6-pagination; do
  ( cd ${d%%:*}; tests_pass "${d##*:} in its own worktree"
    expect "plan-check: ${d##*:} PR" 0 env PR_BODY="Plan: docs/plans/${d##*:}.md" BASE_SHA=$(git merge-base main HEAD) HEAD_SHA=$(git rev-parse HEAD) node scripts/check-plan.js ) | tee -a /tmp/wt.log
done
PASS=$((PASS+$(grep -c '  PASS' /tmp/wt.log))); FAIL=$((FAIL+$(grep -c '  FAIL' /tmp/wt.log))); rm -f /tmp/wt.log
merge feat/5-category-filter
if git merge -q --no-ff feat/6-pagination -m "Merge FEAT-6" 2>/dev/null; then bad "expected a merge conflict between FEAT-5 and FEAT-6"; else
  if git diff --name-only --diff-filter=U | grep -qx src/server.js; then ok "FEAT-6 conflicts with FEAT-5 in src/server.js (as the lab expects)"; else bad "conflict in unexpected files"; fi
  git merge --abort
fi
git worktree remove --force /tmp/wt-search; git worktree remove --force /tmp/wt-paging
# Resolution on the FEAT-6 branch: merge main into it, take the combined handler (reference = lab-04 server)
git checkout -q feat/6-pagination; git merge -q main -m "merge main" 2>/dev/null
cp $SRC/solutions/lab-04/src/server.js src/server.js; cp $SRC/solutions/lab-04/test/pagination.test.js test/pagination.test.js
git add -A; git commit -qm "Resolve conflict: combine category filter and pagination"
tests_pass "FEAT-6 after conflict resolution"
git checkout -q main; merge feat/6-pagination
expect "catch-up 4 removes retired reviewer agent" 0 bash -c "cp -r $W /tmp/cu && cd /tmp/cu && git checkout -q main && git stash -q -u; git checkout -q HEAD~10 2>/dev/null; cp $SRC/solutions/lab-02/.github/agents/reviewer.agent.md .github/agents/ 2>/dev/null; node scripts/catch-up.js 4 --owner x | grep -q 'Removed (retired' && test ! -f .github/agents/reviewer.agent.md; r=\$?; rm -rf /tmp/cu; exit \$r"

echo "== Lab 5"
expect "eval before the fix fails the GC-3 golden case" 1 node scripts/eval-agent.js
grep -q "GC-3: amount 100" eval/results/report.md && ok "report names GC-3 (100 -> got manager)" || bad "report missing GC-3"
copy_from 5 .github/copilot-instructions.md .github/instructions/memory.instructions.md .github/workflows/eval.yml docs/memory/decisions.md
git add -A; git commit -qm "Lab 5 memory + eval"
git checkout -q -b fix/7-inclusive-thresholds
copy_from 5 docs/plans/BUG-7-inclusive-thresholds.md test/policy-boundaries.test.js
expect "reproduce: boundary test fails before the fix" 1 npm test
copy_from 5 src/policy.js docs/progress/BUG-7.md docs/evaluations/BUG-7-root-cause.md
tests_pass "BUG-7 fixed"
expect "eval with plan: all gates and signals pass" 0 node scripts/eval-agent.js --plan docs/plans/BUG-7-inclusive-thresholds.md
grep -q "Score \*\*100%\*\*" eval/results/report.md && ok "score 100%" || { bad "score not 100%"; cat eval/results/report.md; }
echo "// drift" >> src/store.js
node scripts/eval-agent.js --plan docs/plans/BUG-7-inclusive-thresholds.md > /dev/null
grep -q "drift: src/store.js" eval/results/report.md && ok "eval detects drift outside plan scope" || bad "drift not detected"
git checkout -q -- src/store.js
[ "$(wc -l < eval/results/history.jsonl)" -ge 3 ] && ok "history.jsonl keeps a score per run" || bad "history"
git add -A; git commit -qm "BUG-7"
plancheck fix/7-inclusive-thresholds "Closes #7
Plan: docs/plans/BUG-7-inclusive-thresholds.md" 0 "BUG-7 PR"
merge fix/7-inclusive-thresholds

echo "== Lab 6"
copy_from 6 config/agent-policy.json .github/hooks/policy.json
expect "hook denies rm -rf (Copilot payload)" 0 bash -c "node scripts/agent-policy.js --event scripts/fixtures/deny-rm.json | grep -q '\"permissionDecision\":\"deny\"'"
expect "hook denies workflow edit" 0 bash -c "node scripts/agent-policy.js --event scripts/fixtures/deny-workflow-edit.json | grep -q deny"
expect "hook denies force push (Local payload)" 0 bash -c "node scripts/agent-policy.js --event scripts/fixtures/deny-local-format.json | grep -q '\"hookEventName\":\"PreToolUse\"'"
expect "hook allows npm test" 0 bash -c "[ \"\$(node scripts/agent-policy.js --event scripts/fixtures/allow-test.json)\" = '{}' ]"
expect "hook reads stdin too" 0 bash -c "node scripts/agent-policy.js < scripts/fixtures/deny-rm.json | grep -q deny"
expect "hook denies edit of src/policy.js" 0 bash -c "echo '{\"toolName\":\"edit\",\"toolArgs\":\"{\\\"path\\\":\\\"src/policy.js\\\"}\"}' | node scripts/agent-policy.js | grep -q deny"
expect "hook denies shell redirect into protected path" 0 bash -c "echo '{\"toolName\":\"bash\",\"toolArgs\":\"{\\\"command\\\":\\\"echo x > .github/hooks/policy.json\\\"}\"}' | node scripts/agent-policy.js | grep -q deny"
expect "hook allows reading a protected file" 0 bash -c "[ \"\$(echo '{\"toolName\":\"bash\",\"toolArgs\":\"{\\\"command\\\":\\\"cat .github/workflows/ci.yml\\\"}\"}' | node scripts/agent-policy.js)\" = '{}' ]"
expect "hook allows the git/gh commands the labs ask Copilot to run, blocks merge and main pushes" 0 node -e "
const { decide } = require('./scripts/agent-policy');
const p = JSON.parse(require('fs').readFileSync('config/agent-policy.json','utf8'));
const allow = ['git switch main','git pull origin main','git switch -c docs/8-api','git add -A','git add .github/workflows/deploy.yml','git commit -m \\'Lab 6: autonomy levels\\'','git push -u origin chore/lab6-guardrails','gh pr create --base main --title DOCS-8 --body Closes-8','git worktree add ../contoso-feat-5 -b feat/5-category-filter','git status','git diff --name-only main'];
const deny = ['gh pr merge 12 --merge','git push origin main','git push --force origin feat/x','git reset --hard origin/main'];
let bad = allow.filter(c => decide({toolName:'bash',toolArgs:JSON.stringify({command:c})}, p).decision !== 'none');
bad = bad.concat(deny.filter(c => decide({toolName:'bash',toolArgs:JSON.stringify({command:c})}, p).decision !== 'deny'));
if (bad.length) { console.log('unexpected:', bad); process.exit(1); }"
[ "$(wc -l < .agent-audit/hook-log.jsonl)" -ge 8 ] && ok "hook decisions logged to .agent-audit/hook-log.jsonl" || bad "hook log"
git status --porcelain | grep -q agent-audit && bad ".agent-audit not ignored" || ok ".agent-audit is git-ignored"
copy_from 6 .github/workflows/deploy.yml .github/CODEOWNERS docs/governance/autonomy.md docs/governance/readiness.md
git add -A; git commit -qm "Lab 6 guardrails"
git checkout -q -b docs/8-api; copy_from 6 README.md; git add -A; git commit -qm "DOCS-8"
plancheck docs/8-api "Closes #8" 0 "docs-only PR needs no plan (L3 path)"
merge docs/8-api
tests_pass "final"

echo "== Static checks"
expect "actionlint: all workflows (final state)" 0 actionlint .github/workflows/*.yml
for f in $SRC/solutions/lab-0*/.github/workflows/*.yml; do expect "actionlint $(echo $f | sed "s#$SRC/##")" 0 actionlint "$f"; done
for f in $(find .vscode config .github -name '*.json'); do expect "valid JSON: $f" 0 node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))"; done
expect "frontmatter of agents/instructions parses as YAML with required keys" 0 python3 "$SRC/instructor/frontmatter.py" "$W" "$SRC/solutions"
expect "lab snippets valid, match references, no typed git" 0 python3 "$SRC/instructor/check-lab-snippets.py"
expect "catch-up 6 from a fresh starter yields a green suite" 0 bash -c "rm -rf /tmp/fresh && cp -r $SRC /tmp/fresh && cd /tmp/fresh && node scripts/catch-up.js 6 --owner x >/dev/null && npm test >/dev/null 2>&1 && node scripts/eval-agent.js >/dev/null"

echo; echo "RESULT: $PASS passed, $FAIL failed"
