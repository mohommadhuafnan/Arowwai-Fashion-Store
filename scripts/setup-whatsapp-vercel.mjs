#!/usr/bin/env node
/**
 * Add WhatsApp Business API env vars to Vercel.
 * Usage:
 *   node scripts/setup-whatsapp-vercel.mjs <ACCESS_TOKEN> <PHONE_NUMBER_ID>
 * Or set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your shell first.
 */
import { execSync } from 'child_process';
import readline from 'readline';

const token = process.argv[2] || process.env.WHATSAPP_ACCESS_TOKEN;
const phoneId = process.argv[3] || process.env.WHATSAPP_PHONE_NUMBER_ID;

function run(cmd) {
  console.log(`> ${cmd.replace(token || '', '***').replace(phoneId || '', '***')}`);
  execSync(cmd, { stdio: 'inherit', cwd: new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });
}

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  let accessToken = token;
  let numberId = phoneId;

  if (!accessToken) accessToken = await prompt('Paste WHATSAPP_ACCESS_TOKEN: ');
  if (!numberId) numberId = await prompt('Paste WHATSAPP_PHONE_NUMBER_ID: ');

  if (!accessToken || !numberId) {
    console.error('Both WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required.');
    process.exit(1);
  }

  const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
  process.chdir(root);

  for (const env of ['production', 'development', 'preview']) {
    for (const [key, value] of [
      ['WHATSAPP_ACCESS_TOKEN', accessToken],
      ['WHATSAPP_PHONE_NUMBER_ID', numberId],
      ['WHATSAPP_API_VERSION', 'v21.0'],
    ]) {
      try {
        execSync(`echo ${JSON.stringify(value)} | vercel env add ${key} ${env} --force`, { stdio: 'pipe' });
        console.log(`Set ${key} for ${env}`);
      } catch {
        console.log(`Skipped or failed ${key} for ${env} (may already exist)`);
      }
    }
  }

  console.log('\nDone. Redeploy Vercel, then test POS → Send PDF to customer.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
