'use strict';

const { createApp } = require('../src/server');

async function withServer(fn) {
  const app = createApp();
  await new Promise((r) => app.server.listen(0, r));
  const url = `http://127.0.0.1:${app.server.address().port}`;
  try {
    await fn(url, app);
  } finally {
    await new Promise((r) => app.server.close(r));
  }
}

function post(url, body) {
  return fetch(`${url}/expenses`, { method: 'POST', body: JSON.stringify(body) });
}

module.exports = { withServer, post };
