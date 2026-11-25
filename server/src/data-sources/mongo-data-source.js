'use strict';
// Data source MongoDB. Cùng "hợp đồng hàm" với file-data-source:
//   connect, close, findAll, findById, create, replace, update, remove, reset
// Không biết gì về HTTP. Không chọn status code. Không bao giờ trả _id ra ngoài.
const { MongoClient } = require('mongodb');

let client = null;
let products = null; // collection 'products'
let counters = null; // collection 'counters' (bộ đếm id)

// Mongo tự gắn _id (ObjectId) vào mọi document. API cũ chỉ có id số => bỏ _id ở MỘT chỗ duy nhất.
function toApi(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

// id kế tiếp: $inc là thao tác nguyên tử trong Mongo => 2 request cùng lúc không bao giờ trùng id,
// và id không cấp lại sau DELETE (khác Math.max(...ids)+1).
async function nextId() {
  const counter = await counters.findOneAndUpdate(
    { _id: 'products' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return counter.seq;
}

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu MONGODB_URI trong .env');
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 }); // Mongo tắt => lỗi sau 3s, không treo
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'set26_products'); // DB/collection tự được tạo khi ghi lần đầu
  products = db.collection('products');
  counters = db.collection('counters');

  await products.createIndex({ id: 1 }, { unique: true }); // chặn trùng id ở mức DB

  // Nếu ai đó thêm document bằng Compass (id lớn hơn bộ đếm) thì kéo bộ đếm lên cho khỏi trùng.
  const top = await products.find({}).sort({ id: -1 }).limit(1).next();
  await counters.updateOne({ _id: 'products' }, { $max: { seq: top ? top.id : 0 } }, { upsert: true });
}

async function close() {
  if (client) await client.close();
  client = products = counters = null;
}

async function findAll(limit) {
  if (limit === 0) return []; // CẠNH GÓC: Mongo hiểu limit(0) là "không giới hạn" => phải tự chặn
  let cursor = products.find({}).sort({ id: 1 });
  if (limit !== undefined) cursor = cursor.limit(limit);
  return (await cursor.toArray()).map(toApi);
}

async function findById(id) {
  return toApi(await products.findOne({ id }));
}

async function create(data) {
  const id = await nextId();
  await products.insertOne({ id, ...data });
  return { id, ...data };
}

// PUT = thay toàn bộ document (replaceOne), KHÔNG dùng $set (sẽ để sót field cũ). Không upsert.
async function replace(id, data) {
  const doc = await products.findOneAndReplace({ id }, { id, ...data }, { returnDocument: 'after' });
  return toApi(doc); // không tồn tại => null (Mongo không báo lỗi, phải tự trả null để controller ra 404)
}

// PATCH = $set (chỉ đổi field gửi lên). Controller đã whitelist field.
async function update(id, patch) {
  if (Object.keys(patch).length === 0) return findById(id);
  const doc = await products.findOneAndUpdate({ id }, { $set: patch }, { returnDocument: 'after' });
  return toApi(doc);
}

async function remove(id) {
  const result = await products.deleteOne({ id });
  return result.deletedCount > 0; // 0 => không tồn tại => controller ra 404
}

// Xoá hết + nạp dữ liệu mẫu + đặt bộ đếm = id lớn nhất (seed.js / test dùng)
async function reset(items) {
  await products.deleteMany({});
  if (items.length) await products.insertMany(items.map((p) => ({ ...p })));
  const seq = items.length ? Math.max(...items.map((p) => p.id)) : 0;
  await counters.updateOne({ _id: 'products' }, { $set: { seq } }, { upsert: true });
}

module.exports = { connect, close, findAll, findById, create, replace, update, remove, reset };
