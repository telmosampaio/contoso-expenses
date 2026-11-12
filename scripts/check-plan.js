#!/usr/bin/env node
'use strict';

// Plan gate used by .github/workflows/plan-check.yml (and runnable locally).
//
// Local:  node scripts/check-plan.js --plan docs/plans/FEAT-1-receipt-required.md
// CI:     PR_BODY, BASE_SHA and HEAD_SHA come from the workflow environment.
//
// Rules
//  1. A plan is required only when the PR changes product code: files matching
//     "planRequiredPaths" in config/agent-policy.json (default src/** and test/**).
//     Configuration (.github/, config/) is governed by CODEOWNERS instead; docs need neither.
//  2. Then the PR body must contain a line "Plan: docs/plans/<file>.md".
//  3. The plan must have all required sections, "Status: Approved" and "Approved-by: @user".
//  4. Every changed product-code file must be listed under "## Files in scope" (scope adherence).

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { validatePlan } = require('./lib/plan');
const { matchesAny } = require('./lib/glob');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function loadPolicy() {
  const file = process.env.AGENT_POLICY_CONFIG || 'config/agent-policy.json';
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function changedFiles() {
  const { BASE_SHA, HEAD_SHA } = process.env;
  if (!BASE_SHA || !HEAD_SHA) return null;
  const out = execFileSync('git', ['diff', '--name-only', `${BASE_SHA}...${HEAD_SHA}`], { encoding: 'utf8' });
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

function summary(lines) {
  const text = lines.join('\n');
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
}

function main() {
  const policy = loadPolicy();
  const files = changedFiles();
  const planRequired = policy.planRequiredPaths || ['src/**', 'test/**'];

  if (files && !files.some((f) => matchesAny(f, planRequired))) {
    summary(['## Plan check: PASS (no product code changed)', '',
      `None of the ${files.length} changed file(s) match planRequiredPaths (${planRequired.join(', ')}). No plan required; CODEOWNERS review still applies.`]);
    return 0;
  }

  let planPath = arg('--plan');
  if (!planPath) {
    const m = (process.env.PR_BODY || '').match(/^\s*Plan:\s*`?([^\s`]+)`?/mi);
    planPath = m && m[1];
  }
  if (!planPath) {
    summary(['## Plan check: FAIL', '', 'No plan referenced. Add a line like `Plan: docs/plans/FEAT-1-receipt-required.md` to the PR description.']);
    return 1;
  }
  if (!fs.existsSync(planPath)) {
    summary(['## Plan check: FAIL', '', `Plan file \`${planPath}\` does not exist on this branch.`]);
    return 1;
  }

  const { plan, problems } = validatePlan(fs.readFileSync(planPath, 'utf8'));

  if (files) {
    const outOfScope = files.filter((f) => matchesAny(f, planRequired) && !matchesAny(f, plan.scope));
    for (const f of outOfScope) problems.push(`changed file \`${f}\` is not listed under "## Files in scope"`);
  }

  if (problems.length) {
    summary(['## Plan check: FAIL', '', `Plan: \`${planPath}\``, '', ...problems.map((p) => `- ${p}`)]);
    return 1;
  }
  summary(['## Plan check: PASS', '', `Plan: \`${planPath}\``, `Approved by: ${plan.approvedBy}`,
    `Files in scope: ${plan.scope.map((s) => `\`${s}\``).join(', ')}`]);
  return 0;
}

process.exitCode = main();
