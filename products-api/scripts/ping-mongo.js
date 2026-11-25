'use strict';
// Kiểm tra kết nối MongoDB: node scripts/ping-mongo.js
require('../src/config');
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu MONGODB_URI trong .env');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
  try {
    await client.connect();
    const ping = await client.db('admin').command({ ping: 1 });
    const { version } = await client.db('admin').command({ buildInfo: 1 });
    const dbs = (await client.db().admin().listDatabases()).databases.map((d) => d.name);
    console.log('ping:', JSON.stringify(ping), '| MongoDB', version);
    console.log('databases:', dbs.join(', '));
  } finally {
    await client.close();
  }
})().catch((err) => {
  console.error('KẾT NỐI LỖI:', err.message); // không in URI (có thể chứa mật khẩu)
  process.exit(1);
});
