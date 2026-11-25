'use strict';
const config = require('../config');
const { sendJson } = require('../lib/http');

// 401 nếu thiếu/sai token. (403 là "biết bạn là ai nhưng không được phép" - bài này chưa có.)
module.exports = async function requireToken(req, res) {
  if (req.headers.authorization !== `Bearer ${config.authToken}`) {
    sendJson(res, 401, { error: 'Unauthorized' });
  }
};
