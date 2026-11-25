'use strict';
// Validate INPUT của API (thuộc tầng controller). Trả { data } hoặc { errors }.
const isNonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;
const validName = (v) => isNonEmptyStr(v) && v.trim().length <= 100;
const validPrice = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const validCategory = (v) => isNonEmptyStr(v);

// id hợp lệ: số nguyên dương. Sai định dạng => null (controller trả 404).
function parseId(raw) {
  return /^[1-9]\d*$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : null;
}

// req.query.limit LUÔN là string (hoặc mảng nếu ?limit=1&limit=2, hoặc undefined) => phải tự ép kiểu.
function parseLimit(raw) {
  if (raw === undefined) return { value: undefined };
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return { error: 'limit phải là số nguyên >= 0' };
  return { value: Number(raw) };
}

// Đủ 3 field (POST, PUT). Field lạ và id bị bỏ.
function validateFull(body) {
  const errors = [];
  if (!validName(body.name)) errors.push('name: chuỗi không rỗng, tối đa 100 ký tự');
  if (!validPrice(body.price)) errors.push('price: số hữu hạn >= 0');
  if (!validCategory(body.category)) errors.push('category: chuỗi không rỗng');
  if (errors.length) return { errors };
  return { data: { name: body.name.trim(), price: body.price, category: body.category.trim() } };
}

// PATCH: whitelist name/price/category, field gửi lên phải đúng kiểu.
function validatePatch(body) {
  const data = {};
  const errors = [];
  if ('name' in body) validName(body.name) ? (data.name = body.name.trim()) : errors.push('name');
  if ('price' in body) validPrice(body.price) ? (data.price = body.price) : errors.push('price');
  if ('category' in body) validCategory(body.category) ? (data.category = body.category.trim()) : errors.push('category');
  if (errors.length) return { errors };
  return { data };
}

module.exports = { parseId, parseLimit, validateFull, validatePatch };
