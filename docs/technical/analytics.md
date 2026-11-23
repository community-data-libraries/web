# Usage analytics

The site can record how it is used (which datasets are opened, what is downloaded,
which cleaning steps are used, which filters and searches people try) with
[PostHog](https://posthog.com). It is **off** until `PUBLIC_POSTHOG_KEY` is set, and
with the default consent mode nothing is recorded until a visitor clicks **Allow**.

> **Research use.** Check with the IRB before turning this on for data you plan to
> report. The notice text, the privacy page (`/privacy`) and the consent mode may need
> to change to match what the IRB approves.

## How it works

| Piece | File |
|---|---|
| Consent notice + loader, included by both layouts | `src/components/Analytics.astro` |
| Browser side: consent, PostHog setup, shared events | `src/lib/client/analytics.ts` |
| URL cleaning, page types, search-term rules (unit tested) | `src/lib/analytics/core.ts`, `tests/analytics.test.ts` |
| Privacy page, linked from both footers | `src/pages/privacy.astro` |
| Proxy to PostHog on our own domain (`/cdl-relay/*`) | `netlify.toml`, excluded in `netlify/edge-functions/library-host.js` |

Privacy choices built into the code:

- **No cookies.** PostHog keeps an anonymous ID in `sessionStorage`, so it ends when
  the tab closes. The visitor's Allow / No thanks choice is kept in `localStorage`
  (`cdl:analytics-consent`).
- **No autocapture, session recording, heatmaps, surveys, feature flags or person
  profiles.** Only pageviews, page-leave (time on page) and the events below are sent.
- **No personal data in events.** URLs lose everything after `#` and any `auth`,
  `token`, `email`, `name` or `code` parameter before sending. Form contents, uploaded
  files and file names are never sent. Search terms that look like an email address or a
  long number are dropped.
- **No location lookup.** Every event carries `$geoip_disable: true`.
- **Librarian sign-in and editing pages (`/librarian/*`) are never tracked.**
- **Do Not Track** is respected.
- PostHog is loaded only after consent, so visitors who decline never download it.

## Setup

1. **Create the PostHog account under the project email** (`info@communitydatalibraries.org`)
   so it belongs to the project, not a person. Choose the **US** region (or change the
   three `/cdl-relay` rules in `netlify.toml` to `eu-assets.i.posthog.com` / `eu.i.posthog.com`).
2. In the PostHog project settings:
   - Turn on **Discard client IP data**.
   - Set data retention to what the IRB approves.
3. Copy the **Project API key** (`phc_...`). It is a public, write-only key that browsers
   need, so it is safe in the page source.
4. In Netlify → Site configuration → Environment variables, add:
   - `PUBLIC_POSTHOG_KEY` = the `phc_...` key
   - `PUBLIC_ANALYTICS_CONSENT` = `opt-in` (default) or `notice`
   - `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` = the same `phc_...` key. Netlify's smart
     secret detection (on by default on paid plans) may otherwise flag the
     key in the built JavaScript and fail the deploy. `SECRETS_SCAN_OMIT_KEYS` in
     `netlify.toml` already covers the regular scan.

   Do not mark `PUBLIC_POSTHOG_KEY` as a secret: browsers need it.
5. Trigger a new deploy. The variables are read at build time.
6. Check: open the site, click **Allow**, open a dataset, then look at PostHog →
   Activity. Events appear within a minute. Team members testing the site should click
   **No thanks** afterwards (or on the privacy page) so their own visits don't count.

Before the key is set you can still check the relay on any deploy (this sends no data):

```sh
curl -s -o /dev/null -w '%{http_code}\n' https://<site>/cdl-relay/static/array.js   # 200
```

The GitHub Pages copy built by `.github/workflows/astro.yml` never has the key, so
analytics stays off there (it also has no `/cdl-relay` proxy).

To turn analytics off, delete `PUBLIC_POSTHOG_KEY` and redeploy: no analytics code runs
and the notice disappears. The privacy page then says analytics is off.

## Consent modes (`PUBLIC_ANALYTICS_CONSENT`)

| Mode | Notice | Recorded |
|---|---|---|
| `opt-in` (default) | "Can we record how this site is used?" **Allow** / **No thanks** | Only after **Allow** |
| `notice` | "We record how this site is used..." **OK** / **Turn off** | Unless the visitor turns it off |

Visitors can change their choice at any time on `/privacy`.

## Events

Every event, including PostHog's own `$pageview` and `$pageleave`, also carries:

| Property | Meaning |
|---|---|
| `page_type` | `home`, `complete_catalog`, `data_preview`, `library_home`, `library_catalog`, `library_contact`, `suggest_dataset`, ... |
| `site_area` | `main_site` or `community_library` |
| `community` | Library slug on library pages, or `?community=` on Data Preview |
| `audience` | `teacher`, `student` or `community` when chosen |
| `dataset_id` | On Data Preview, the `?source=` id |

| Event | When | Extra properties |
|---|---|---|
| `dataset_viewed` | A Data Preview page loads a dataset | `dataset_title`, `provider`, `topics`, `stats_tags`, `spatial_units`, `file_type`, `county_level`, `info_only` |
| `dataset_download_clicked` | The Download / Visit provider button | `link_type` (`download` or `provider_page`), `destination` (host) |
| `dataset_provider_link_clicked` | Provider link on an info-only dataset | `destination` |
| `dataset_summary_opened` | Summary statistics panel opened | |
| `preview_county_selected` | A county picked in the preview | `county_fips`, `state_fips` |
| `preview_chart_changed` | Plot type changed | `plot_type` |
| `cleaning_tool_opened` | "Open notebook" clicked | |
| `cleaning_file_uploaded` | A downloaded file loaded into the notebook | `file_kind`, `file_format` |
| `cleaning_step_added` | A no-code cleaning step added | `step` (e.g. `dropColumns`, `fillMissing`, `filterRows`) |
| `cleaning_code_cell_added` | "+ Code cell" | |
| `cleaning_run_all` | "Run all" | `cells` |
| `cleaning_tab_viewed` | Cleaning steps / data tab | `tab` |
| `cleaning_exported` | Cleaned data or notebook downloaded | `format` (`csv`, `xlsx`, `ipynb`), `steps` |
| `cleaning_reset` | Notebook reset | |
| `catalog_filter_changed` | A catalog filter set | `filter`, `value`, `results` |
| `catalog_searched` | Catalog search (after a 1.5 s pause in typing) | `term`, `results` |
| `catalog_sorted` | Sort changed | `sort` |
| `catalog_filters_reset` | Reset button | |
| `catalog_layout_changed` | List / grid / table | `layout` |
| `audience_selected` | Teacher / student / community view chosen | `audience` |
| `dataset_suggestion_submitted` | Suggest a Dataset form sent | `geography_level`, `data_themes`, `submitter_role` |
| `librarian_contact_sent` | Contact-the-librarian message sent | |
| `contact_email_clicked` | Footer email link | |

### Adding an event

```ts
import { track } from '@lib/client/analytics';

track('event_name', { some_property: 'value' });
```

`track` does nothing when analytics is off or not allowed, so it is safe to call
anywhere. Use `{ leaving: true }` as the third argument for clicks that leave the page.
Never send names, emails, free text typed by visitors, or file contents. Add new events
to the table above and, if they record something new, to `/privacy`.

## Useful PostHog views

- **Most viewed datasets:** Trends → `dataset_viewed`, breakdown by `dataset_title`.
- **What kinds of data people look at:** `dataset_viewed`, breakdown by `topics` or `spatial_units`.
- **From viewing to using:** Funnel `dataset_viewed` → `dataset_download_clicked` →
  `cleaning_file_uploaded` → `cleaning_exported`.
- **Gaps in the catalog:** `catalog_searched` where `results` = 0, breakdown by `term`.
- **Who uses it:** any event, breakdown by `audience` or `community`.
