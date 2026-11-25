'use strict';
const { sendJson } = require('../lib/http');

// Bắt lỗi ném ra từ middleware/controller/repository/data-source.
// Chỉ gửi response khi CHƯA gửi (tránh ERR_HTTP_HEADERS_SENT).
module.exports = function errorHandler(err, req, res) {
  if (err.status) {
    // lỗi có chủ đích (vd 413) - không cần log stack
    if (!res.headersSent) sendJson(res, err.status, { error: err.message });
    return;
  }
  console.error(`[error] ${req.method} ${req.url}:`, err.message); // không in stack/URI kết nối
  if (!res.headersSent) sendJson(res, 500, { error: 'Internal Server Error' });
  else res.destroy();
};
