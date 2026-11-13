'use strict';

const http = require('node:http');
const { normalizeExpense, ValidationError } = require('./expenses');
const { approvalRoute, statusForRoute } = require('./policy');
const { createStore } = require('./store');

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

function createApp({ store = createStore() } = {}) {
  async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'GET' && path === '/health') {
      return send(res, 200, { status: 'ok' });
    }

    if (req.method === 'GET' && path === '/expenses') {
      const items = store.list();
      return send(res, 200, items);
    }

    if (req.method === 'GET' && path === '/expenses.csv') {
      const escapeCsv = (value) => {
        const text = String(value);
        return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
      };
      const rows = store.list().map((expense) => [
        expense.id,
        expense.employee,
        expense.date,
        expense.category,
        expense.amount.toFixed(2),
        expense.status,
        expense.route,
      ].map(escapeCsv).join(','));
      const csv = `id,employee,date,category,amount,status,route\n${rows.length ? `${rows.join('\n')}\n` : ''}`;
      return send(res, 200, csv, {
        'content-type': 'text/csv; charset=utf-8',
      });
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
  return { server, store };
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createApp().server.listen(port, () => {
    console.log(`Contoso Expense Service listening on http://localhost:${port}`);
  });
}

module.exports = { createApp };
