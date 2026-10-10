/**
 * Build Script for Rona Chrome Extension
 * Compiles TypeScript & assets into an unpacked Manifest V3 extension ready for Chrome & Brave.
 */

import { build } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

async function compileExtension() {
  console.log('🚀 Starting Rona Extension Build...');

  // Ensure fresh dist directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 1. Build Content Script as standalone IIFE (no imports/chunks)
  console.log('📦 Compiling Content Script (content.js)...');
  await build({
    configFile: false,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      minify: 'esbuild',
      lib: {
        entry: path.resolve(rootDir, 'src/content/index.ts'),
        name: 'RonaContent',
        formats: ['iife'],
        fileName: () => 'content.js'
      }
    }
  });

  // 2. Build Background Service Worker
  console.log('📦 Compiling Background Worker (background.js)...');
  await build({
    configFile: false,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      minify: 'esbuild',
      lib: {
        entry: path.resolve(rootDir, 'src/background/index.ts'),
        formats: ['es'],
        fileName: () => 'background.js'
      }
    }
  });

  // 3. Build Popup
  console.log('📦 Compiling Popup...');
  const popupDist = path.resolve(distDir, 'popup');
  fs.mkdirSync(popupDist, { recursive: true });
  await build({
    configFile: false,
    root: path.resolve(rootDir, 'src/popup'),
    base: '',
    build: {
      outDir: popupDist,
      emptyOutDir: false,
      rollupOptions: {
        input: path.resolve(rootDir, 'src/popup/index.html')
      }
    }
  });

  // 4. Build Options
  console.log('📦 Compiling Options...');
  const optionsDist = path.resolve(distDir, 'options');
  fs.mkdirSync(optionsDist, { recursive: true });
  await build({
    configFile: false,
    root: path.resolve(rootDir, 'src/options'),
    base: '',
    build: {
      outDir: optionsDist,
      emptyOutDir: false,
      rollupOptions: {
        input: path.resolve(rootDir, 'src/options/index.html')
      }
    }
  });

  // 5. Copy manifest.json and icons
  console.log('📄 Copying Manifest & Icons...');
  fs.copyFileSync(
    path.resolve(rootDir, 'public/manifest.json'),
    path.resolve(distDir, 'manifest.json')
  );

  const iconsSrc = path.resolve(rootDir, 'public/icons');
  const iconsDist = path.resolve(distDir, 'icons');
  if (fs.existsSync(iconsSrc)) {
    fs.cpSync(iconsSrc, iconsDist, { recursive: true });
  }

  console.log('✅ Rona extension built successfully in dist/!');
}

compileExtension().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
