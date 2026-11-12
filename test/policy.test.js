'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { approvalRoute, statusForRoute } = require('../src/policy');

test('small expenses are auto-approved', () => {
  assert.equal(approvalRoute({ amount: 50 }), 'auto');
});

test('mid-size expenses go to a manager', () => {
  assert.equal(approvalRoute({ amount: 500 }), 'manager');
});

test('large expenses go to finance', () => {
  assert.equal(approvalRoute({ amount: 5000 }), 'finance');
});

test('status follows the route', () => {
  assert.equal(statusForRoute('auto'), 'approved');
  assert.equal(statusForRoute('manager'), 'pending_approval');
});
