import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const authPath = join(
  process.env.APPDATA || process.env.HOME || '',
  process.platform === 'win32' ? '../Roaming/com.vercel.cli/Data/auth.json' : '.vercel/auth.json'
);

// Use Vercel global config path on Windows
const winAuth = 'C:\\Users\\PC\\AppData\\Roaming\\com.vercel.cli\\Data\\auth.json';

async function main() {
  const auth = JSON.parse(readFileSync(winAuth, 'utf8'));
  const projectId = 'prj_SUr41vh7Y0eqR2Ypkj35x5XcfXJK';
  const teamId = 'team_Cya7mfQbkWWg7IvSoiOJIGd3';

  const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rootDirectory: 'frontend',
      framework: 'nextjs',
      buildCommand: 'npm run build',
      installCommand: 'NPM_CONFIG_PRODUCTION=false npm install && NPM_CONFIG_PRODUCTION=false npm install --prefix ../backend',
      outputDirectory: null,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Failed:', data);
    process.exit(1);
  }
  console.log('Updated project rootDirectory to frontend');
}

main();
