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

const valid = { employee: 'ana', amount: 75, category: 'travel', date: '2026-01-10' };

test('POST /expenses accepts exactly 75.00 without a receipt', () => withServer(async (url) => {
  const res = await fetch(`${url}/expenses`, { method: 'POST', body: JSON.stringify(valid) });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).receiptId, undefined);
}));

test('POST /expenses requires a receipt at 75.01', () => withServer(async (url) => {
  const res = await fetch(`${url}/expenses`, {
    method: 'POST',
    body: JSON.stringify({ ...valid, amount: 75.01 }),
  });
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).errors, [
    'receiptId is required for expenses over 75.00',
  ]);
}));

test('POST /expenses stores a supplied receiptId for expenses over 75.00', () => withServer(async (url) => {
  const receiptId = 'receipt-123';
  const res = await fetch(`${url}/expenses`, {
    method: 'POST',
    body: JSON.stringify({ ...valid, amount: 75.01, receiptId }),
  });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).receiptId, receiptId);
}));

test('POST /expenses rejects an empty receiptId for expenses over 75.00', () => withServer(async (url) => {
  const res = await fetch(`${url}/expenses`, {
    method: 'POST',
    body: JSON.stringify({ ...valid, amount: 75.01, receiptId: '' }),
  });
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).errors, [
    'receiptId is required for expenses over 75.00',
  ]);
}));
