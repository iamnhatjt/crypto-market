/**
 * Regression guard on the outgoing request.
 *
 * These lock the contract between the app's configuration and the CoinGecko
 * call — the query the brief specifies, and the rule that an unset API key
 * means no key header at all (CoinGecko rejects an empty one rather than
 * ignoring it). Config is inlined at build time, so this asserts the shipped
 * defaults; non-default values are verified by rebuilding with an override.
 */
import { test, expect } from '@playwright/test';
import { coinsFixture, EXPECTED_COIN_COUNT } from './fixtures/coins';
import { MARKETS_ROUTE } from './helpers/mockApi';
import { expectCardCount } from './helpers/dom';

async function captureMarketsRequest(page: import('@playwright/test').Page) {
  const captured: { url: string; headers: Record<string, string> } = { url: '', headers: {} };

  await page.route(MARKETS_ROUTE, (route) => {
    captured.url = route.request().url();
    captured.headers = route.request().headers();

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(coinsFixture),
    });
  });

  return captured;
}

test('requests the top 20 USD markets ordered by market cap', async ({ page }) => {
  const captured = await captureMarketsRequest(page);

  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);

  const params = new URL(captured.url).searchParams;

  expect(params.get('vs_currency')).toBe('usd');
  expect(params.get('order')).toBe('market_cap_desc');
  expect(params.get('per_page')).toBe('20');
  expect(params.get('page')).toBe('1');
  expect(params.get('sparkline')).toBe('false');
});

test('sends a numeric per_page, never NaN from a malformed config value', async ({ page }) => {
  const captured = await captureMarketsRequest(page);

  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);

  const perPage = new URL(captured.url).searchParams.get('per_page');

  expect(perPage).not.toBeNull();
  expect(Number.isInteger(Number(perPage))).toBe(true);
  expect(Number(perPage)).toBeGreaterThan(0);
});

test('omits the API key header entirely when no key is configured', async ({ page }) => {
  const captured = await captureMarketsRequest(page);

  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);

  expect(Object.keys(captured.headers)).not.toContain('x-cg-demo-api-key');
  expect(Object.keys(captured.headers)).not.toContain('x-cg-pro-api-key');
});
