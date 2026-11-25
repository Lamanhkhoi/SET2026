'use strict';

// Sau express.json(): yêu cầu có body là JSON object, nếu không => 400.
// LƯU Ý (Express 5.3.0, đã kiểm bằng thực nghiệm): body rỗng cho req.body = {} chứ KHÔNG phải undefined,
// nên không thể chỉ nhìn req.body. Phải xem header để biết client có gửi body hay không.
// (express.json mặc định strict: 'null', '5' đã bị chặn thành 400 ở bước parse.)
module.exports = function requireJsonObject(req, res, next) {
  const hasBody =
    req.headers['transfer-encoding'] !== undefined || Number(req.headers['content-length']) > 0;
  if (!hasBody) {
    return res.status(400).json({ error: 'Body rỗng' });
  }
  // Có body nhưng express.json bỏ qua (Content-Type không phải JSON) => báo rõ thay vì im lặng coi là {}
  if (!req.is('application/json')) {
    return res.status(400).json({ error: 'Content-Type phải là application/json' });
  }
  const body = req.body;
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Body phải là JSON object' });
  }
  next();
};
