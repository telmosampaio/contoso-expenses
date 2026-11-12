'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateExpense, normalizeExpense } = require('../src/expenses');

const today = new Date('2026-06-15T12:00:00Z');
const meal = { employee: 'ana', category: 'meals', date: '2026-06-01' };
const MSG = 'justification is required for meals over 60.00';

test('FEAT-2: exactly 60.00 meal needs no justification', () => {
  assert.equal(validateExpense({ ...meal, amount: 60 }, { today }).valid, true);
});

test('FEAT-2: 60.01 meal without justification is rejected', () => {
  assert.ok(validateExpense({ ...meal, amount: 60.01 }, { today }).errors.includes(MSG));
});

test('FEAT-2: justification shorter than 10 characters is rejected', () => {
  assert.ok(validateExpense({ ...meal, amount: 70, justification: ' too short ' }, { today }).errors.includes(MSG));
});

test('FEAT-2: other categories are not affected', () => {
  assert.equal(validateExpense({ ...meal, category: 'supplies', amount: 70 }, { today }).valid, true);
});

test('FEAT-2: an 80.00 meal needs both receipt and justification', () => {
  const r = validateExpense({ ...meal, amount: 80 }, { today });
  assert.ok(r.errors.includes(MSG));
  assert.ok(r.errors.includes('receiptId is required for expenses over 75.00'));
});

test('FEAT-2: justification is stored', () => {
  const e = normalizeExpense({ ...meal, amount: 70, justification: 'Client dinner, 3 people' }, { today });
  assert.equal(e.justification, 'Client dinner, 3 people');
});
