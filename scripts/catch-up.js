#!/usr/bin/env node
'use strict';

// Copy the reference solution files for labs 1..N into the working tree so you can
// continue with lab N+1 if you fell behind or your agent's output went off track.
//
//   node scripts/catch-up.js 3 --owner your-github-login
//
// --owner replaces the @OWNER placeholder (CODEOWNERS, plans, agent files).
// Review the changes with "git status" / "git diff", then commit them on a branch.

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const upTo = Number(process.argv[2]);
const ownerIdx = process.argv.indexOf('--owner');
const owner = ownerIdx > -1 ? process.argv[ownerIdx + 1] : null;

if (!Number.isInteger(upTo) || upTo < 1 || upTo > 6) {
  console.error('usage: node scripts/catch-up.js <1-6> [--owner <github-login>]');
  process.exit(1);
}

function copyDir(src, dest, copied) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d, copied);
    } else if (entry.name === 'REMOVE.txt' && path.basename(src).startsWith('lab-')) {
      for (const rel of fs.readFileSync(s, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
        const target = path.join(root, rel);
        if (fs.existsSync(target)) {
          fs.rmSync(target);
          removed.push(rel);
        }
      }
    } else {
      let content = fs.readFileSync(s);
      if (owner) content = Buffer.from(content.toString('utf8').replace(/@OWNER\b/g, `@${owner.replace(/^@/, '')}`));
      fs.writeFileSync(d, content);
      copied.push(path.relative(root, d));
    }
  }
}

const copied = [];
const removed = [];
for (let lab = 1; lab <= upTo; lab++) {
  const dir = path.join(root, 'solutions', `lab-0${lab}`);
  if (fs.existsSync(dir)) copyDir(dir, root, copied);
}
const unique = [...new Set(copied)].sort();
console.log(`Copied ${unique.length} file(s) from solutions/lab-01..lab-0${upTo}:`);
unique.forEach((f) => console.log(`  ${f}`));
if (removed.length) console.log(`Removed (retired in the labs): ${removed.join(', ')}`);
if (!owner) console.log('\nTip: pass --owner <your-github-login> to fill in the @OWNER placeholders.');
