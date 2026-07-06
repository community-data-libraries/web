import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');

/** Canonical backend repo (sibling of web by default). */
export function getCanonicalBackendRoot() {
  if (process.env.BACKEND_ROOT) {
    return path.resolve(process.env.BACKEND_ROOT);
  }
  return path.resolve(webRoot, '../backend');
}

export function getCanonicalSourcesDir() {
  if (process.env.BACKEND_SOURCES_DIR) {
    return path.resolve(process.env.BACKEND_SOURCES_DIR);
  }
  return path.join(getCanonicalBackendRoot(), 'data/sources');
}

export function getWebSourcesDir() {
  return path.resolve(webRoot, 'backend/data/sources');
}

export const webRootPath = webRoot;
