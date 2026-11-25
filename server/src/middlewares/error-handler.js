'use strict';

// Error middleware: PHẢI đủ 4 tham số (err, req, res, next), nếu không Express bỏ qua và trả HTML.
// Express 5 tự chuyển lỗi ném trong hàm async tới đây.
module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err); // đã gửi một phần: để Express đóng kết nối, đừng gửi 2 lần

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON không hợp lệ' }); // express.json gặp JSON hỏng
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message }); // vd 413 body quá lớn
  }

  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message); // không in stack/URI kết nối
  res.status(500).json({ error: 'Internal Server Error' });
};
