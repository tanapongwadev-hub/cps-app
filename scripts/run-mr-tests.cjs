// Run vitest tests for materials-receiving via child_process
const { spawnSync } = require('child_process');
const path = require('path');
const root = path.join(__dirname, '..');
const result = spawnSync(
  process.execPath,
  [path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--reporter=verbose', 'src/features/materials-receiving'],
  { cwd: root, encoding: 'utf-8', stdio: 'pipe', maxBuffer: 32 * 1024 * 1024, env: { ...process.env, NODE_ENV: 'test' } },
);
console.log(result.stdout);
console.log('---STDERR---');
console.log(result.stderr);
console.log('EXIT:', result.status);
