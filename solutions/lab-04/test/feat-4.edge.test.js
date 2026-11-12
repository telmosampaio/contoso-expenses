'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { withServer, post } = require('./helpers');

test('FEAT-4 edge: GET /audit on an empty log returns []', () => withServer(async (url) => {
  assert.deepEqual(await (await fetch(`${url}/audit`)).json(), []);
}));

test('FEAT-4 edge: audit API has no write routes', () => withServer(async (url) => {
  await post(url, { employee: 'ana', amount: 20, category: 'supplies', date: '2026-01-10' });
  for (const method of ['POST', 'PUT', 'DELETE']) {
    assert.equal((await fetch(`${url}/audit`, { method })).status, 404, method);
  }
}));
