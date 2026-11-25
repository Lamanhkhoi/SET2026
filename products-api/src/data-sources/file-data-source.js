'use strict';
// Data source dạng file JSON: { nextId, items }. Bản cũ giữ lại để so sánh với Mongo.
// Mọi thao tác chạy tuần tự qua hàng đợi (locked) => không ghi đè nhau khi có request song song.
const fs = require('fs/promises');
const path = require('path');

const filePath = () => process.env.DATA_FILE || path.join(__dirname, '..', '..', 'data', 'products.json');

let state = null;
let queue = Promise.resolve();

function locked(fn) {
  const run = queue.then(fn);
  queue = run.catch(() => {});
  return run;
}

async function persist() {
  const tmp = `${filePath()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
  await fs.rename(tmp, filePath()); // ghi nguyên tử: không bao giờ để file dở dang
}

const clone = (p) => (p ? { ...p } : null);

async function connect() {
  try {
    state = JSON.parse(await fs.readFile(filePath(), 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    state = { nextId: 1, items: [] };
  }
}

async function close() {
  await queue;
}

function findAll(limit) {
  return locked(async () => (limit === undefined ? state.items : state.items.slice(0, limit)).map(clone));
}

function findById(id) {
  return locked(async () => clone(state.items.find((p) => p.id === id)));
}

function create(data) {
  return locked(async () => {
    const product = { id: state.nextId, ...data };
    state.items.push(product);
    state.nextId += 1; // nextId chỉ tăng, không bao giờ cấp lại
    await persist();
    return clone(product);
  });
}

function replace(id, data) {
  return locked(async () => {
    const idx = state.items.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    state.items[idx] = { id, ...data };
    await persist();
    return clone(state.items[idx]);
  });
}

function update(id, patch) {
  return locked(async () => {
    const idx = state.items.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    state.items[idx] = { ...state.items[idx], ...patch, id };
    await persist();
    return clone(state.items[idx]);
  });
}

function remove(id) {
  return locked(async () => {
    const idx = state.items.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    state.items.splice(idx, 1);
    await persist();
    return true;
  });
}

// Xoá hết + nạp lại dữ liệu mẫu (seed.js / test)
function reset(items) {
  return locked(async () => {
    state = {
      nextId: items.length ? Math.max(...items.map((p) => p.id)) + 1 : 1,
      items: items.map(clone),
    };
    await persist();
  });
}

module.exports = { connect, close, findAll, findById, create, replace, update, remove, reset };
