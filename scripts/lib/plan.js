'use strict';

const fs = require('node:fs');

const REQUIRED_SECTIONS = ['Goal', 'Files in scope', 'Steps', 'Tests', 'Risks', 'Success criteria'];

/** Parse a plan file written from docs/plans/TEMPLATE.md. */
function parsePlan(text) {
  const field = (name) => {
    const m = text.match(new RegExp(`^${name}:[ \\t]*(.*)$`, 'mi'));
    return m ? m[1].trim() : '';
  };
  const sections = {};
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      current = h[1];
      sections[current] = [];
    } else if (current) {
      sections[current].push(line);
    }
  }
  const scope = (sections['Files in scope'] || [])
    .map((l) => l.match(/^\s*[-*]\s+`?([^`\s]+)`?/))
    .filter(Boolean)
    .map((m) => m[1]);
  return {
    status: field('Status'),
    approvedBy: field('Approved-by'),
    issue: field('Issue'),
    sections,
    scope,
  };
}

/** Return a list of problems; an empty list means the plan is approvable/approved. */
function validatePlan(text, { requireApproval = true } = {}) {
  const plan = parsePlan(text);
  const problems = [];
  for (const s of REQUIRED_SECTIONS) {
    const body = (plan.sections[s] || []).join('\n').replace(/<!--[\s\S]*?-->/g, '').trim();
    if (!body) problems.push(`section "## ${s}" is missing or empty`);
  }
  if (plan.scope.length === 0) problems.push('"## Files in scope" must list at least one path as a bullet');
  if (requireApproval) {
    if (!/^approved$/i.test(plan.status)) problems.push(`Status must be "Approved" (found "${plan.status || 'none'}")`);
    if (!/^@[\w-]+/.test(plan.approvedBy)) problems.push('Approved-by must name a GitHub user, e.g. "Approved-by: @octocat"');
  }
  return { plan, problems };
}

function readPlan(path) {
  return fs.readFileSync(path, 'utf8');
}

module.exports = { REQUIRED_SECTIONS, parsePlan, validatePlan, readPlan };
