#!/usr/bin/env node
'use strict';

// Creates the lab backlog (docs/backlog.json) as GitHub issues in YOUR repository.
// Requires the GitHub CLI (gh) signed in: gh auth login
//   node scripts/seed-issues.js            create labels and issues
//   node scripts/seed-issues.js --dry-run  print what would be created

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const dry = process.argv.includes('--dry-run');
const backlog = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../docs/backlog.json'), 'utf8'));

function gh(args) {
  if (dry) {
    console.log(`gh ${args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}`);
    return { status: 0, stdout: '' };
  }
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  if (r.error) {
    console.error('Could not run "gh". Install the GitHub CLI or create the issues by hand from docs/backlog.json.');
    process.exit(1);
  }
  return r;
}

const labels = [...new Set(backlog.flatMap((i) => i.labels))];
for (const l of labels) gh(['label', 'create', l, '--force', '--color', l.startsWith('lab') ? '0E8A16' : '1D76DB']);

const existing = dry ? '' : gh(['issue', 'list', '--state', 'all', '--limit', '200', '--json', 'title', '--jq', '.[].title']).stdout;
for (const issue of backlog) {
  if (existing.includes(issue.title)) {
    console.log(`skip (exists): ${issue.title}`);
    continue;
  }
  const r = gh(['issue', 'create', '--title', issue.title, '--body', issue.body, ...issue.labels.flatMap((l) => ['--label', l])]);
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  if (!dry) console.log(`created: ${r.stdout.trim()}  ${issue.title}`);
}
