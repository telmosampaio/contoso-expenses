'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { approvalRoute } = require('../src/policy');

const cases = [
  [0.01, 'auto'],
  [99.99, 'auto'],
  [100, 'auto'], // FR-3 inclusive
  [100.01, 'manager'],
  [1000, 'manager'], // FR-4 inclusive
  [1000.01, 'finance'],
];

for (const [amount, route] of cases) {
  test(`BUG-7: ${amount.toFixed(2)} routes to ${route}`, () => {
    assert.equal(approvalRoute({ amount }), route);
  });
}
