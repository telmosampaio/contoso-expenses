'use strict';

// FEAT-3: RFC 4180 CSV export of expenses.

const COLUMNS = ['id', 'employee', 'date', 'category', 'amount', 'status', 'route'];

function escapeCsv(value) {
  const s = value === undefined || value === null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(expenses) {
  const lines = [COLUMNS.join(',')];
  for (const e of expenses) {
    lines.push(COLUMNS.map((c) => escapeCsv(c === 'amount' ? Number(e.amount).toFixed(2) : e[c])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

module.exports = { COLUMNS, escapeCsv, toCsv };
