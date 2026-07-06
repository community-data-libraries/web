/**
 * Sync backend YAML sources into master-library content collection entries.
 *
 * Usage (from web repo root):
 *   npm run sync:backend-yaml   # mirror canonical backend YAML first
 *   npm run sync:catalog
 *
 * Reads canonical backend sources (BACKEND_SOURCES_DIR or ../backend/data/sources).
 * Falls back to web/backend/data/sources if canonical path is unavailable.
 */

import { mkdir, readdir, readFile, stat, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import {
  getCanonicalSourcesDir,
  getWebSourcesDir,
} from './backend-paths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../src/content/master-library/datasets');

async function resolveSourcesDir() {
  const canonical = getCanonicalSourcesDir();
  try {
    const info = await stat(canonical);
    if (info.isDirectory()) return canonical;
  } catch {
    // fall through
  }
  const webMirror = getWebSourcesDir();
  try {
    await stat(webMirror);
    console.warn(`Using web mirror (canonical not found): ${webMirror}`);
    return webMirror;
  } catch {
    throw new Error(
      `No backend sources found. Set BACKEND_SOURCES_DIR or run npm run sync:backend-yaml`,
    );
  }
}

function slugifyTag(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDescriptionTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === 'object') {
    return Object.entries(tags)
      .filter(([, active]) => active)
      .map(([name]) => String(name).trim())
      .filter(Boolean);
  }
  return [];
}

function extractPedagogicalTags(source, limit = 8) {
  const tags = [];
  for (const [key, value] of Object.entries(source)) {
    if (!key.endsWith('_tags') || key === 'description_tags') continue;
    if (typeof value !== 'object' || value === null) continue;
    for (const [tagName, active] of Object.entries(value)) {
      if (active) tags.push(tagName.replace(/-/g, ' '));
    }
  }
  return [...new Set(tags)].slice(0, limit);
}

function variableCount(source) {
  return (source.variables ?? source.variable_names ?? []).length;
}

function buildDescription(source) {
  const provider = source.provider?.name ?? 'a government data provider';
  const agency = source.provider?.agency;
  const themes = normalizeDescriptionTags(source.description_tags);

  const intro = agency
    ? `${source.title} from ${provider} (${agency}).`
    : `${source.title} from ${provider}.`;

  const themeSentence =
    themes.length > 0
      ? ` Topics include ${themes.slice(0, 5).join(', ')}${themes.length > 5 ? ', and more' : ''}.`
      : '';

  const accessNote = source.requires_account
    ? ' A free provider account is required to download the full dataset.'
    : source.download?.url
      ? ' Data is available for direct download.'
      : source.download?.description
        ? ` ${source.download.description}`
        : '';

  const detail = source.notes
    ? ` ${source.notes.length > 200 ? `${source.notes.slice(0, 197)}...` : source.notes}`
    : '';

  return (intro + themeSentence + accessNote + detail).replace(/\s+/g, ' ').trim();
}

function buildTags(source, themes) {
  const tags = new Set(['dataset', 'government-data']);
  if (source.provider?.agency) {
    const agency = source.provider.agency.split(' ').slice(-1)[0]?.toLowerCase();
    if (agency) tags.add(slugifyTag(agency));
  }
  if (source.filters?.state) tags.add('state');
  if (source.filters?.county) tags.add('county');
  if (source.filters?.year) tags.add('year');
  if (source.requires_account) tags.add('account-required');
  for (const theme of themes) {
    tags.add(slugifyTag(theme));
  }
  return [...tags];
}

function inferDifficulty(source) {
  if (source.requires_account) return 'advanced';
  const count = variableCount(source);
  if (count > 30) return 'advanced';
  if (count > 15) return 'intermediate';
  return 'beginner';
}

function yamlQuote(value) {
  const text = String(value);
  if (text.includes('"') || text.includes(':') || text.includes('\n')) {
    return JSON.stringify(text);
  }
  return `"${text}"`;
}

function buildMarkdown(source) {
  const themes = normalizeDescriptionTags(source.description_tags);
  const pedagogicalTags = extractPedagogicalTags(source);
  const description = buildDescription(source);
  const tags = buildTags(source, themes);
  const dataThemes = themes.map((t) => slugifyTag(t)).filter(Boolean);
  const author = source.provider?.name ?? 'Unknown provider';
  const url = source.provider?.url ?? source.download?.url ?? '';
  const difficulty = inferDifficulty(source);

  const lines = [
    '---',
    `title: ${yamlQuote(source.title)}`,
    `description: ${yamlQuote(description)}`,
    `author: ${yamlQuote(author)}`,
    `sourceId: ${yamlQuote(source.id)}`,
    `category: "dataset"`,
    `syncedFromBackend: true`,
    'tags:',
    ...tags.map((t) => `  - ${yamlQuote(t)}`),
    'dataThemes:',
    ...(dataThemes.length ? dataThemes.map((t) => `  - ${yamlQuote(t)}`) : ['  - general']),
    'pedagogicalTags:',
    ...(pedagogicalTags.length
      ? pedagogicalTags.map((t) => `  - ${yamlQuote(t)}`)
      : ['  - data-literacy']),
    'audienceAccess:',
    '  teacher: true',
    '  student: true',
    '  community: true',
    `sensitive: ${source.sensitive === true}`,
    ...(url ? [`url: ${yamlQuote(url)}`] : []),
    'featured: false',
    `difficulty: ${yamlQuote(difficulty)}`,
    'language: "English"',
    '---',
    '',
    `${source.title} — synced from the backend source catalog (\`${source.id}\`).`,
    '',
    'Use the **Data Preview** page to explore column statistics, geographic filters, and sample rows.',
    '',
  ];

  if (source.requires_account) {
    lines.push('> **Note:** This provider requires a free account to download the full dataset.', '');
  }

  return lines.join('\n');
}

async function listSourceFiles(sourcesDir) {
  const names = await readdir(sourcesDir);
  const files = names.filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'));
  for (const name of names) {
    const fullPath = path.join(sourcesDir, name);
    const info = await stat(fullPath);
    if (info.isFile() && !name.includes('.') && !files.includes(name)) {
      files.push(name);
    }
  }
  return files.sort();
}

async function main() {
  const sourcesDir = await resolveSourcesDir();
  const files = await listSourceFiles(sourcesDir);

  await mkdir(outputDir, { recursive: true });

  const written = [];
  for (const file of files.sort()) {
    const raw = await readFile(path.join(sourcesDir, file), 'utf8');
    const source = YAML.parse(raw);
    if (!source?.id || !source?.title) {
      console.warn(`Skipping ${file}: missing id or title`);
      continue;
    }
    const outPath = path.join(outputDir, `${source.id}.md`);
    await writeFile(outPath, buildMarkdown(source), 'utf8');
    written.push(source.id);
  }

  const existing = (await readdir(outputDir)).filter((f) => f.endsWith('.md'));
  for (const file of existing) {
    const id = file.replace(/\.md$/, '');
    if (!written.includes(id)) {
      await rm(path.join(outputDir, file));
      console.log(`Removed stale entry: ${file}`);
    }
  }

  console.log(`Synced ${written.length} dataset(s) from ${sourcesDir}`);
  console.log(`  → ${outputDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
