'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { toCsv, escapeCsv } = require('../src/csv');
const { createApp } = require('../src/server');

const HEADER = 'id,employee,date,category,amount,status,route';

test('FEAT-3: empty store returns only the header line', () => {
  assert.equal(toCsv([]), `${HEADER}\n`);
});

test('FEAT-3: amounts always have 2 decimals', () => {
  const csv = toCsv([{ id: 'exp-0001', employee: 'ana', date: '2026-01-10', category: 'travel', amount: 42.5, status: 'approved', route: 'auto' }]);
  assert.equal(csv.split('\n')[1], 'exp-0001,ana,2026-01-10,travel,42.50,approved,auto');
});

test('FEAT-3: commas, quotes and newlines are escaped per RFC 4180', () => {
  assert.equal(escapeCsv('Smith, Jo'), '"Smith, Jo"');
  assert.equal(escapeCsv('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCsv('a\nb'), '"a\nb"');
});

test('FEAT-3: GET /expenses.csv', async () => {
  const { server } = createApp();
  await new Promise((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    await fetch(`${url}/expenses`, { method: 'POST', body: JSON.stringify({ employee: 'Smith, Jo', amount: 12, category: 'supplies', date: '2026-01-10' }) });
    const res = await fetch(`${url}/expenses.csv`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/csv; charset=utf-8');
    const lines = (await res.text()).split('\n');
    assert.equal(lines[0], HEADER);
    assert.equal(lines[1], 'exp-0001,"Smith, Jo",2026-01-10,supplies,12.00,approved,auto');
  } finally {
    await new Promise((r) => server.close(r));
  }
});
