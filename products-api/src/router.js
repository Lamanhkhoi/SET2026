'use strict';
// Router: ghép (method + path) -> chuỗi middleware -> controller.
// KHÔNG xử lý dữ liệu, KHÔNG validate. Middleware async được await tuần tự;
// nếu một middleware đã gửi response (res.writableEnded) thì dừng chuỗi.
const { sendJson } = require('./lib/http');
const logRequest = require('./middlewares/log-request');
const requireToken = require('./middlewares/require-token');
const parseJsonBody = require('./middlewares/parse-json-body');
const product = require('./controllers/product-controller');

const writeChain = [requireToken, parseJsonBody];

const routes = [
  { method: 'GET', pattern: /^\/products$/, middlewares: [], handler: product.list },
  { method: 'POST', pattern: /^\/products$/, middlewares: writeChain, handler: product.create },
  { method: 'GET', pattern: /^\/products\/([^/]+)$/, middlewares: [], handler: product.getById },
  { method: 'PUT', pattern: /^\/products\/([^/]+)$/, middlewares: writeChain, handler: product.replace },
  { method: 'PATCH', pattern: /^\/products\/([^/]+)$/, middlewares: writeChain, handler: product.update },
  { method: 'DELETE', pattern: /^\/products\/([^/]+)$/, middlewares: [requireToken], handler: product.remove },
];

async function dispatch(req, res) {
  await logRequest(req, res);

  const url = new URL(req.url, 'http://localhost');
  req.searchParams = url.searchParams;
  const pathname = '/' + url.pathname.split('/').filter(Boolean).join('/'); // bỏ '/' thừa

  for (const route of routes) {
    if (route.method !== req.method) continue;
    const match = route.pattern.exec(pathname);
    if (!match) continue;

    for (const middleware of route.middlewares) {
      await middleware(req, res);
      if (res.writableEnded) return; // middleware đã trả lời (401/400)
    }
    return route.handler(req, res, { id: match[1] });
  }
  sendJson(res, 404, { error: 'Not found' });
}

module.exports = { dispatch };
