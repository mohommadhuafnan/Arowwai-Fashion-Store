import { cpSync, existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const frontendRoot = process.cwd();
const source = join(frontendRoot, '../backend');
const target = join(frontendRoot, 'server-backend');

if (!existsSync(source)) {
  console.warn('sync-backend: ../backend not found, skipping');
  process.exit(0);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, {
  recursive: true,
  filter: (src) => !src.includes('node_modules') && !src.endsWith('.env'),
});
console.log('sync-backend: copied backend to frontend/server-backend');

execSync('npm install', { cwd: target, stdio: 'inherit' });
console.log('sync-backend: installed server-backend dependencies');
