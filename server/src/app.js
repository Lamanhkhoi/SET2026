'use strict';
// Lắp ráp app Express. THỨ TỰ ĐĂNG KÝ = THỨ TỰ CHẠY (từ trên xuống):
//   app-level middleware -> router -> notFound -> errorHandler (cuối cùng)
const express = require('express');
const logRequest = require('./middlewares/log-request');
const notFound = require('./middlewares/not-found');
const errorHandler = require('./middlewares/error-handler');
const productRoutes = require('./routes/product-routes');
const repository = require('./repositories/product-repository');

function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(logRequest); // chạy cho MỌI request
  app.use('/products', productRoutes); // mount path '/products' + path trong router
  app.use(notFound); // không route nào khớp -> 404
  app.use(errorHandler); // 4 tham số, đặt CUỐI CÙNG -> bắt throw / next(err)

  return { app, dataSource: repository };
}

module.exports = { createApp };
