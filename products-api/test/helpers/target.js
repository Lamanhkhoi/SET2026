'use strict';
// Khởi động server cần test trên cổng ngẫu nhiên (port 0) => không bao giờ đụng server cũ
// đang giữ cổng 3000 (tránh "PASS ảo").
const os = require('os');
const path = require('path');
const seed = require('../../seed/products');

const TOKEN = 'demo-token';

async function startTarget() {
  const target = process.env.TARGET || 'baseline';
  let server;
  let reset;
  let cleanup = async () => {};

  if (target === 'baseline') {
    server = require('../../baseline/server').createServer();
    reset = async () => server.resetState();
  } else {
    process.env.DATA_SOURCE = target; // 'file' | 'mongo'
    process.env.LOG_REQUESTS = 'false';
    if (target === 'file') {
      process.env.DATA_FILE = path.join(os.tmpdir(), `products-test-${process.pid}.json`);
    } else if (target === 'mongo') {
      // KHÔNG test vào DB thật: ép dùng DB test
      process.env.MONGODB_DB = process.env.MONGODB_TEST_DB || 'set26_products_test';
    }
    const { createApp } = require('../../src/server');
    const app = createApp();
    server = app.server;
    await app.dataSource.connect();
    reset = () => app.dataSource.reset(seed);
    cleanup = () => app.dataSource.close();
  }

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const close = async () => {
    await new Promise((resolve) => server.close(resolve));
    await cleanup();
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
