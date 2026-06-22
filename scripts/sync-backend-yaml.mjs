/**
 * Copy canonical backend data/sources into web/backend/data/sources.
 *
 * Usage: node scripts/sync-backend-yaml.mjs
 */

import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  getCanonicalSourcesDir,
  getWebSourcesDir,
} from './backend-paths.mjs';

async function listSourceFiles(dir) {
  const names = await readdir(dir);
  const files = names.filter((n) => n.endsWith('.yml') || n.endsWith('.yaml'));
  for (const name of names) {
    const fullPath = path.join(dir, name);
    const info = await stat(fullPath);
    if (info.isFile() && !name.includes('.') && !files.includes(name)) {
      files.push(name);
    }
  }
  return files.sort();
}

async function fileHash(filePath) {
  const data = await readFile(filePath);
  return createHash('sha256').update(data).digest('hex');
}

async function main() {
  const canonicalDir = getCanonicalSourcesDir();
  const webDir = getWebSourcesDir();

  let canonicalStat;
  try {
    canonicalStat = await stat(canonicalDir);
  } catch {
    console.error(`Canonical backend sources not found: ${canonicalDir}`);
    console.error('Set BACKEND_SOURCES_DIR or BACKEND_ROOT to the backend repo path.');
    process.exit(1);
  }
  if (!canonicalStat.isDirectory()) {
    console.error(`Not a directory: ${canonicalDir}`);
    process.exit(1);
  }

  await mkdir(webDir, { recursive: true });

  const files = await listSourceFiles(canonicalDir);
  const copied = [];

  for (const file of files) {
    const src = path.join(canonicalDir, file);
    const dest = path.join(webDir, file);
    await cp(src, dest);
    copied.push(file);
  }

  const existing = await readdir(webDir);
  for (const name of existing) {
    if (copied.includes(name)) continue;
    const full = path.join(webDir, name);
    const info = await stat(full);
    if (info.isFile()) {
      await rm(full);
      console.log(`Removed stale mirror: ${name}`);
    }
  }

  console.log(`Mirrored ${copied.length} source file(s) from ${canonicalDir}`);
  console.log(`  → ${webDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
