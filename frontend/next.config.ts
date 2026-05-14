import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: frontendRoot,
  },
  outputFileTracingRoot: frontendRoot,
};

export default nextConfig;
