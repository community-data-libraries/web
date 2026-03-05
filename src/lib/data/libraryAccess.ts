import type { CollectionEntry } from 'astro:content';

export type AudienceRole = 'teacher' | 'student' | 'community';

type MasterLibraryEntry = CollectionEntry<'master-library'>;

const defaultAudienceAccess = {
  teacher: true,
  student: true,
  community: true,
};

const restrictedKeywords = ['opioid', 'drug', 'addiction'];

export function canAudienceAccess(entry: MasterLibraryEntry, audience: AudienceRole): boolean {
  const access = entry.data.audienceAccess ?? defaultAudienceAccess;
  if (!access[audience]) {
    return false;
  }

  if (audience === 'teacher') {
    return true;
  }

  if (entry.data.sensitive) {
    return false;
  }

  const themes = [...entry.data.dataThemes, ...entry.data.tags].map((theme) => theme.toLowerCase());
  return !themes.some((theme) => restrictedKeywords.some((keyword) => theme.includes(keyword)));
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
  return Array.from(
    new Set(entries.flatMap((entry) => entry.data.pedagogicalTags)),
  ).sort((left, right) => left.localeCompare(right));
}