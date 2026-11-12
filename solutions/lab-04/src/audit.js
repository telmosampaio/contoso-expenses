'use strict';

// FEAT-4: append-only audit trail of approval routing decisions.

function createAuditLog() {
  const entries = [];
  return {
    record({ expenseId, route, decidedBy = 'policy-engine' }) {
      const entry = Object.freeze({ expenseId, route, decidedBy, at: new Date().toISOString() });
      entries.push(entry);
      return entry;
    },
    list() {
      return entries.slice().reverse(); // newest first
    },
  };
}

module.exports = { createAuditLog };
