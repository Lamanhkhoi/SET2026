'use strict';
const config = require('../config');

// 401 nếu thiếu/sai token. (403 = biết bạn là ai nhưng không có quyền - bài này chưa có.)
module.exports = function requireToken(req, res, next) {
  if (req.headers.authorization !== `Bearer ${config.authToken}`) {
    return res.status(401).json({ error: 'Unauthorized' }); // đường 2: trả response rồi RETURN (dừng)
  }
  next();
};
