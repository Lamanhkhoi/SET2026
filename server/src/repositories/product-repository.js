'use strict';
// Repository: "hợp đồng hàm" dữ liệu thuần (nhận/trả object). KHÔNG nhận req/res.
// ĐỔI NGUỒN DỮ LIỆU = đổi DÒNG DƯỚI ĐÂY (hoặc đặt DATA_SOURCE=mongo trong .env):
const dataSource = require(`../data-sources/${process.env.DATA_SOURCE || 'file'}-data-source`);

module.exports = {
  findAll: (limit) => dataSource.findAll(limit), // -> object[]
  findById: (id) => dataSource.findById(id), // -> object | null
  create: (data) => dataSource.create(data), // -> object (có id mới)
  replace: (id, data) => dataSource.replace(id, data), // -> object | null
  update: (id, patch) => dataSource.update(id, patch), // -> object | null
  remove: (id) => dataSource.remove(id), // -> boolean

  // vòng đời / tiện ích (server.js, seed.js, test dùng; controller không dùng)
  connect: () => dataSource.connect(),
  close: () => dataSource.close(),
  reset: (items) => dataSource.reset(items),
};
