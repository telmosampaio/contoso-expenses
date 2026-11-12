'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateExpense, normalizeExpense, ValidationError } = require('../src/expenses');

const today = new Date('2026-06-15T12:00:00Z');
const base = { employee: 'ana', amount: 42.5, category: 'travel', date: '2026-06-01' };

test('accepts a valid expense', () => {
  assert.deepEqual(validateExpense(base, { today }), { valid: true, errors: [] });
});

test('rejects missing employee', () => {
  const r = validateExpense({ ...base, employee: ' ' }, { today });
  assert.equal(r.valid, false);
  assert.ok(r.errors.includes('employee is required'));
});

test('rejects non-positive and over-precise amounts', () => {
  assert.equal(validateExpense({ ...base, amount: 0 }, { today }).valid, false);
  assert.equal(validateExpense({ ...base, amount: -5 }, { today }).valid, false);
  const r = validateExpense({ ...base, amount: 10.123 }, { today });
  assert.ok(r.errors.includes('amount must have at most 2 decimal places'));
});

test('rejects unknown categories', () => {
  const r = validateExpense({ ...base, category: 'golf' }, { today });
  assert.equal(r.valid, false);
});

test('rejects bad and future dates', () => {
  assert.equal(validateExpense({ ...base, date: '2026-02-30' }, { today }).valid, false);
  const r = validateExpense({ ...base, date: '2026-07-01' }, { today });
  assert.ok(r.errors.includes('date cannot be in the future'));
});

test('normalizeExpense throws ValidationError with all errors', () => {
  assert.throws(() => normalizeExpense({}, { today }), (err) => {
    assert.ok(err instanceof ValidationError);
    assert.ok(err.errors.length >= 3);
    return true;
  });
});
