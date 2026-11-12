'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { withServer, post } = require('./helpers');

test('FEAT-6: limit, offset and x-total-count', () => withServer(async (url) => {
  for (let i = 1; i <= 5; i++) await post(url, { employee: `e${i}`, amount: i, category: 'supplies', date: '2026-01-10' });
  const res = await fetch(`${url}/expenses?limit=2&offset=1`);
  assert.equal(res.headers.get('x-total-count'), '5');
  assert.deepEqual((await res.json()).map((e) => e.employee), ['e2', 'e3']);
}));

test('FEAT-6: defaults and cap', () => withServer(async (url) => {
  await post(url, { employee: 'a', amount: 1, category: 'supplies', date: '2026-01-10' });
  const res = await fetch(`${url}/expenses?limit=1000`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).length, 1);
}));

test('FEAT-6: invalid values return the contract error', () => withServer(async (url) => {
  for (const q of ['limit=-1', 'offset=abc', 'limit=1.5']) {
    const res = await fetch(`${url}/expenses?${q}`);
    assert.equal(res.status, 400, q);
    assert.deepEqual(await res.json(), { errors: ['limit and offset must be non-negative integers'] });
  }
}));

test('FEAT-5 + FEAT-6: filter then paginate', () => withServer(async (url) => {
  for (let i = 1; i <= 3; i++) await post(url, { employee: `m${i}`, amount: 10, category: 'meals', date: '2026-01-10' });
  await post(url, { employee: 's', amount: 10, category: 'supplies', date: '2026-01-10' });
  const res = await fetch(`${url}/expenses?category=meals&limit=2`);
  assert.equal(res.headers.get('x-total-count'), '3');
  assert.equal((await res.json()).length, 2);
}));
