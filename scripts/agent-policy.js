#!/usr/bin/env node
'use strict';

// preToolUse policy hook (Lab 6).
//
// Reads one hook event as JSON on stdin and prints a decision as JSON on stdout.
// Works with both payload shapes VS Code can send:
//   Copilot harness (default):  { toolName, toolArgs }   toolArgs may be a JSON string
//   Local harness (legacy):     { tool_name, tool_input }
// Rules come from config/agent-policy.json (override with AGENT_POLICY_CONFIG).
// Every decision is appended to .agent-audit/hook-log.jsonl for traceability.
//
// Try it:  node scripts/agent-policy.js --event scripts/fixtures/deny-rm.json

const fs = require('node:fs');
const path = require('node:path');
const { matchesAny, toPosix } = require('./lib/glob');

const SHELL_TOOL = /bash|powershell|shell|terminal|execute|run_in_terminal/i;
const WRITE_TOOL = /edit|create|write|replace|insert|patch|delete|rename|move/i;
const SHELL_WRITE = /(>|\brm\b|\bmv\b|\bcp\b|\btee\b|sed\s+-i|\btruncate\b|Remove-Item|Set-Content|Out-File)/i;

function readInput() {
  // --event <file> lets you test the hook without shell redirection (works in PowerShell too).
  const i = process.argv.indexOf('--event');
  if (i > -1) return fs.readFileSync(process.argv[i + 1], 'utf8');
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

function relative(p, cwd) {
  const posix = toPosix(p);
  const c = toPosix(cwd || process.cwd()).replace(/\/$/, '');
  return posix.startsWith(`${c}/`) ? posix.slice(c.length + 1) : posix;
}

function decide(event, policy) {
  const tool = String(event.toolName || event.tool_name || '');
  const args = parseMaybeJson(event.toolArgs !== undefined ? event.toolArgs : event.tool_input);
  const values = strings(args);
  const cwd = event.cwd || process.cwd();

  if (SHELL_TOOL.test(tool)) {
    for (const v of values) {
      for (const pattern of policy.denyCommands || []) {
        if (new RegExp(pattern, 'i').test(v)) {
          return { decision: 'deny', reason: `Blocked by agent policy: command matches "${pattern}". Ask a human to run it if it is really needed.` };
        }
      }
      const touchesProtected = (policy.protectedPaths || []).some((g) => {
        const prefix = g.replace(/\*\*.*$/, '').replace(/\*.*$/, '');
        return prefix && v.includes(prefix);
      });
      if (touchesProtected && SHELL_WRITE.test(v)) {
        return { decision: 'deny', reason: 'Blocked by agent policy: shell command writes to a protected path. Protected paths need a human change and code-owner review.' };
      }
    }
  }

  if (WRITE_TOOL.test(tool)) {
    for (const v of values) {
      if (v.length > 300 || v.includes('\n')) continue; // file contents, not a path
      const rel = relative(v, cwd);
      if (matchesAny(rel, policy.protectedPaths || [])) {
        return { decision: 'deny', reason: `Blocked by agent policy: "${rel}" is a protected path. Open an issue and ask a code owner to make this change.` };
      }
    }
  }
  return { decision: 'none' };
}

function main() {
  const configPath = process.env.AGENT_POLICY_CONFIG || path.resolve(__dirname, '../config/agent-policy.json');
  let policy = {};
  try { policy = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { /* no policy: allow */ }

  let event = {};
  try { event = JSON.parse(readInput() || '{}'); } catch { event = {}; }
  const { decision, reason } = decide(event, policy);

  const logDir = process.env.AGENT_AUDIT_DIR || path.resolve(__dirname, '../.agent-audit');
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'hook-log.jsonl'), `${JSON.stringify({
      at: new Date().toISOString(), tool: event.toolName || event.tool_name || null, decision, reason: reason || null,
    })}\n`);
  } catch { /* logging must never break the agent */ }

  if (decision === 'deny') {
    process.stdout.write(JSON.stringify({
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
    }));
  } else {
    process.stdout.write('{}'); // no decision: normal approvals apply
  }
}

if (require.main === module) main();
module.exports = { decide };
