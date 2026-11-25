'use strict';
// Controller: đọc req, validate input, chọn status code, gọi repository.
// KHÔNG biết dữ liệu nằm ở file hay Mongo.
const repo = require('../repositories/product-repository');
const { sendJson, sendNoContent } = require('../lib/http');
const { parseId, parseLimit, validateFull, validatePatch } = require('./product-validation');

const notFound = (res) => sendJson(res, 404, { error: 'Product not found' });
const invalid = (res, errors) => sendJson(res, 400, { error: 'Dữ liệu không hợp lệ', details: errors });

async function list(req, res) {
  const { value, error } = parseLimit(req.searchParams);
  if (error) return sendJson(res, 400, { error });
  sendJson(res, 200, await repo.findAll(value));
}

async function getById(req, res, params) {
  const id = parseId(params.id);
  if (id === null) return notFound(res);
  const product = await repo.findById(id);
  return product ? sendJson(res, 200, product) : notFound(res);
}

async function create(req, res) {
  const { data, errors } = validateFull(req.body);
  if (errors) return invalid(res, errors);
  sendJson(res, 201, await repo.create(data));
}

async function replace(req, res, params) {
  const id = parseId(params.id);
  if (id === null) return notFound(res);
  const { data, errors } = validateFull(req.body);
  if (errors) return invalid(res, errors);
  const product = await repo.replace(id, data);
  return product ? sendJson(res, 200, product) : notFound(res);
}

async function update(req, res, params) {
  const id = parseId(params.id);
  if (id === null) return notFound(res);
  const { data, errors } = validatePatch(req.body);
  if (errors) return invalid(res, errors);
  const product = await repo.update(id, data);
  return product ? sendJson(res, 200, product) : notFound(res);
}

async function remove(req, res, params) {
  const id = parseId(params.id);
  if (id === null) return notFound(res);
  const removed = await repo.remove(id);
  return removed ? sendNoContent(res) : notFound(res);
}

module.exports = { list, getById, create, replace, update, remove };
