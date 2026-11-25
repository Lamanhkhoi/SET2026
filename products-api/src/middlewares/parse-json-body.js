'use strict';
const config = require('../config');
const { sendJson } = require('../lib/http');

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > config.maxBodyBytes) {
        reject(Object.assign(new Error('Body too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// Đọc stream -> JSON.parse -> req.body. 400 nếu JSON hỏng / rỗng / không phải object.
module.exports = async function parseJsonBody(req, res) {
  const raw = await readBody(req);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return sendJson(res, 400, { error: 'JSON không hợp lệ' });
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return sendJson(res, 400, { error: 'Body phải là JSON object' });
  }
  req.body = body;
};
