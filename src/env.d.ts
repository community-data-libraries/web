/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** e.g. "communitydatalibraries.org": serve libraries at <slug>.<domain> (web#31). */
  readonly PUBLIC_LIBRARY_DOMAIN?: string;
  /** e.g. "https://community-data-libraries.netlify.app": where library pages link to the main site. */
  readonly PUBLIC_MAIN_SITE_URL?: string;
  /** PostHog project key (phc_...). Unset: no analytics code runs. docs/technical/analytics.md */
  readonly PUBLIC_POSTHOG_KEY?: string;
  /** "opt-in" (default): record only after the visitor clicks Allow. "notice": record unless they turn it off. */
  readonly PUBLIC_ANALYTICS_CONSENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
