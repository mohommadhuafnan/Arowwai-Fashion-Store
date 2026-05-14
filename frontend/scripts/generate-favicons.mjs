import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, 'public', 'arowwai-logo.png');
const bg = { r: 12, g: 12, b: 15, alpha: 1 };

async function resizePng(size) {
  return sharp(src)
    .resize(size, size, { fit: 'contain', background: bg })
    .png()
    .toBuffer();
}

async function main() {
  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(sizes.map((size) => resizePng(size)));
  const ico = await pngToIco(pngBuffers);

  const outputs = [
    ['public/favicon.ico', ico],
    ['src/app/favicon.ico', ico],
    ['public/favicon-16x16.png', await resizePng(16)],
    ['public/favicon-32x32.png', await resizePng(32)],
    ['public/apple-touch-icon.png', await resizePng(180)],
    ['src/app/icon.png', await resizePng(32)],
    ['src/app/apple-icon.png', await resizePng(180)],
  ];

  for (const [rel, data] of outputs) {
    const dest = path.join(root, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, data);
    console.log('wrote', rel);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
