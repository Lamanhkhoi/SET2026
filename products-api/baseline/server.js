'use strict';
// BASELINE: toàn bộ API trong 1 file, dữ liệu in-memory.
// Dùng làm "bản đối chứng": bộ test hợp đồng (test/contract.test.js) phải PASS giống hệt
// trên bản này, bản tách 5 tầng (file) và bản MongoDB.
const http = require('http');
const seed = require('../seed/products');

const TOKEN = process.env.AUTH_TOKEN || 'demo-token';
const MAX_BODY = 1024 * 1024; // 1MB

function createServer() {
  let items;
  let nextId;
  function resetState() {
    items = seed.map((p) => ({ ...p }));
    nextId = Math.max(...items.map((p) => p.id)) + 1;
  }
  resetState();

  function send(res, status, body) {
    if (status === 204) {
      res.writeHead(204);
      return res.end();
    }
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
    });
    res.end(payload);
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      req.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY) {
          reject(Object.assign(new Error('Body too large'), { status: 413 }));
          req.destroy();
          return;
        }
        chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }

  const parseId = (s) => (/^[1-9]\d*$/.test(s) && Number.isSafeInteger(Number(s)) ? Number(s) : null);
  const isNonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;
  const validName = (v) => isNonEmptyStr(v) && v.trim().length <= 100;
  const validPrice = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  const validCategory = (v) => isNonEmptyStr(v);

  async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const parts = url.pathname.split('/').filter(Boolean);
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

    // ---- route matching ----
    let route = null;
    if (parts.length === 1 && parts[0] === 'products') {
      if (req.method === 'GET') route = 'list';
      else if (req.method === 'POST') route = 'create';
    } else if (parts.length === 2 && parts[0] === 'products') {
      route = { GET: 'get', PUT: 'put', PATCH: 'patch', DELETE: 'delete' }[req.method] || null;
    }
    if (!route) return send(res, 404, { error: 'Not found' });

    // ---- auth (mọi route ghi) ----
    if (isWrite && req.headers.authorization !== `Bearer ${TOKEN}`) {
      return send(res, 401, { error: 'Unauthorized' });
    }

    // ---- list ----
    if (route === 'list') {
      const limits = url.searchParams.getAll('limit');
      let out = items;
      if (limits.length > 1 || (limits.length === 1 && !/^\d+$/.test(limits[0]))) {
        return send(res, 400, { error: 'limit phải là số nguyên >= 0' });
      }
      if (limits.length === 1) out = items.slice(0, Number(limits[0]));
      return send(res, 200, out);
    }

    // ---- id-based: id sai định dạng => 404 ----
    let id = null;
    if (route !== 'create') {
      id = parseId(parts[1]);
      if (id === null) return send(res, 404, { error: 'Product not found' });
    }
    if (route === 'get') {
      const p = items.find((x) => x.id === id);
      return p ? send(res, 200, p) : send(res, 404, { error: 'Product not found' });
    }
    if (route === 'delete') {
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1) return send(res, 404, { error: 'Product not found' });
      items.splice(idx, 1);
      return send(res, 204);
    }

    // ---- các route còn lại cần body JSON object ----
    const raw = await readBody(req);
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return send(res, 400, { error: 'JSON không hợp lệ' });
    }
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return send(res, 400, { error: 'Body phải là JSON object' });
    }

    if (route === 'create' || route === 'put') {
      const errors = [];
      if (!validName(body.name)) errors.push('name: chuỗi không rỗng, tối đa 100 ký tự');
      if (!validPrice(body.price)) errors.push('price: số hữu hạn >= 0');
      if (!validCategory(body.category)) errors.push('category: chuỗi không rỗng');
      if (errors.length) return send(res, 400, { error: 'Dữ liệu không hợp lệ', details: errors });
      const data = { name: body.name.trim(), price: body.price, category: body.category.trim() };
      if (route === 'create') {
        const p = { id: nextId++, ...data };
        items.push(p);
        return send(res, 201, p);
      }
      const idx = items.findIndex((x) => x.id === id);
      if (idx === -1) return send(res, 404, { error: 'Product not found' });
      items[idx] = { id, ...data };
      return send(res, 200, items[idx]);
    }

    // PATCH: whitelist, bỏ field lạ + id
    const patch = {};
    const errors = [];
    if ('name' in body) validName(body.name) ? (patch.name = body.name.trim()) : errors.push('name');
    if ('price' in body) validPrice(body.price) ? (patch.price = body.price) : errors.push('price');
    if ('category' in body) validCategory(body.category) ? (patch.category = body.category.trim()) : errors.push('category');
    if (errors.length) return send(res, 400, { error: 'Dữ liệu không hợp lệ', details: errors });
    const idx = items.findIndex((x) => x.id === id);
    if (idx === -1) return send(res, 404, { error: 'Product not found' });
    items[idx] = { ...items[idx], ...patch, id };
    return send(res, 200, items[idx]);
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      if (res.headersSent) return res.destroy();
      send(res, err.status || 500, { error: err.status ? err.message : 'Internal Server Error' });
    });
  });
  server.resetState = resetState; // chỉ để test
  return server;
}

module.exports = { createServer };

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => console.log(`[baseline] http://localhost:${port}`));
}
