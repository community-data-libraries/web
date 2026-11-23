/**
 * Usage analytics: the parts that don't touch the browser, so they can be unit
 * tested (tests/analytics.test.ts). The browser side is src/lib/client/analytics.ts.
 *
 * What we record and why is documented in docs/technical/analytics.md.
 */

/** How the visitor is asked. 'opt-in': nothing is recorded until they click Allow. */
export type ConsentMode = 'opt-in' | 'notice';
export type ConsentChoice = 'granted' | 'denied';

export const CONSENT_STORAGE_KEY = 'cdl:analytics-consent';

/** The PostHog requests go through this path on our own domain (netlify.toml proxies it). */
export const ANALYTICS_PROXY_PATH = '/cdl-relay';

export function normalizeConsentMode(value: string | undefined | null): ConsentMode {
  return value?.trim().toLowerCase() === 'notice' ? 'notice' : 'opt-in';
}

export function normalizeConsentChoice(value: string | undefined | null): ConsentChoice | null {
  return value === 'granted' || value === 'denied' ? value : null;
}

/**
 * Whether analytics may run for a stored choice. Opt-in needs an explicit Allow;
 * notice mode runs unless the visitor opted out.
 */
export function analyticsAllowed(mode: ConsentMode, choice: ConsentChoice | null): boolean {
  return mode === 'opt-in' ? choice === 'granted' : choice !== 'denied';
}

// Query parameters that can carry a login token or personal data. Netlify Identity
// links put their tokens after "#", which sanitizeUrl drops entirely.
const SENSITIVE_PARAMS = new Set([
  'auth',
  'token',
  'access_token',
  'refresh_token',
  'confirmation_token',
  'invite_token',
  'recovery_token',
  'email_change_token',
  'code',
  'email',
  'name',
]);

/** A URL with its fragment and any sensitive query parameters removed. Non-URLs pass through. */
export function sanitizeUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value.split('#')[0];
  }
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (SENSITIVE_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  return url.toString();
}

/** The site is served under /web/ on the main domain; library subdomains have no prefix. */
export function stripBasePath(pathname: string): string {
  const stripped = pathname.replace(/^\/web(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
}

/** Pages that are never tracked: librarian sign-in and editing, which handle accounts. */
export function isExcludedPath(pathname: string): boolean {
  const path = stripBasePath(pathname);
  return /^\/librarian(\/|$)/.test(path) || /^\/admin(\/|$)/.test(path);
}

const MAIN_PAGES: Record<string, string> = {
  '/': 'home',
  '/complete-catalog': 'complete_catalog',
  '/data-preview': 'data_preview',
  '/data-resources': 'data_resources',
  '/libraries': 'find_library',
  '/create-community-library': 'create_library',
  '/submit': 'suggest_dataset',
  '/maps': 'maps',
  '/teacher': 'teacher',
  '/student': 'student',
  '/community-member': 'community_member',
  '/community-library': 'community_library',
  '/privacy': 'privacy',
};

/**
 * A short name for the page, so reports can group pages without parsing URLs.
 * `libraryPage` is set on community library pages, whose paths differ between the
 * main site (/communities/<slug>/catalog/) and a library subdomain (/catalog/).
 */
export function pageType(pathname: string, libraryPage?: string | null): string {
  if (libraryPage) return `library_${libraryPage}`;
  const path = stripBasePath(pathname).replace(/\/+$/, '') || '/';
  if (MAIN_PAGES[path]) return MAIN_PAGES[path];
  if (path.startsWith('/communities/')) return 'library_other';
  if (path.startsWith('/example-community-library')) return 'example_library';
  if (path.startsWith('/geo')) return 'geo';
  return 'other';
}

/**
 * A catalog search term that is safe to record: trimmed, lower-cased, at most 60
 * characters. Terms that look like an email address or a long number are dropped.
 */
export function cleanSearchTerm(value: string): string | null {
  const term = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (term.length < 2) return null;
  if (term.includes('@') || /\d{5,}/.test(term)) return null;
  return term.slice(0, 60);
}

/** Splits a "a|b|c" data attribute into a list. */
export function splitList(value: string | undefined | null): string[] {
  return (value ?? '')
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean);
}

// PostHog properties that hold a URL; all of them are sanitized before sending.
const URL_PROPERTIES = ['$current_url', '$referrer', '$initial_referrer', '$prev_pageview_pathname'];

interface OutgoingEvent {
  event: string;
  properties?: Record<string, unknown>;
}

/**
 * Applied to every event before it leaves the browser: drops events from excluded
 * pages and strips fragments and sensitive parameters from URL properties.
 */
export function scrubEvent<T extends OutgoingEvent>(event: T | null): T | null {
  if (!event) return null;
  const props = event.properties ?? {};
  const pathname = typeof props.$pathname === 'string' ? props.$pathname : '';
  if (pathname && isExcludedPath(pathname)) return null;
  for (const key of URL_PROPERTIES) {
    const value = props[key];
    if (typeof value === 'string' && value !== '$direct') props[key] = sanitizeUrl(value);
  }
  return event;
}
