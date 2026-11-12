'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/server');

async function withServer(fn) {
  const { server } = createApp();
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const valid = { employee: 'ana', amount: 42.5, category: 'travel', date: '2026-01-10' };

test('GET /health', () => withServer(async (url) => {
  const res = await fetch(`${url}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
}));

test('POST /expenses creates and routes an expense', () => withServer(async (url) => {
  const res = await fetch(`${url}/expenses`, { method: 'POST', body: JSON.stringify(valid) });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.match(body.id, /^exp-\d{4}$/);
  assert.equal(body.route, 'auto');
  assert.equal(body.status, 'approved');
}));

test('POST /expenses rejects invalid input', () => withServer(async (url) => {
  const res = await fetch(`${url}/expenses`, { method: 'POST', body: JSON.stringify({ amount: -1 }) });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).errors.length > 0);
}));

test('POST /expenses rejects malformed JSON', () => withServer(async (url) => {
  const res = await fetch(`${url}/expenses`, { method: 'POST', body: '{nope' });
  assert.equal(res.status, 400);
}));

test('GET /expenses and /expenses/:id', () => withServer(async (url) => {
  const created = await (await fetch(`${url}/expenses`, { method: 'POST', body: JSON.stringify(valid) })).json();
  const list = await (await fetch(`${url}/expenses`)).json();
  assert.equal(list.length, 1);
  const one = await fetch(`${url}/expenses/${created.id}`);
  assert.equal(one.status, 200);
  assert.equal((await fetch(`${url}/expenses/exp-9999`)).status, 404);
}));
