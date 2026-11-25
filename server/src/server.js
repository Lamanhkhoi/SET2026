'use strict';
// Entry: kết nối nguồn dữ liệu, mở cổng, đóng kết nối khi tắt.
const config = require('./config');
const { createApp } = require('./app');

async function start() {
  const { app, dataSource } = createApp();
  try {
    await dataSource.connect();
  } catch (err) {
    console.error('[startup] Không kết nối được nguồn dữ liệu:', err.message); // không in URI
    process.exit(1);
  }

  // Express 5: callback của listen nhận lỗi (vd EADDRINUSE khi cổng bận)
  const server = app.listen(config.port, (err) => {
    if (err) {
      console.error(err.code === 'EADDRINUSE' ? `Cổng ${config.port} đang bận` : err.message);
      process.exit(1);
    }
    console.log(`Express API: http://localhost:${config.port} (data source: ${process.env.DATA_SOURCE || 'file'})`);
  });

  let closing = false;
  const stop = async () => {
    if (closing) return;
    closing = true;
    console.log('\nĐang tắt server...');
    server.close();
    await dataSource.close(); // quên bước này: process treo, Ctrl+C không thoát
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (require.main === module) start();
