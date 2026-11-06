#!/usr/bin/env node
/**
 * Build script for @resurgam/seo-next.
 *
 * Compiles TypeScript declarations, ESM and CommonJS bundles into dist/.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');

console.log('Compiling TypeScript declarations...');
const parentTsc = resolve(packageRoot, '../licensing-platform/backend/node_modules/typescript/bin/tsc');
if (existsSync(parentTsc)) {
  execSync(`node "${parentTsc}" --project tsconfig.json --declaration --emitDeclarationOnly`, { cwd: packageRoot, stdio: 'inherit' });
} else {
  execSync('npx tsc --project tsconfig.json --declaration --emitDeclarationOnly', { cwd: packageRoot, stdio: 'inherit' });
}

console.log('Building ESM and CommonJS bundles with esbuild...');
await esbuild.build({
  entryPoints: [resolve(packageRoot, 'src/index.ts')],
  outfile: resolve(packageRoot, 'dist/index.mjs'),
  format: 'esm',
  bundle: true,
  external: ['react', 'next', 'next/*'],
  sourcemap: true,
  target: 'es2022',
});

await esbuild.build({
  entryPoints: [resolve(packageRoot, 'src/index.ts')],
  outfile: resolve(packageRoot, 'dist/index.js'),
  format: 'cjs',
  bundle: true,
  external: ['react', 'next', 'next/*'],
  sourcemap: true,
  target: 'es2022',
});

console.log('Build completed successfully.');
