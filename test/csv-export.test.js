'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/server');

async function withServer(fn) {
  const { server } = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function createExpense(url, expense) {
  const response = await fetch(`${url}/expenses`, {
    method: 'POST',
    body: JSON.stringify(expense),
  });
  assert.equal(response.status, 201);
}

test('FEAT-3: empty CSV export returns only the header', () => withServer(async (url) => {
  const response = await fetch(`${url}/expenses.csv`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/csv; charset=utf-8');
  assert.equal(await response.text(), 'id,employee,date,category,amount,status,route\n');
}));

test('FEAT-3: CSV export preserves order, formats amounts, and escapes values', () => withServer(async (url) => {
  await createExpense(url, {
    employee: 'Finance, "North"\nTeam',
    amount: 42.5,
    category: 'travel',
    date: '2026-01-10',
  });
  await createExpense(url, {
    employee: 'Avery',
    amount: 75,
    category: 'travel',
    date: '2026-01-11',
  });

  const response = await fetch(`${url}/expenses.csv`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/csv; charset=utf-8');
  assert.equal(await response.text(), [
    'id,employee,date,category,amount,status,route',
    'exp-0001,"Finance, ""North""',
    'Team",2026-01-10,travel,42.50,approved,auto',
    'exp-0002,Avery,2026-01-11,travel,75.00,approved,auto',
    '',
  ].join('\n'));
}));
