import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseEnvFile(filePath) {
  const out = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    out[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return out;
}

const backend = parseEnvFile(join(root, 'backend', '.env'));
const frontend = parseEnvFile(join(root, 'frontend', '.env.local'));

const vars = {
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://arowwai-fashion-store.vercel.app',
  NEXT_PUBLIC_API_URL: 'https://arowwai-fashion-store.vercel.app/api',
  NEXT_PUBLIC_APP_URL: 'https://arowwai-fashion-store.vercel.app',
  MONGODB_URI: backend.MONGODB_URI,
  MONGODB_URI_SRV: backend.MONGODB_URI_SRV,
  JWT_SECRET: backend.JWT_SECRET,
  JWT_EXPIRE: backend.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: backend.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRE: backend.JWT_REFRESH_EXPIRE || '30d',
  GITHUB_TOKEN: backend.GITHUB_TOKEN,
  GITHUB_AI_MODEL: backend.GITHUB_AI_MODEL || 'deepseek/DeepSeek-V3-0324',
  FIREBASE_PROJECT_ID: backend.FIREBASE_PROJECT_ID || 'fashion-mate-mawanella',
  NEXT_PUBLIC_FIREBASE_API_KEY: frontend.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: frontend.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: frontend.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: frontend.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: frontend.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: frontend.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: frontend.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const environments = ['production', 'preview', 'development'];

function runVercel(args, value) {
  return execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vercel', ...args], {
    cwd: root,
    input: value,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
}

function addOrUpdate(name, value, environment) {
  try {
    runVercel(['env', 'add', name, environment], value);
    console.log(`+ ${name} (${environment})`);
  } catch {
    try {
      runVercel(['env', 'update', name, environment], value);
      console.log(`~ ${name} (${environment})`);
    } catch (err) {
      console.error(`! ${name} (${environment}): ${err.stderr?.toString() || err.message}`);
    }
  }
}

for (const [name, value] of Object.entries(vars)) {
  if (!value) {
    console.warn(`skip ${name} (empty)`);
    continue;
  }
  for (const environment of environments) {
    addOrUpdate(name, value, environment);
  }
}

console.log('\nDone. Run: npx vercel env ls');
