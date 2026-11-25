'use strict';
// Bộ test HỢP ĐỒNG (contract): cùng 1 bộ test chạy cho baseline / file / mongo.
// Mục tiêu: chứng minh hành vi KHÔNG đổi khi tách tầng và khi đổi data source.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTarget, makeClient } = require('./helpers/target');

let t;
let call;

before(async () => {
  t = await startTarget();
  call = makeClient(t.url);
});
after(async () => {
  await t.close();
});

const sample = { name: 'HG Barbatos', price: 450000, category: 'gundam' };
const isJson = (r) => assert.match(r.type || '', /^application\/json/);

describe('GET /products', () => {
  before(() => t.reset());

  it('200 + mảng 3 sản phẩm seed, không có _id', async () => {
    const r = await call('GET', '/products', { token: false });
    assert.equal(r.status, 200);
    isJson(r);
    assert.equal(r.json.length, 3);
    assert.deepEqual(r.json[0], { id: 1, name: 'RG Nu Gundam 1/144', price: 1250000, category: 'gundam' });
    for (const p of r.json) assert.equal('_id' in p, false);
  });

  it('?limit=2 -> 2 phần tử, ?limit=0 -> []', async () => {
    assert.equal((await call('GET', '/products?limit=2')).json.length, 2);
    assert.deepEqual((await call('GET', '/products?limit=0')).json, []);
  });

  for (const bad of ['abc', '', '2.5', '-1', '1e2', ' 2']) {
    it(`?limit=${JSON.stringify(bad)} -> 400`, async () => {
      const r = await call('GET', `/products?limit=${encodeURIComponent(bad)}`);
      assert.equal(r.status, 400);
      isJson(r);
    });
  }
});

describe('GET /products/:id', () => {
  before(() => t.reset());

  it('200 + object', async () => {
    const r = await call('GET', '/products/2', { token: false });
    assert.equal(r.status, 200);
    assert.equal(r.json.name, 'Blue-Eyes White Dragon (LOB)');
  });

  for (const bad of ['999', 'abc', '0', '-1', '1.5', '01x']) {
    it(`/products/${bad} -> 404 (không phải 500)`, async () => {
      const r = await call('GET', `/products/${bad}`);
      assert.equal(r.status, 404);
      isJson(r);
    });
  }
});

describe('POST /products', () => {
  before(() => t.reset());

  it('401 khi thiếu / sai token', async () => {
    assert.equal((await call('POST', '/products', { body: sample, token: false })).status, 401);
    assert.equal((await call('POST', '/products', { body: sample, token: 'sai' })).status, 401);
  });

  it('201 + id mới, bỏ id client gửi, bỏ field lạ', async () => {
    const r = await call('POST', '/products', { body: { ...sample, id: 99, hack: true } });
    assert.equal(r.status, 201);
    isJson(r);
    assert.deepEqual(r.json, { id: 4, ...sample });
    assert.deepEqual((await call('GET', '/products/4')).json, r.json);
  });

  it('trim name/category', async () => {
    const r = await call('POST', '/products', { body: { name: '  Pikachu  ', price: 0, category: ' pokemon ' } });
    assert.equal(r.status, 201);
    assert.equal(r.json.name, 'Pikachu');
    assert.equal(r.json.category, 'pokemon');
  });

  const badBodies = {
    'thiếu name': { price: 1, category: 'x' },
    'thiếu price': { name: 'a', category: 'x' },
    'thiếu category': { name: 'a', price: 1 },
    'name rỗng sau trim': { name: '   ', price: 1, category: 'x' },
    'name > 100 ký tự': { name: 'a'.repeat(101), price: 1, category: 'x' },
    'price là string': { name: 'a', price: '100', category: 'x' },
    'price âm': { name: 'a', price: -1, category: 'x' },
    'price null': { name: 'a', price: null, category: 'x' },
    'category rỗng': { name: 'a', price: 1, category: '' },
  };
  for (const [label, body] of Object.entries(badBodies)) {
    it(`400: ${label}`, async () => {
      const r = await call('POST', '/products', { body });
      assert.equal(r.status, 400);
      isJson(r);
    });
  }

  const badRaw = { 'JSON hỏng': '{"name": ', 'body rỗng': '', 'body là mảng': '[]', 'body là null': 'null', 'body là số': '5' };
  for (const [label, raw] of Object.entries(badRaw)) {
    it(`400: ${label}`, async () => {
      assert.equal((await call('POST', '/products', { raw })).status, 400);
    });
  }

  it('400 không làm tăng id (lần POST hợp lệ kế tiếp vẫn nối tiếp)', async () => {
    await t.reset();
    await call('POST', '/products', { body: { name: 'x' } });
    const r = await call('POST', '/products', { body: sample });
    assert.equal(r.json.id, 4);
  });

  it('tiếng Việt có dấu lưu/đọc không lỗi font', async () => {
    const name = 'Mô hình Gundam Hạng Cao — Bút bi ✓';
    const r = await call('POST', '/products', { body: { name, price: 1, category: 'gundam' } });
    assert.equal(r.status, 201);
    assert.equal((await call('GET', `/products/${r.json.id}`)).json.name, name);
  });

  it('10 POST song song -> id không trùng', async () => {
    await t.reset();
    const rs = await Promise.all(
      Array.from({ length: 10 }, (_, i) => call('POST', '/products', { body: { ...sample, name: `P${i}` } }))
    );
    const ids = rs.map((r) => r.json.id);
    assert.ok(rs.every((r) => r.status === 201));
    assert.equal(new Set(ids).size, 10);
    assert.deepEqual([...ids].sort((a, b) => a - b), [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });
});

describe('PUT /products/:id (replace)', () => {
  before(() => t.reset());

  it('401 thiếu token', async () => {
    assert.equal((await call('PUT', '/products/1', { body: sample, token: false })).status, 401);
  });

  it('200 + thay toàn bộ, id giữ nguyên dù body có id khác', async () => {
    const r = await call('PUT', '/products/1', { body: { ...sample, id: 77 } });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { id: 1, ...sample });
    assert.deepEqual((await call('GET', '/products/1')).json, { id: 1, ...sample });
  });

  it('PUT không để sót field cũ (replace, không phải merge)', async () => {
    const r = await call('PUT', '/products/2', { body: { ...sample, extra: 1 } });
    assert.deepEqual(Object.keys(r.json).sort(), ['category', 'id', 'name', 'price']);
  });

  it('400 khi thiếu field', async () => {
    assert.equal((await call('PUT', '/products/1', { body: { name: 'a', price: 1 } })).status, 400);
  });

  it('404 khi không tồn tại / id sai định dạng', async () => {
    assert.equal((await call('PUT', '/products/999', { body: sample })).status, 404);
    assert.equal((await call('PUT', '/products/abc', { body: sample })).status, 404);
  });

  it('PUT không tạo mới (không upsert)', async () => {
    await call('PUT', '/products/999', { body: sample });
    assert.equal((await call('GET', '/products/999')).status, 404);
  });
});

describe('PATCH /products/:id (merge)', () => {
  before(() => t.reset());

  it('401 thiếu token', async () => {
    assert.equal((await call('PATCH', '/products/1', { body: { price: 1 }, token: false })).status, 401);
  });

  it('200 + chỉ đổi field gửi lên, giữ field còn lại', async () => {
    const r = await call('PATCH', '/products/3', { body: { price: 500000 } });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { id: 3, name: 'Charizard ex', price: 500000, category: 'pokemon' });
  });

  it('bỏ field lạ, không cho sửa id', async () => {
    const r = await call('PATCH', '/products/3', { body: { id: 50, hack: 1, name: 'Charizard VMAX' } });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { id: 3, name: 'Charizard VMAX', price: 500000, category: 'pokemon' });
    assert.equal((await call('GET', '/products/50')).status, 404);
  });

  it('400 khi field gửi lên sai kiểu', async () => {
    assert.equal((await call('PATCH', '/products/3', { body: { price: 'rẻ' } })).status, 400);
    assert.equal((await call('PATCH', '/products/3', { body: { name: '' } })).status, 400);
  });

  it('400 khi body không phải object', async () => {
    assert.equal((await call('PATCH', '/products/3', { raw: '[1]' })).status, 400);
    assert.equal((await call('PATCH', '/products/3', { raw: '' })).status, 400);
  });

  it('404 khi không tồn tại / id sai định dạng', async () => {
    assert.equal((await call('PATCH', '/products/999', { body: { price: 1 } })).status, 404);
    assert.equal((await call('PATCH', '/products/abc', { body: { price: 1 } })).status, 404);
  });
});

describe('DELETE /products/:id', () => {
  before(() => t.reset());

  it('401 thiếu token', async () => {
    assert.equal((await call('DELETE', '/products/3', { token: false })).status, 401);
  });

  it('204 không body, sau đó GET -> 404', async () => {
    const r = await call('DELETE', '/products/3');
    assert.equal(r.status, 204);
    assert.equal(r.text, '');
    assert.equal((await call('GET', '/products/3')).status, 404);
  });

  it('xoá lại -> 404', async () => {
    assert.equal((await call('DELETE', '/products/3')).status, 404);
    assert.equal((await call('DELETE', '/products/abc')).status, 404);
  });

  it('id KHÔNG được cấp lại sau DELETE', async () => {
    await t.reset();
    const a = await call('POST', '/products', { body: sample }); // id 4
    assert.equal(a.json.id, 4);
    assert.equal((await call('DELETE', '/products/4')).status, 204);
    const b = await call('POST', '/products', { body: sample });
    assert.equal(b.json.id, 5);
  });
});

describe('Route lạ / sai method', () => {
  it('404 JSON (không phải 500)', async () => {
    for (const [m, p] of [
      ['GET', '/'],
      ['GET', '/foo'],
      ['GET', '/products/1/extra'],
      ['POST', '/products/1'],
      ['DELETE', '/products'],
      ['PUT', '/products'],
      ['PATCH', '/products'],
    ]) {
      const r = await call(m, p, { body: m === 'GET' ? undefined : sample });
      assert.equal(r.status, 404, `${m} ${p}`);
      isJson(r);
    }
  });
});
