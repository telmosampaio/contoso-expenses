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

const valid = { employee: 'ana', amount: 60, category: 'meals', date: '2026-01-10' };
const justificationError = 'justification is required for meals over 60.00';

async function postExpense(url, expense) {
  return fetch(`${url}/expenses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(expense),
  });
}

test('POST /expenses accepts a meal of exactly 60.00 without a justification', () => withServer(async (url) => {
  const res = await postExpense(url, valid);
  assert.equal(res.status, 201);
  assert.equal((await res.json()).justification, undefined);
}));

test('POST /expenses requires a justification for a meal over 60.00', () => withServer(async (url) => {
  const res = await postExpense(url, { ...valid, amount: 60.01 });
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).errors, [justificationError]);
}));

test('POST /expenses rejects invalid meal justifications', () => withServer(async (url) => {
  for (const justification of [42, '       ', '123456789']) {
    const res = await postExpense(url, { ...valid, amount: 60.01, justification });
    assert.equal(res.status, 400);
    assert.deepEqual((await res.json()).errors, [justificationError]);
  }
}));

test('POST /expenses stores a meal justification with 10 trimmed characters', () => withServer(async (url) => {
  const justification = ' 1234567890 ';
  const res = await postExpense(url, { ...valid, amount: 60.01, justification });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).justification, justification);
}));

test('POST /expenses does not require a justification for other categories', () => withServer(async (url) => {
  const res = await postExpense(url, {
    ...valid,
    amount: 70,
    category: 'travel',
  });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).justification, undefined);
}));

test('POST /expenses validates meal justifications independently of receipts', () => withServer(async (url) => {
  const meal = { ...valid, amount: 80 };
  const withoutEither = await postExpense(url, meal);
  assert.equal(withoutEither.status, 400);
  assert.deepEqual((await withoutEither.json()).errors, [
    'receiptId is required for expenses over 75.00',
    justificationError,
  ]);

  const withoutJustification = await postExpense(url, { ...meal, receiptId: 'receipt-123' });
  assert.equal(withoutJustification.status, 400);
  assert.deepEqual((await withoutJustification.json()).errors, [justificationError]);

  const justification = 'business dinner';
  const withBoth = await postExpense(url, {
    ...meal,
    receiptId: 'receipt-123',
    justification,
  });
  assert.equal(withBoth.status, 201);
  const record = await withBoth.json();
  assert.equal(record.receiptId, 'receipt-123');
  assert.equal(record.justification, justification);
}));
