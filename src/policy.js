'use strict';

// Approval routing policy. Changes to this file are compliance-sensitive:
// they require an approved plan and a code-owner review (see CODEOWNERS).

const THRESHOLDS = Object.freeze({
  AUTO_APPROVE_MAX: 100, // USD
  MANAGER_MAX: 1000, // USD
});

/**
 * Decide who must approve an expense.
 * @param {{amount: number}} expense
 * @returns {'auto'|'manager'|'finance'}
 */
function approvalRoute(expense) {
  if (expense.amount < THRESHOLDS.AUTO_APPROVE_MAX) return 'auto';
  if (expense.amount <= THRESHOLDS.MANAGER_MAX) return 'manager';
  return 'finance';
}

function statusForRoute(route) {
  return route === 'auto' ? 'approved' : 'pending_approval';
}

module.exports = { THRESHOLDS, approvalRoute, statusForRoute };
