#!/usr/bin/env node
'use strict';

// Agent evaluation scorecard (Lab 5).
//
//   npm run eval                                   # tests + golden cases + secrets scan
//   npm run eval -- --plan docs/plans/BUG-7.md     # also plan validity + scope adherence vs main
//   npm run eval -- --plan <file> --base <branch>  # compare scope against another base
//
// Writes eval/results/report.md and report.json and appends one line to eval/results/history.jsonl.
// Exit code 1 when a hard gate (tests, golden cases, secrets) fails.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');
const { validatePlan } = require('./lib/plan');
const { matchesAny } = require('./lib/glob');

const root = path.resolve(__dirname, '..');
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
const planPath = arg('--plan');
const base = arg('--base') || 'main';
const checks = [];
let policy = {};
try { policy = JSON.parse(fs.readFileSync(path.join(root, 'config/agent-policy.json'), 'utf8')); } catch { /* defaults */ }
const planRequired = policy.planRequiredPaths || ['src/**', 'test/**'];
const add = (name, kind, pass, detail) => checks.push({ name, kind, pass, detail });

// 1. Unit tests (quantitative: pass/fail counts)
const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'test/**/*.test.js'], { cwd: root, encoding: 'utf8' });
const num = (k) => Number(((run.stdout || '').match(new RegExp(`^# ${k} (\\d+)`, 'm')) || [])[1] || 0);
add('Unit tests pass', 'gate', run.status === 0, `${num('pass')} passed, ${num('fail')} failed`);

// 2. Golden cases from the specification (eval/cases.json)
const cases = JSON.parse(fs.readFileSync(path.join(root, 'eval/cases.json'), 'utf8'));
delete require.cache[require.resolve(path.join(root, 'src/policy.js'))];
const { approvalRoute } = require(path.join(root, 'src/policy.js'));
const failedCases = cases.filter((c) => approvalRoute({ amount: c.amount }) !== c.expectedRoute);
add('Spec golden cases', 'gate', failedCases.length === 0,
  failedCases.length
    ? failedCases.map((c) => `${c.id}: amount ${c.amount} -> got "${approvalRoute({ amount: c.amount })}", expected "${c.expectedRoute}" (${c.requirement})`).join('; ')
    : `${cases.length}/${cases.length} cases match docs/requirements.md`);

// Changed files vs base (committed + uncommitted + untracked)
function git(args) {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; }
}
let changed = null;
const mergeBase = git(['merge-base', base, 'HEAD']);
if (mergeBase) {
  const diff = git(['diff', '--name-only', mergeBase.trim()]) || '';
  const untracked = git(['ls-files', '--others', '--exclude-standard']) || '';
  changed = [...new Set(`${diff}\n${untracked}`.split('\n').map((s) => s.trim()).filter(Boolean))]
    .filter((f) => !f.startsWith('eval/results/'));
}

// 3. Secrets scan of changed files (policy compliance)
const secretPatterns = [/ghp_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/, /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
const leaks = (changed || []).filter((f) => {
  const p = path.join(root, f);
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) return false;
  const t = fs.readFileSync(p, 'utf8');
  return secretPatterns.some((re) => re.test(t));
});
add('No secrets in changed files', 'gate', leaks.length === 0, leaks.length ? `possible secret in: ${leaks.join(', ')}` : `${(changed || []).length} changed file(s) scanned`);

// 4. Plan validity and scope adherence (process signals)
if (planPath) {
  if (!fs.existsSync(path.join(root, planPath))) {
    add('Plan is valid and approved', 'signal', false, `${planPath} not found`);
  } else {
    const { plan, problems } = validatePlan(fs.readFileSync(path.join(root, planPath), 'utf8'));
    add('Plan is valid and approved', 'signal', problems.length === 0, problems.length ? problems.join('; ') : `approved by ${plan.approvedBy}`);
    if (changed) {
      const out = changed.filter((f) => matchesAny(f, planRequired) && !matchesAny(f, plan.scope));
      add('Changes stay inside plan scope', 'signal', out.length === 0,
        out.length ? `drift: ${out.join(', ')}` : `${changed.length} changed file(s), all in scope`);
    }
  }
}

// Report
const passed = checks.filter((c) => c.pass).length;
const score = Math.round((passed / checks.length) * 100);
const gatesOk = checks.filter((c) => c.kind === 'gate').every((c) => c.pass);
const result = { at: new Date().toISOString(), commit: (git(['rev-parse', '--short', 'HEAD']) || '').trim(), plan: planPath || null, score, gatesOk, checks };

const outDir = path.join(root, 'eval/results');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(result, null, 2));
fs.appendFileSync(path.join(outDir, 'history.jsonl'), `${JSON.stringify({ at: result.at, commit: result.commit, plan: result.plan, score, gatesOk })}\n`);
const md = [
  `# Agent evaluation scorecard`,
  '',
  `Commit \`${result.commit || 'n/a'}\` · Score **${score}%** · Hard gates ${gatesOk ? 'PASS' : 'FAIL'}`,
  '',
  '| Check | Type | Result | Detail |',
  '| --- | --- | --- | --- |',
  ...checks.map((c) => `| ${c.name} | ${c.kind} | ${c.pass ? 'PASS' : 'FAIL'} | ${String(c.detail).replace(/\|/g, '\\|')} |`),
  '',
].join('\n');
fs.writeFileSync(path.join(outDir, 'report.md'), md);
console.log(md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
process.exitCode = gatesOk ? 0 : 1;
