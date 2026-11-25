'use strict';
// Đọc .env (nếu có). Biến đã có sẵn trong process.env (ví dụ do test đặt) KHÔNG bị ghi đè.
require('dotenv').config({ quiet: true });

module.exports = {
  port: Number(process.env.PORT) || 3000,
  authToken: process.env.AUTH_TOKEN || 'demo-token',
  logRequests: process.env.LOG_REQUESTS !== 'false',
  maxBodyBytes: 1024 * 1024, // 1MB
};
