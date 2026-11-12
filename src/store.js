'use strict';

// In-memory store. Intentionally simple: the lab is about agents, not databases.

function createStore() {
  const items = new Map();
  let next = 1;
  return {
    add(expense) {
      const id = `exp-${String(next++).padStart(4, '0')}`;
      const record = { id, ...expense, createdAt: new Date().toISOString() };
      items.set(id, record);
      return record;
    },
    get(id) {
      return items.get(id) || null;
    },
    list() {
      return [...items.values()];
    },
    clear() {
      items.clear();
      next = 1;
    },
  };
}

module.exports = { createStore };
