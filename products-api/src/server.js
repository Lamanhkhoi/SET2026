'use strict';
// Entry: tạo http server, nạp router, bắt lỗi toàn cục, đóng kết nối khi tắt.
const http = require('http');
const config = require('./config');
const router = require('./router');
const errorHandler = require('./middlewares/error-handler');
const repository = require('./repositories/product-repository');

function createApp() {
  const server = http.createServer((req, res) => {
    router.dispatch(req, res).catch((err) => errorHandler(err, req, res));
  });
  return { server, dataSource: repository };
}

async function start() {
  const { server, dataSource } = createApp();
  try {
    await dataSource.connect();
  } catch (err) {
    console.error('[startup] Không kết nối được nguồn dữ liệu:', err.message);
    process.exit(1);
  }
  server.listen(config.port, () => {
    console.log(`Products API: http://localhost:${config.port} (data source: ${process.env.DATA_SOURCE || 'file'})`);
  });

  let closing = false;
  const stop = async () => {
    if (closing) return;
    closing = true;
    console.log('\nĐang tắt server...');
    server.close();
    await dataSource.close(); // nếu quên: process treo, Ctrl+C không thoát
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

module.exports = { createApp };

if (require.main === module) start();
