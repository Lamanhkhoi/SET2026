'use strict';
const config = require('../config');

// Log: method url -> status (thời gian). KHÔNG log header Authorization / body.
module.exports = function logRequest(req, res, next) {
  if (config.logRequests) {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
  }
  next(); // đường 1 trong 3: cho request đi tiếp
};
