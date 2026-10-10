/**
 * Package Script for Rona Extension
 * Creates a clean release-ready ZIP containing dist/ contents.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const releaseDir = path.resolve(rootDir, 'release');

if (!fs.existsSync(distDir)) {
  console.error('❌ dist/ does not exist. Run "npm run build" first.');
  process.exit(1);
}

fs.mkdirSync(releaseDir, { recursive: true });
const zipPath = path.resolve(releaseDir, 'rona-v1.0.0.zip');

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log('📦 Packaging Rona extension into release/rona-v1.0.0.zip...');
try {
  // Using native tar with automatic zip compression format
  execSync(`tar -a -c -f "${zipPath}" -C "${distDir}" .`, { stdio: 'inherit' });
  const stat = fs.statSync(zipPath);
  console.log(`✅ Package created successfully: ${zipPath} (${(stat.size / 1024).toFixed(2)} KB)`);
} catch (error) {
  console.error('❌ Failed to package extension:', error);
  process.exit(1);
}
