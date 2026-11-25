'use strict';
// Chạy bộ test hợp đồng lần lượt cho từng target: node scripts/run-tests.js baseline file mongo
const { spawnSync } = require('child_process');
const path = require('path');

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('Usage: node scripts/run-tests.js <baseline|file|mongo> ...');
  process.exit(2);
}
let failed = false;
for (const target of targets) {
  console.log(`\n===== TARGET: ${target} =====`);
  const r = spawnSync(process.execPath, ['--test', 'test/*.test.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, TARGET: target },
  });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
