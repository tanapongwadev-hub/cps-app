// Run next build via child_process
const { spawnSync } = require('child_process');
const path = require('path');
const root = path.join(__dirname, '..');
const pnpm = path.join(process.env.APPDATA || '', 'npm', 'pnpm.cmd');
const result = spawnSync(
  'cmd.exe',
  ['/c', pnpm, 'build'],
  { cwd: root, encoding: 'utf-8', stdio: 'pipe', maxBuffer: 32 * 1024 * 1024 },
);
console.log(result.stdout);
console.log('---STDERR---');
console.log(result.stderr);
console.log('EXIT:', result.status);
