/**
 * Run variable extraction on pipeline-ready backend sources, then import SQLite.
 *
 * Usage: npm run backend:pipeline
 *
 * Requires Python venv in canonical backend:
 *   cd ../backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
 */

import { readFile, stat } from 'node:fs/promises';
import { statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { getCanonicalBackendRoot, getCanonicalSourcesDir, webRootPath } from './backend-paths.mjs';

function resolvePython(backendRoot) {
  const venvPython = path.join(backendRoot, '.venv/bin/python3');
  try {
    statSync(venvPython);
    return venvPython;
  } catch {
    return 'python3';
  }
}

async function listSourceFiles(dir) {
  const { readdir } = await import('node:fs/promises');
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

function isPipelineReady(doc) {
  const provider = doc.provider ?? {};
  const download = doc.download ?? {};
  return Boolean(provider.url && download.url);
}

async function main() {
  const backendRoot = getCanonicalBackendRoot();
  const sourcesDir = getCanonicalSourcesDir();
  const extractScript = path.join(backendRoot, 'pythonscripts/variableextraction.py');
  const python = resolvePython(backendRoot);

  const files = await listSourceFiles(sourcesDir);
  const ready = [];
  for (const file of files) {
    const doc = YAML.parse(await readFile(path.join(sourcesDir, file), 'utf8'));
    if (isPipelineReady(doc)) {
      ready.push(file);
    }
  }

  console.log(`Running variable extraction on ${ready.length} pipeline-ready source(s) using ${python}...`);

  for (const file of ready) {
    console.log(`\n→ ${file}`);
    const result = spawnSync(python, [extractScript, file], {
      cwd: backendRoot,
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      console.warn(`Warning: extraction failed for ${file} (exit ${result.status})`);
    }
  }

  console.log('\nImporting sources into SQLite...');
  const importResult = spawnSync('node', ['scripts/import-backend-sqlite.mjs'], {
    cwd: webRootPath,
    stdio: 'inherit',
  });
  process.exit(importResult.status ?? 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
