'use strict';
// Controller: đọc req, validate input, chọn status code, gọi repository.
// KHÔNG biết dữ liệu nằm ở file hay Mongo. Logic y hệt bản Node thuần; chỉ đổi cách đọc req / gửi res.
const repo = require('../repositories/product-repository');
const { parseId, parseLimit, validateFull, validatePatch } = require('./product-validation');

const notFound = (res) => res.status(404).json({ error: 'Product not found' });
const invalid = (res, errors) => res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });

// Hàm async ném lỗi (vd Mongo chết) => Express 5 tự chuyển tới errorHandler, không cần try/catch.
async function list(req, res) {
  const { value, error } = parseLimit(req.query.limit);
  if (error) return res.status(400).json({ error });
  res.status(200).json(await repo.findAll(value));
}

async function getById(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return notFound(res);
  const product = await repo.findById(id);
  return product ? res.status(200).json(product) : notFound(res);
}

async function create(req, res) {
  const { data, errors } = validateFull(req.body);
  if (errors) return invalid(res, errors);
  res.status(201).json(await repo.create(data));
}

async function replace(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return notFound(res);
  const { data, errors } = validateFull(req.body);
  if (errors) return invalid(res, errors);
  const product = await repo.replace(id, data);
  return product ? res.status(200).json(product) : notFound(res);
}

async function update(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return notFound(res);
  const { data, errors } = validatePatch(req.body);
  if (errors) return invalid(res, errors);
  const product = await repo.update(id, data);
  return product ? res.status(200).json(product) : notFound(res);
}

async function remove(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return notFound(res);
  return (await repo.remove(id)) ? res.status(204).end() : notFound(res);
}

module.exports = { list, getById, create, replace, update, remove };
