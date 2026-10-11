/**
 * Automated GitHub Release Publisher for Rona
 * Uses Git Credential Manager to publish v0.1.0 and upload rona-v0.1.0.zip
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const repo = '4rmnd/rona';

const pkgJson = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf8'));
const version = pkgJson.version || '0.1.1';
const tagName = `v${version}`;
const releaseTitle = `Rona v${version}`;

function getGitHubToken() {
  try {
    const creds = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n',
      encoding: 'utf8'
    });
    for (const line of creds.split('\n')) {
      if (line.startsWith('password=')) {
        return line.substring('password='.length).trim();
      }
    }
  } catch (err) {
    console.error('Failed to get credentials:', err.message);
  }
  return null;
}

async function publishRelease() {
  const token = getGitHubToken();
  if (!token) {
    console.error('❌ Could not retrieve GitHub token from Git Credential Manager.');
    process.exit(1);
  }

  console.log(`🚀 Connecting to GitHub API for ${repo}...`);

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Rona-Release-Script'
  };

  // Read release body
  const notesPath = path.resolve(rootDir, `RELEASE_NOTES_v${version}.md`);
  const releaseBody = fs.existsSync(notesPath)
    ? fs.readFileSync(notesPath, 'utf8')
    : `Release notes for Rona v${version}.`;

  // Check if release already exists
  let release;
  const existingRes = await fetch(
    `https://api.github.com/repos/${repo}/releases/tags/${tagName}`,
    { headers }
  );

  if (existingRes.ok) {
    release = await existingRes.json();
    console.log(`ℹ️ Release for ${tagName} already exists (ID: ${release.id}). Updating...`);
    // Update body & title
    const updateRes = await fetch(`https://api.github.com/repos/${repo}/releases/${release.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: releaseTitle,
        body: releaseBody,
        draft: false,
        prerelease: false
      })
    });
    release = await updateRes.json();
  } else {
    console.log(`📝 Creating new release for ${tagName}...`);
    const createRes = await fetch(`https://api.github.com/repos/${repo}/releases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: tagName,
        target_commitish: 'main',
        name: releaseTitle,
        body: releaseBody,
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create release (${createRes.status}): ${errText}`);
    }
    release = await createRes.json();
    console.log(`✅ Release created successfully: ${release.html_url}`);
  }

  // Upload release asset
  const zipPath = path.resolve(rootDir, `release/rona-v${version}.zip`);
  if (!fs.existsSync(zipPath)) {
    throw new Error(`Asset file ${zipPath} not found. Run npm run package first.`);
  }

  const zipBuffer = fs.readFileSync(zipPath);
  const assetName = `rona-v${version}.zip`;


  // Check if asset already exists on this release
  if (Array.isArray(release.assets)) {
    for (const asset of release.assets) {
      if (asset.name === assetName) {
        console.log(`🗑️ Deleting existing asset ${assetName} (ID: ${asset.id})...`);
        await fetch(`https://api.github.com/repos/${repo}/releases/assets/${asset.id}`, {
          method: 'DELETE',
          headers
        });
      }
    }
  }

  console.log(`📦 Uploading asset ${assetName} (${(zipBuffer.length / 1024).toFixed(2)} KB)...`);
  const rawUploadUrl = release.upload_url.replace(/\{(\?.*)?\}$/, '');
  const uploadUrl = `${rawUploadUrl}?name=${encodeURIComponent(assetName)}`;

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/zip',
      'Content-Length': zipBuffer.length.toString(),
      'User-Agent': 'Rona-Release-Script'
    },
    body: zipBuffer
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Failed to upload asset (${uploadRes.status}): ${errText}`);
  }

  const assetData = await uploadRes.json();
  console.log(`✅ Asset uploaded successfully: ${assetData.browser_download_url}`);
  console.log(`\n🎉 GitHub Release published at: ${release.html_url}`);
}

publishRelease().catch((err) => {
  console.error('❌ Error publishing release:', err);
  process.exit(1);
});
