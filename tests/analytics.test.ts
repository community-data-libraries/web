import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  analyticsAllowed,
  cleanSearchTerm,
  isExcludedPath,
  normalizeConsentChoice,
  normalizeConsentMode,
  pageType,
  sanitizeUrl,
  scrubEvent,
  splitList,
  stripBasePath,
} from '../src/lib/analytics/core.ts';

test('consent mode defaults to opt-in', () => {
  assert.equal(normalizeConsentMode(undefined), 'opt-in');
  assert.equal(normalizeConsentMode(''), 'opt-in');
  assert.equal(normalizeConsentMode('something else'), 'opt-in');
  assert.equal(normalizeConsentMode(' Notice '), 'notice');
});

test('opt-in needs an explicit Allow; notice runs unless turned off', () => {
  assert.equal(analyticsAllowed('opt-in', null), false);
  assert.equal(analyticsAllowed('opt-in', 'denied'), false);
  assert.equal(analyticsAllowed('opt-in', 'granted'), true);
  assert.equal(analyticsAllowed('notice', null), true);
  assert.equal(analyticsAllowed('notice', 'denied'), false);
  assert.equal(normalizeConsentChoice('granted'), 'granted');
  assert.equal(normalizeConsentChoice('yes'), null);
});

test('URLs lose their fragment and token or email parameters', () => {
  assert.equal(
    sanitizeUrl('https://example.org/web/?audience=teacher#access_token=abc&type=invite'),
    'https://example.org/web/?audience=teacher'
  );
  assert.equal(
    sanitizeUrl('https://example.org/web/data-preview?source=acs&auth=xyz&email=a%40b.org'),
    'https://example.org/web/data-preview?source=acs'
  );
  assert.equal(sanitizeUrl('not a url#secret'), 'not a url');
});

test('librarian pages are excluded with or without the /web base', () => {
  assert.equal(isExcludedPath('/web/librarian/login/'), true);
  assert.equal(isExcludedPath('/librarian/knox-county/edit/'), true);
  assert.equal(isExcludedPath('/web/librarians-guide'), false);
  assert.equal(isExcludedPath('/web/complete-catalog'), false);
  assert.equal(stripBasePath('/web'), '/');
  assert.equal(stripBasePath('/website'), '/website');
});

test('page types', () => {
  assert.equal(pageType('/web/'), 'home');
  assert.equal(pageType('/web/complete-catalog/'), 'complete_catalog');
  assert.equal(pageType('/web/data-preview'), 'data_preview');
  assert.equal(pageType('/catalog/', 'catalog'), 'library_catalog');
  assert.equal(pageType('/web/communities/knox-county/'), 'library_other');
  assert.equal(pageType('/web/unknown-page'), 'other');
});

test('search terms are cleaned and personal-looking ones dropped', () => {
  assert.equal(cleanSearchTerm('  School   Enrollment '), 'school enrollment');
  assert.equal(cleanSearchTerm('a'), null);
  assert.equal(cleanSearchTerm('jane@example.org'), null);
  assert.equal(cleanSearchTerm('call 8655551234'), null);
  assert.equal(cleanSearchTerm('x'.repeat(100))?.length, 60);
  assert.deepEqual(splitList('a| b ||c'), ['a', 'b', 'c']);
});

test('scrubEvent drops excluded pages and sanitizes URL properties', () => {
  assert.equal(
    scrubEvent({ event: '$pageview', properties: { $pathname: '/web/librarian/login/' } }),
    null
  );
  const event = scrubEvent({
    event: '$pageview',
    properties: {
      $pathname: '/web/',
      $current_url: 'https://example.org/web/#recovery_token=abc',
      $referrer: 'https://mail.example.com/?token=1',
      $initial_referrer: '$direct',
    },
  });
  assert.equal(event?.properties?.$current_url, 'https://example.org/web/');
  assert.equal(event?.properties?.$referrer, 'https://mail.example.com/');
  assert.equal(event?.properties?.$initial_referrer, '$direct');
  assert.equal(scrubEvent(null), null);
});
