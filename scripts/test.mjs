#!/usr/bin/env node
/**
 * Test runner script for @resurgam/seo-next.
 *
 * Resolves vitest from local node_modules, parent workspace, or npx.
 */

import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');

// Candidates for vitest binary/entry
const localVitestBin = resolve(packageRoot, 'node_modules/.bin/vitest');
const localVitestBinCmd = resolve(packageRoot, 'node_modules/.bin/vitest.cmd');
const localVitestMjs = resolve(packageRoot, 'node_modules/vitest/vitest.mjs');
const parentVitestMjs = resolve(packageRoot, '../licensing-platform/backend/node_modules/vitest/vitest.mjs');

const extraArgs = process.argv.slice(2);

let result;
if (existsSync(localVitestMjs)) {
  result = spawnSync(process.execPath, [localVitestMjs, ...extraArgs], { cwd: packageRoot, stdio: 'inherit' });
} else if (existsSync(parentVitestMjs)) {
  result = spawnSync(process.execPath, [parentVitestMjs, ...extraArgs], { cwd: packageRoot, stdio: 'inherit' });
} else if (existsSync(localVitestBinCmd) && process.platform === 'win32') {
  result = spawnSync(`"${localVitestBinCmd}"`, extraArgs, { cwd: packageRoot, stdio: 'inherit', shell: true });
} else if (existsSync(localVitestBin)) {
  result = spawnSync(localVitestBin, extraArgs, { cwd: packageRoot, stdio: 'inherit' });
} else {
  result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vitest', ...extraArgs], { cwd: packageRoot, stdio: 'inherit' });
}

process.exit(result.status ?? 0);

