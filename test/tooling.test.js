'use strict';

// Tests for the lab tooling in scripts/. Keep these green: later labs depend on them.

const test = require('node:test');
const assert = require('node:assert/strict');
const { decide } = require('../scripts/agent-policy');
const { validatePlan } = require('../scripts/lib/plan');
const { matchesAny } = require('../scripts/lib/glob');

const policy = {
  denyCommands: ['rm\\s+-rf', 'git\\s+push\\s+(-f|--force)'],
  protectedPaths: ['.github/workflows/**', 'config/agent-policy.json'],
};

test('glob matching', () => {
  assert.ok(matchesAny('.github/workflows/ci.yml', ['.github/workflows/**']));
  assert.ok(matchesAny('src/a.js', ['src/*.js']));
  assert.ok(!matchesAny('src/lib/a.js', ['src/*.js']));
  assert.ok(matchesAny('README.md', ['**/*.md']));
});

test('hook denies destructive shell commands (Copilot payload, string args)', () => {
  const r = decide({ toolName: 'bash', toolArgs: JSON.stringify({ command: 'rm -rf docs' }) }, policy);
  assert.equal(r.decision, 'deny');
});

test('hook denies edits to protected paths (Local payload)', () => {
  const r = decide({ tool_name: 'replace_string_in_file', cwd: '/w', tool_input: { filePath: '/w/.github/workflows/ci.yml' } }, policy);
  assert.equal(r.decision, 'deny');
});

test('hook allows normal work', () => {
  assert.equal(decide({ toolName: 'bash', toolArgs: { command: 'npm test' } }, policy).decision, 'none');
  assert.equal(decide({ toolName: 'edit', toolArgs: { path: 'src/policy.js' } }, policy).decision, 'none');
  assert.equal(decide({ toolName: 'view', toolArgs: { path: '.github/workflows/ci.yml' } }, policy).decision, 'none');
});

test('plan validation requires sections and approval', () => {
  const draft = '# Plan\nStatus: Draft\n## Goal\nx\n## Files in scope\n- src/a.js\n## Steps\n1. x\n## Tests\nx\n## Risks\nx\n## Success criteria\nx\n';
  assert.ok(validatePlan(draft).problems.length > 0);
  const approved = draft.replace('Status: Draft', 'Status: Approved\nApproved-by: @octocat');
  assert.deepEqual(validatePlan(approved).problems, []);
});
