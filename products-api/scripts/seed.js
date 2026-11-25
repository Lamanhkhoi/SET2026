'use strict';
// Xoá dữ liệu cũ + nạp 3 sản phẩm mẫu (id 1..3, nextId = 4) vào nguồn dữ liệu đang chọn.
// Dùng: npm run seed   (DATA_SOURCE=file mặc định, hoặc mongo trong .env)
require('../src/config');
const repository = require('../src/repositories/product-repository');
const seed = require('../seed/products');

(async () => {
  await repository.connect();
  await repository.reset(seed);
  console.log(`Seed xong (${process.env.DATA_SOURCE || 'file'}): ${seed.length} sản phẩm, id kế tiếp = ${Math.max(...seed.map((p) => p.id)) + 1}`);
  await repository.close();
})().catch((err) => {
  console.error('Seed lỗi:', err.message);
  process.exit(1);
});
