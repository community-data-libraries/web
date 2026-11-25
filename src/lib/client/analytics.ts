/**
 * Usage analytics in the browser (PostHog). Off unless PUBLIC_POSTHOG_KEY is set at
 * build time, and with the default PUBLIC_ANALYTICS_CONSENT=opt-in nothing is sent
 * until the visitor clicks Allow on the notice (src/components/Analytics.astro).
 *
 * - No cookies: PostHog keeps its anonymous ID in sessionStorage, so it ends with the tab.
 * - No autocapture, session recording, surveys or person profiles. Only the events
 *   below and pageviews are sent.
 * - URLs lose their "#..." part and any token/email parameters (scrubEvent).
 * - Librarian sign-in and editing pages are never tracked.
 *
 * The library is loaded only after consent, so visitors who decline never download it.
 * Event names and properties: docs/technical/analytics.md.
 */
import {
  ANALYTICS_PROXY_PATH,
  CONSENT_STORAGE_KEY,
  analyticsAllowed,
  cleanSearchTerm,
  isExcludedPath,
  normalizeConsentChoice,
  normalizeConsentMode,
  pageType,
  scrubEvent,
  type ConsentChoice,
} from '../analytics/core';

type Props = Record<string, unknown>;
interface CaptureOptions {
  transport?: 'XHR' | 'fetch' | 'sendBeacon';
  send_instantly?: boolean;
}
interface Client {
  capture(event: string, props?: Props, options?: CaptureOptions): unknown;
  opt_out_capturing(): void;
  opt_in_capturing(): void;
}

const KEY = (import.meta.env.PUBLIC_POSTHOG_KEY ?? '').trim();
const MODE = normalizeConsentMode(import.meta.env.PUBLIC_ANALYTICS_CONSENT);
const UI_HOST = 'https://us.posthog.com';
const MAX_QUEUE = 50;

let client: Client | null = null;
let loading: Promise<Client | null> | null = null;
const queue: Array<[string, Props, CaptureOptions | undefined]> = [];
const context: { community?: string; libraryPage?: string } = {};

export const analyticsConfigured = (): boolean => KEY !== '';
export const consentMode = () => MODE;

export function getConsent(): ConsentChoice | null {
  try {
    return normalizeConsentChoice(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null; // storage blocked: treated as "not chosen yet"
  }
}

function allowedNow(): boolean {
  return (
    analyticsConfigured() &&
    !isExcludedPath(window.location.pathname) &&
    analyticsAllowed(MODE, getConsent())
  );
}

/** Record the visitor's choice and start or stop analytics to match. */
export function setConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Not remembered across pages, but still applied to this one.
  }
  document.dispatchEvent(new CustomEvent('cdl:analytics-consent', { detail: { choice } }));
  if (analyticsAllowed(MODE, choice)) {
    void start();
  } else {
    queue.length = 0;
    client?.opt_out_capturing();
  }
}

function searchParam(name: string): string | undefined {
  return new URLSearchParams(window.location.search).get(name)?.trim() || undefined;
}

/** Added to every event (including pageviews) unless the event already sets it. */
function pageContext(): Props {
  const props: Props = {
    page_type: pageType(window.location.pathname, context.libraryPage),
    site_area: context.libraryPage ? 'community_library' : 'main_site',
    // PostHog would otherwise look up a location from the IP address.
    $geoip_disable: true,
  };
  const community = context.community ?? searchParam('community');
  if (community) props.community = community;
  const audience = searchParam('audience') ?? storedAudience();
  if (audience) props.audience = audience;
  const source = searchParam('source');
  if (source && props.page_type === 'data_preview') props.dataset_id = source;
  return props;
}

function storedAudience(): string | undefined {
  try {
    return window.sessionStorage.getItem('cdl:audience') ?? undefined;
  } catch {
    return undefined;
  }
}

function addPageContext<T extends { properties?: Props }>(event: T | null): T | null {
  if (!event) return null;
  event.properties = { ...pageContext(), ...(event.properties ?? {}) };
  return event;
}

async function start(): Promise<Client | null> {
  if (!allowedNow()) return null;
  if (client) {
    client.opt_in_capturing();
    return client;
  }
  loading ??= import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: ANALYTICS_PROXY_PATH,
        ui_host: UI_HOST,
        persistence: 'sessionStorage',
        person_profiles: 'never',
        autocapture: false,
        rageclick: false,
        capture_pageview: true,
        capture_pageleave: true,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        capture_exceptions: false,
        capture_performance: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_web_experiments: true,
        disable_product_tours: true,
        disable_conversations: true,
        disable_external_dependency_loading: true,
        advanced_disable_flags: true,
        mask_personal_data_properties: true,
        respect_dnt: true,
        before_send: [scrubEvent, addPageContext],
      });
      client = posthog as unknown as Client;
      for (const [event, props, options] of queue.splice(0)) client.capture(event, props, options);
      return client;
    })
    .catch((err) => {
      console.warn('Analytics could not load:', err);
      loading = null;
      return null;
    });
  return loading;
}

/**
 * Record a usage event. Does nothing unless analytics is configured and allowed.
 * `leaving: true` sends it right away with sendBeacon, for clicks that leave the page.
 */
export function track(event: string, props: Props = {}, { leaving = false } = {}): void {
  if (!allowedNow()) return;
  const options: CaptureOptions | undefined = leaving
    ? { transport: 'sendBeacon', send_instantly: true }
    : undefined;
  if (client) {
    client.capture(event, props, options);
    return;
  }
  if (queue.length < MAX_QUEUE) queue.push([event, props, options]);
  void start();
}

function hostOf(href: string | undefined): string | undefined {
  if (!href || href.endsWith('#')) return undefined;
  try {
    return new URL(href, window.location.href).hostname;
  } catch {
    return undefined;
  }
}

function resultCount(): number | undefined {
  const text = document.querySelector('#resource-count strong')?.textContent;
  const n = text ? Number(text.replace(/[^\d]/g, '')) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

let listening = false;

/** Events that come from markup shared across pages, handled in one place. */
function listen(): void {
  if (listening) return;
  listening = true;

  // Fired by src/lib/client/audience.ts and the community library home page.
  document.addEventListener('cdl:audience-change', (e) => {
    const audience = (e as CustomEvent<{ audience?: string }>).detail?.audience;
    if (audience) track('audience_selected', { audience }, { leaving: true });
  });

  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest?.('a, button');
    if (!el) return;
    const link = el instanceof HTMLAnchorElement ? el : null;

    if (el.id === 'download-btn') {
      const toProvider = /provider/i.test(el.textContent ?? '');
      track(
        'dataset_download_clicked',
        { link_type: toProvider ? 'provider_page' : 'download', destination: hostOf(link?.href) },
        { leaving: true }
      );
    } else if (el.id === 'preview-unavailable-link') {
      track(
        'dataset_provider_link_clicked',
        { destination: hostOf(link?.href) },
        { leaving: true }
      );
    } else if (el.matches('.view-btn[data-view]')) {
      track('catalog_layout_changed', { layout: (el as HTMLElement).dataset.view });
    } else if (el.id === 'catalog-reset-btn') {
      track('catalog_filters_reset');
    } else if (el.matches('.js-email')) {
      track('contact_email_clicked', {}, { leaving: true });
    }
  });

  document.addEventListener('change', (e) => {
    const field = e.target as HTMLSelectElement | null;
    if (!field || field.tagName !== 'SELECT') return;
    if (field.closest('#catalog-filter-form')) {
      if (field.name === 'sort') track('catalog_sorted', { sort: field.value });
      else if (field.value)
        track('catalog_filter_changed', {
          filter: field.name,
          value: field.value,
          results: resultCount(),
        });
    } else if (field.id === 'county-filter' && field.value) {
      track('preview_county_selected', {
        county_fips: field.value,
        state_fips: field.value.slice(0, 2),
      });
    } else if (field.id === 'plot-type-filter') {
      track('preview_chart_changed', { plot_type: field.value });
    }
  });

  // Catalog search: one event per pause in typing, with how many results it left.
  let searchTimer: number | undefined;
  document.addEventListener('input', (e) => {
    const field = e.target as HTMLInputElement | null;
    if (!field?.closest('#catalog-filter-form') || field.name !== 'q') return;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      const term = cleanSearchTerm(field.value);
      if (term) track('catalog_searched', { term, results: resultCount() });
    }, 1500);
  });

  // "toggle" doesn't bubble, so listen in the capture phase.
  document.addEventListener(
    'toggle',
    (e) => {
      const panel = e.target as HTMLDetailsElement | null;
      if (panel?.id === 'summary-panel' && panel.open) track('dataset_summary_opened');
    },
    true
  );

  // Suggest a Dataset: the page's own handler runs first and cancels invalid submissions.
  // Only the kind of data is recorded, never the title, URL, name or email.
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement | null;
    if (!form || e.defaultPrevented || form.getAttribute('name') !== 'resource-submission') return;
    const data = new FormData(form);
    track(
      'dataset_suggestion_submitted',
      {
        geography_level: data.get('geography_level') || undefined,
        data_themes: data.getAll('data_themes').map(String),
        submitter_role: data.get('submitter_role') || undefined,
      },
      { leaving: true }
    );
  });
}

function showBanner(banner: HTMLElement | null): void {
  if (!banner) return;
  banner.hidden = false;
  banner.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = normalizeConsentChoice(button.dataset.consent);
      if (choice) setConsent(choice);
      banner.hidden = true;
    });
  });
}

/** Keeps the privacy page's "your choice" text and buttons in sync. */
function wireConsentControls(): void {
  const status = document.querySelectorAll<HTMLElement>('[data-analytics-status]');
  const render = () => {
    const on = allowedNow();
    status.forEach((el) => (el.textContent = on ? 'on' : 'off'));
  };
  document.querySelectorAll<HTMLButtonElement>('[data-analytics-set]').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = normalizeConsentChoice(button.dataset.analyticsSet);
      if (choice) setConsent(choice);
      render();
    });
  });
  document.addEventListener('cdl:analytics-consent', render);
  render();
}

/** Called once per page by src/components/Analytics.astro. */
export function initAnalytics(options: { community?: string; libraryPage?: string } = {}): void {
  if (!analyticsConfigured() || isExcludedPath(window.location.pathname)) return;
  context.community = options.community || undefined;
  context.libraryPage = options.libraryPage || undefined;
  listen();
  wireConsentControls();
  if (getConsent() === null) showBanner(document.getElementById('cdl-analytics-banner'));
  if (allowedNow()) void start();
}
