'use strict';

const http = require('node:http');
const { normalizeExpense, ValidationError } = require('./expenses');
const { approvalRoute, statusForRoute } = require('./policy');
const { createStore } = require('./store');
const { toCsv } = require('./csv');
const { createAuditLog } = require('./audit');
const { CATEGORIES } = require('./expenses');

function send(res, status, body, headers = {}) {
  const isText = typeof body === 'string';
  res.writeHead(status, {
    'content-type': isText ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    ...headers,
  });
  res.end(isText ? body : JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new SyntaxError('invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function parseNonNegativeInt(value, fallback) {
  if (value === null) return fallback;
  return /^\d+$/.test(value) ? Number(value) : NaN;
}

function createApp({ store = createStore(), audit = createAuditLog() } = {}) {
  async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'GET' && path === '/health') {
      return send(res, 200, { status: 'ok' });
    }

    if (req.method === 'GET' && path === '/expenses') {
      let items = store.list();

      // FEAT-5: filter by category
      const category = url.searchParams.get('category');
      if (category !== null) {
        if (!CATEGORIES.includes(category)) return send(res, 400, { errors: [`unknown category: ${category}`] });
        items = items.filter((e) => e.category === category);
      }

      // FEAT-6: pagination
      const limit = parseNonNegativeInt(url.searchParams.get('limit'), 50);
      const offset = parseNonNegativeInt(url.searchParams.get('offset'), 0);
      if (Number.isNaN(limit) || Number.isNaN(offset)) {
        return send(res, 400, { errors: ['limit and offset must be non-negative integers'] });
      }
      const total = items.length;
      items = items.slice(offset, offset + Math.min(limit, 100));
      return send(res, 200, items, { 'x-total-count': String(total) });
    }

    if (req.method === 'GET' && path === '/audit') {
      return send(res, 200, audit.list());
    }

    if (req.method === 'GET' && path === '/expenses.csv') {
      return send(res, 200, toCsv(store.list()), { 'content-type': 'text/csv; charset=utf-8' });
    }

    if (req.method === 'POST' && path === '/expenses') {
      let body;
      try {
        body = await readJson(req);
      } catch (err) {
        return send(res, 400, { errors: [err.message] });
      }
      try {
        const expense = normalizeExpense(body);
        const route = approvalRoute(expense);
        const record = store.add({ ...expense, route, status: statusForRoute(route) });
        audit.record({ expenseId: record.id, route, decidedBy: 'policy-engine' });
        return send(res, 201, record);
      } catch (err) {
        if (err instanceof ValidationError) return send(res, 400, { errors: err.errors });
        throw err;
      }
    }

    const match = path.match(/^\/expenses\/([\w-]+)$/);
    if (req.method === 'GET' && match) {
      const record = store.get(match[1]);
      return record ? send(res, 200, record) : send(res, 404, { errors: ['not found'] });
    }

    return send(res, 404, { errors: ['not found'] });
  }

  const server = http.createServer((req, res) => {
    handler(req, res).catch((err) => {
      console.error(err);
      send(res, 500, { errors: ['internal error'] });
    });
  });
  return { server, store, audit };
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createApp().server.listen(port, () => {
    console.log(`Contoso Expense Service listening on http://localhost:${port}`);
  });
}

module.exports = { createApp };
