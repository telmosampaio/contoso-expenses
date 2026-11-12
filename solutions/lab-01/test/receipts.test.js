'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateExpense, normalizeExpense } = require('../src/expenses');

const today = new Date('2026-06-15T12:00:00Z');
const base = { employee: 'ana', category: 'travel', date: '2026-06-01' };
const MSG = 'receiptId is required for expenses over 75.00';

test('FEAT-1: exactly 75.00 needs no receipt', () => {
  assert.equal(validateExpense({ ...base, amount: 75 }, { today }).valid, true);
});

test('FEAT-1: 75.01 without receipt is rejected with the contract message', () => {
  const r = validateExpense({ ...base, amount: 75.01 }, { today });
  assert.equal(r.valid, false);
  assert.ok(r.errors.includes(MSG));
});

test('FEAT-1: empty receiptId is rejected', () => {
  assert.ok(validateExpense({ ...base, amount: 200, receiptId: '  ' }, { today }).errors.includes(MSG));
});

test('FEAT-1: receiptId is stored when present', () => {
  const e = normalizeExpense({ ...base, amount: 200, receiptId: 'R-123' }, { today });
  assert.equal(e.receiptId, 'R-123');
});
