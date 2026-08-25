/**
 * Journey 7
 * As a crypto watcher, I want repeat visits to reuse recently fetched data, so
 * that the dashboard is instant and I do not get rate-limited by CoinGecko —
 * while still being able to force a refresh when I want current prices.
 */
import { test, expect } from '@playwright/test';
import { coinsFixture, EXPECTED_COIN_COUNT } from './fixtures/coins';
import { MARKETS_ROUTE } from './helpers/mockApi';
import { expectCardCount } from './helpers/dom';

/** Serve the fixture while counting how many times the endpoint was hit. */
async function mockCoinsCounting(page: import('@playwright/test').Page) {
  const state = { requests: 0 };

  await page.route(MARKETS_ROUTE, (route) => {
    state.requests += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(coinsFixture),
    });
  });

  return state;
}

test('fetches the market list exactly once on first load', async ({ page }) => {
  const state = await mockCoinsCounting(page);

  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);

  expect(state.requests).toBe(1);
});

test('serves a reload from cache instead of re-fetching', async ({ page }) => {
  const state = await mockCoinsCounting(page);

  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);
  expect(state.requests).toBe(1);

  await page.reload();
  await expectCardCount(page, EXPECTED_COIN_COUNT);

  expect(state.requests, 'the cached response should still be fresh').toBe(1);
});

test('refresh bypasses the cache and re-fetches', async ({ page }) => {
  const state = await mockCoinsCounting(page);

  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);
  expect(state.requests).toBe(1);

  await page.getByTestId('refresh-button').click();

  await expect
    .poll(() => state.requests, { message: 'refresh should trigger a new request' })
    .toBe(2);
  await expectCardCount(page, EXPECTED_COIN_COUNT);
});

test('re-fetches once the cached entry has expired', async ({ page }) => {
  const state = await mockCoinsCounting(page);

  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);
  expect(state.requests).toBe(1);

  // Age the cached entry past its TTL, then reload.
  await page.evaluate(() => {
    const key = Object.keys(window.sessionStorage).find((k) => k.includes('coins'));
    if (!key) {
      throw new Error('expected a cached coins entry in sessionStorage');
    }
    const entry = JSON.parse(window.sessionStorage.getItem(key) as string);
    entry.storedAt = 0;
    window.sessionStorage.setItem(key, JSON.stringify(entry));
  });

  await page.reload();
  await expectCardCount(page, EXPECTED_COIN_COUNT);

  expect(state.requests).toBe(2);
});
