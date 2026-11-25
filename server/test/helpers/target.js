'use strict';
// Khởi động app Express trên cổng ngẫu nhiên (port 0) => không đụng server cũ đang giữ cổng.
const os = require('os');
const path = require('path');
const seed = require('../../../database/seed/products');

const TOKEN = 'demo-token';

async function startTarget() {
  const target = process.env.TARGET || 'file';
  process.env.DATA_SOURCE = target; // 'file' | 'mongo'
  process.env.LOG_REQUESTS = 'false';
  if (target === 'file') {
    process.env.DATA_FILE = path.join(os.tmpdir(), `express-products-test-${process.pid}.json`);
  } else if (target === 'mongo') {
    // KHÔNG test vào DB thật: ép dùng DB test
    process.env.MONGODB_DB = process.env.MONGODB_TEST_DB || 'express-test';
  }
  const { createApp } = require('../../src/app');
  const { app, dataSource } = createApp();
  await dataSource.connect();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  const url = `http://127.0.0.1:${server.address().port}`;
  const reset = () => dataSource.reset(seed);
  const close = async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await dataSource.close();
  };
  return { target, url, reset, close, server };
}

function makeClient(url) {
  // call('POST', '/products', { body: {...} })  | { raw: 'text' } | { token: false } | { token: 'sai' }
  return async function call(method, p, opts = {}) {
    const headers = {};
    if (opts.token !== false) headers.Authorization = `Bearer ${opts.token || TOKEN}`;
    let body;
    if (opts.raw !== undefined) {
      body = opts.raw;
      headers['Content-Type'] = 'application/json';
    } else if (opts.body !== undefined) {
      body = JSON.stringify(opts.body);
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url + p, { method, headers, body });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* không phải JSON */ }
    return { status: res.status, type: res.headers.get('content-type'), text, json };
  };
}

module.exports = { startTarget, makeClient, TOKEN };
