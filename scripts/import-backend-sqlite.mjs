/**
 * Import canonical backend YAML sources into SQLite and mirror DB to web/backend.
 *
 * Usage: npm run backend:import
 */

import { cp, mkdir } from 'node:fs/promises';
import { statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getCanonicalBackendRoot, webRootPath } from './backend-paths.mjs';

function resolvePython(backendRoot) {
  const venvPython = path.join(backendRoot, '.venv/bin/python3');
  try {
    statSync(venvPython);
    return venvPython;
  } catch {
    return 'python3';
  }
}

async function main() {
  const backendRoot = getCanonicalBackendRoot();
  const importScript = path.join(backendRoot, 'pythonscripts/import_sources_to_sqlite.py');

  try {
    statSync(importScript);
  } catch {
    console.error(`Import script not found: ${importScript}`);
    process.exit(1);
  }

  const python = resolvePython(backendRoot);
  const result = spawnSync(python, [importScript, 'all'], {
    cwd: backendRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const srcDb = path.join(backendRoot, 'database/sources.db');
  const destDir = path.join(webRootPath, 'backend/database');
  const destDb = path.join(destDir, 'sources.db');

  await mkdir(destDir, { recursive: true });
  await cp(srcDb, destDb);
  console.log(`Mirrored SQLite database → ${destDb}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
