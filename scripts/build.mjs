#!/usr/bin/env node
/**
 * Build script for @resurgam/seo-next.
 *
 * Compiles TypeScript declarations, ESM and CommonJS bundles into dist/.
 */

import { execSync } from 'child_process';
import { copyFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');
const distDir = resolve(packageRoot, 'dist');

console.log('Compiling TypeScript...');
const parentTsc = resolve(packageRoot, '../licensing-platform/backend/node_modules/typescript/bin/tsc');
if (existsSync(parentTsc)) {
  execSync(`node "${parentTsc}" --project tsconfig.json`, { cwd: packageRoot, stdio: 'inherit' });
} else {
  execSync('npx tsc --project tsconfig.json', { cwd: packageRoot, stdio: 'inherit' });
}

// Generate .mjs mirrors for ESM consumers
function generateMjsMirrors(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      generateMjsMirrors(fullPath);
    } else if (extname(entry) === '.js') {
      const mjsPath = join(dir, entry.replace(/\.js$/, '.mjs'));
      copyFileSync(fullPath, mjsPath);
    }
  }
}

if (existsSync(distDir)) {
  generateMjsMirrors(distDir);
}

console.log('Build completed successfully.');

