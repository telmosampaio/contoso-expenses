'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createAuditLog } = require('../src/audit');
const { withServer, post } = require('./helpers');

test('FEAT-4: audit log is append-only and newest first', () => {
  const log = createAuditLog();
  log.record({ expenseId: 'exp-0001', route: 'auto' });
  log.record({ expenseId: 'exp-0002', route: 'manager' });
  const list = log.list();
  assert.deepEqual(list.map((e) => e.expenseId), ['exp-0002', 'exp-0001']);
  assert.equal(list[0].decidedBy, 'policy-engine');
  assert.ok(!Number.isNaN(Date.parse(list[0].at)));
  assert.throws(() => { 'use strict'; list[0].route = 'auto'; });
  assert.equal(typeof log.update, 'undefined');
  assert.equal(typeof log.delete, 'undefined');
});

test('FEAT-4: every successful POST is audited; GET /audit lists newest first', () => withServer(async (url) => {
  await post(url, { employee: 'ana', amount: 20, category: 'supplies', date: '2026-01-10' });
  await post(url, { employee: 'bo', amount: 500, category: 'travel', date: '2026-01-10', receiptId: 'R-1' });
  await post(url, { amount: -1 }); // invalid: not audited
  const res = await fetch(`${url}/audit`);
  assert.equal(res.status, 200);
  const entries = await res.json();
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((e) => [e.expenseId, e.route]), [['exp-0002', 'manager'], ['exp-0001', 'auto']]);
}));
