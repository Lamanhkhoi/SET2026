'use strict';
const config = require('../config');

// Log: method path status thời-gian. KHÔNG log header Authorization / body.
module.exports = async function logRequest(req, res) {
  if (!config.logRequests) return;
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
};
