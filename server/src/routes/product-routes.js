'use strict';
// Router /products. Express lấy route KHỚP ĐẦU TIÊN => route cụ thể đặt trước route có :id.
// URL đầy đủ = mount path ('/products' ở app.js) + path ở đây ('/', '/:id').
const express = require('express');
const config = require('../config');
const requireToken = require('../middlewares/require-token');
const requireJsonObject = require('../middlewares/require-json-object');
const product = require('../controllers/product-controller');

const router = express.Router();

// route-level middleware: chỉ route ghi mới chạy. Thứ tự: 401 -> parse JSON (400) -> body phải là object (400)
const jsonBody = express.json({ limit: config.bodyLimit });
const withBody = [requireToken, jsonBody, requireJsonObject];

router.get('/', product.list);
router.post('/', withBody, product.create);
router.get('/:id', product.getById);
router.put('/:id', withBody, product.replace);
router.patch('/:id', withBody, product.update);
router.delete('/:id', requireToken, product.remove);

module.exports = router;
