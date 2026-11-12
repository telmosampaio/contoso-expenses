'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { withServer, post } = require('./helpers');

test('FEAT-5: filter by category', () => withServer(async (url) => {
  await post(url, { employee: 'ana', amount: 20, category: 'supplies', date: '2026-01-10' });
  await post(url, { employee: 'ana', amount: 30, category: 'meals', date: '2026-01-10' });
  const meals = await (await fetch(`${url}/expenses?category=meals`)).json();
  assert.deepEqual(meals.map((e) => e.category), ['meals']);
  const all = await (await fetch(`${url}/expenses`)).json();
  assert.equal(all.length, 2);
}));

test('FEAT-5: unknown category returns the contract error', () => withServer(async (url) => {
  const res = await fetch(`${url}/expenses?category=golf`);
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { errors: ['unknown category: golf'] });
}));
