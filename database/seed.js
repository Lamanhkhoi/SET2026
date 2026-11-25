'use strict';
// Xoá dữ liệu cũ + nạp 3 sản phẩm mẫu (id 1..3, bộ đếm = 3 => id kế tiếp = 4).
// Chạy từ thư mục server/:  npm run seed   (đọc server/.env: DATA_SOURCE, MONGODB_URI, MONGODB_DB)
require('../server/src/config');
const repository = require('../server/src/repositories/product-repository');
const seed = require('./seed/products');

(async () => {
  await repository.connect();
  await repository.reset(seed);
  const target = process.env.DATA_SOURCE || 'file';
  console.log(`Seed xong (${target}${target === 'mongo' ? ': ' + (process.env.MONGODB_DB || '') : ''}): ${seed.length} sản phẩm, id kế tiếp = ${Math.max(...seed.map((p) => p.id)) + 1}`);
  await repository.close();
})().catch((err) => {
  console.error('Seed lỗi:', err.message); // không in URI
  process.exit(1);
});
