'use strict';

// Expense validation and normalization for the Contoso Expense Service.
// Business rules live in docs/requirements.md. Keep this module free of I/O.

const CATEGORIES = ['travel', 'meals', 'lodging', 'supplies', 'software'];
const RECEIPT_THRESHOLD = 75; // FEAT-1: amounts strictly above this need a receipt
const MEAL_PER_DIEM = 60; // FEAT-2: meals strictly above this need a justification

class ValidationError extends Error {
  constructor(errors) {
    super(errors.join('; '));
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function hasAtMostTwoDecimals(n) {
  return Math.abs(Math.round(n * 100) - n * 100) < 1e-9;
}

/**
 * Validate a raw expense payload.
 * @param {object} input
 * @param {{today?: Date}} [options]
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateExpense(input, { today = new Date() } = {}) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['body must be a JSON object'] };
  }

  if (typeof input.employee !== 'string' || input.employee.trim() === '') {
    errors.push('employee is required');
  }

  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount <= 0) {
    errors.push('amount must be a positive number');
  } else if (!hasAtMostTwoDecimals(input.amount)) {
    errors.push('amount must have at most 2 decimal places');
  }

  if (!CATEGORIES.includes(input.category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  }

  if (!isIsoDate(input.date)) {
    errors.push('date must be an ISO date (YYYY-MM-DD)');
  } else if (input.date > today.toISOString().slice(0, 10)) {
    errors.push('date cannot be in the future');
  }

  if (typeof input.amount === 'number' && input.amount > RECEIPT_THRESHOLD &&
      (typeof input.receiptId !== 'string' || input.receiptId.trim() === '')) {
    errors.push('receiptId is required for expenses over 75.00');
  }

  if (input.category === 'meals' && typeof input.amount === 'number' && input.amount > MEAL_PER_DIEM &&
      (typeof input.justification !== 'string' || input.justification.trim().length < 10)) {
    errors.push('justification is required for meals over 60.00');
  }

  if (input.description !== undefined &&
      (typeof input.description !== 'string' || input.description.length > 200)) {
    errors.push('description must be a string of at most 200 characters');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate and normalize an expense. Throws ValidationError when invalid.
 */
function normalizeExpense(input, options) {
  const { valid, errors } = validateExpense(input, options);
  if (!valid) throw new ValidationError(errors);
  const expense = {
    employee: input.employee.trim(),
    amount: Math.round(input.amount * 100) / 100,
    category: input.category,
    date: input.date,
  };
  if (input.description !== undefined) expense.description = input.description;
  if (typeof input.receiptId === 'string' && input.receiptId.trim() !== '') expense.receiptId = input.receiptId.trim();
  if (typeof input.justification === 'string' && input.justification.trim() !== '') expense.justification = input.justification.trim();
  return expense;
}

module.exports = { CATEGORIES, RECEIPT_THRESHOLD, MEAL_PER_DIEM, ValidationError, validateExpense, normalizeExpense };
