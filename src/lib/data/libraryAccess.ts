import type { CollectionEntry } from 'astro:content';

export type AudienceRole = 'teacher' | 'student' | 'community';

type MasterLibraryEntry = CollectionEntry<'master-library'>;

const defaultAudienceAccess = {
  teacher: true,
  student: true,
  community: true,
};

const restrictedKeywords = ['opioid', 'drug', 'addiction'];
const excludedPedagogicalTags = new Set(['year']);

const geographicTagPattern =
  /(^|[-_\s])(county|state|city|zip|zipcode|fips|tract|district|region|local|community|tribal|national)($|[-_\s])/i;

const forcedUppercaseWords = new Set(['fips', 'zip', 'usa', 'us']);

function toTitleCaseTag(value: string): string {
  const words = value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean);

  return words
    .map((word) => {
      const lower = word.toLowerCase();
      if (forcedUppercaseWords.has(lower)) {
        return lower.toUpperCase();
      }
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join(' ');
}

export function sanitizePedagogicalTags(tags: string[]): string[] {
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .filter((tag) => !excludedPedagogicalTags.has(tag.toLowerCase()));
}

export function formatTagLabel(tag: string): string {
  return toTitleCaseTag(tag);
}

export function formatGeographicTagLabel(tag: string): string {
  const trimmed = tag.trim();
  if (trimmed.length === 0) return trimmed;
  if (!geographicTagPattern.test(trimmed)) return trimmed;
  return toTitleCaseTag(trimmed);
}

export function canAudienceAccess(entry: MasterLibraryEntry, audience: AudienceRole): boolean {
  const access = entry.data.audienceAccess ?? defaultAudienceAccess;
  if (!access[audience]) {
    return false;
  }

  if (audience === 'teacher') {
    return true;
  }

  if (audience === 'student' && entry.data.sensitive) {
    return false;
  }

  const themes = [...entry.data.dataThemes, ...entry.data.tags].map((theme) => theme.toLowerCase());
  if (audience === 'student') {
    return !themes.some((theme) => restrictedKeywords.some((keyword) => theme.includes(keyword)));
  }

  return true;
}

export function audienceLabel(audience: AudienceRole): string {
  if (audience === 'teacher') return 'Teacher';
  if (audience === 'student') return 'Student';
  return 'Community Member';
}

export function extractThemes(entries: MasterLibraryEntry[], audience: AudienceRole): string[] {
  return Array.from(
    new Set(
      entries
        .filter((entry) => canAudienceAccess(entry, audience))
        .flatMap((entry) => entry.data.dataThemes.length > 0 ? entry.data.dataThemes : entry.data.tags),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function extractPedagogicalTags(entries: MasterLibraryEntry[]): string[] {
  const cleaned = entries.flatMap((entry) => sanitizePedagogicalTags(entry.data.pedagogicalTags));
  return Array.from(
    new Set(cleaned),
  ).sort((left, right) => left.localeCompare(right));
}