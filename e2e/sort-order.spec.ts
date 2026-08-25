/**
 * Journey 9
 * As a crypto watcher, I want sorting by market cap to reorder the whole
 * market rather than just the rows on screen, so that "lowest market cap"
 * means the actual bottom of the market.
 *
 * CoinGecko's /coins/markets `order` param supports market_cap_asc|desc,
 * volume_*, and id_* — but NOT price or 24h change. Worse, it answers 200 with
 * plain market-cap ordering for unsupported values instead of erroring. So
 * market cap is sent to the API, price and 24h change are sorted client-side
 * over the loaded page, and the UI states which is which.
 */
import { test, expect } from '@playwright/test';
import { mockCoinsOrdered } from './helpers/mockApi';
import { EXPECTED_COIN_COUNT } from './fixtures/coins';
import { card, expectCardCount, visibleCoinIds } from './helpers/dom';

test.describe('market cap sorting goes to the API', () => {
  test('sends order=market_cap_desc on first load', async ({ page }) => {
    const state = await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    expect(state.requests[0]).toEqual({ page: 1, order: 'market_cap_desc' });
  });

  test('sends order=market_cap_asc when switching to low-to-high', async ({ page }) => {
    const state = await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('sort-field').selectOption('market_cap');
    await page.getByTestId('sort-direction-asc').click();

    await expect.poll(() => state.requests.map((r) => r.order)).toContain('market_cap_asc');
  });

  test('renders the order the API returned instead of re-sorting locally', async ({ page }) => {
    await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('sort-field').selectOption('market_cap');
    await page.getByTestId('sort-direction-asc').click();

    // The ascending payload leads with cardano (rank 8) ahead of bitcoin
    // (rank 1). A local market-cap sort would not produce that order.
    await expect.poll(async () => (await visibleCoinIds(page))[0]).toBe('cardano');
  });

  test('goes back to page 1 when the market-cap order changes', async ({ page }) => {
    await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-indicator')).toContainText('2');

    await page.getByTestId('sort-field').selectOption('market_cap');
    await page.getByTestId('sort-direction-asc').click();

    // A new global ordering makes "page 2" meaningless, so start over.
    await expect(page.getByTestId('page-indicator')).toContainText('1');
  });

  test('caches each order separately', async ({ page }) => {
    const state = await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('sort-field').selectOption('market_cap');
    await page.getByTestId('sort-direction-asc').click();
    await expect.poll(async () => (await visibleCoinIds(page))[0]).toBe('cardano');

    await page.getByTestId('sort-direction-desc').click();
    await expect.poll(async () => (await visibleCoinIds(page))[0]).toBe('bitcoin');

    await page.getByTestId('sort-direction-asc').click();
    await expect.poll(async () => (await visibleCoinIds(page))[0]).toBe('cardano');

    // desc, asc, desc-from-cache, asc-from-cache -> only two network requests.
    expect(state.requests.map((r) => r.order)).toEqual(['market_cap_desc', 'market_cap_asc']);
  });
});

test.describe('price and 24h change stay client-side', () => {
  test('does not hit the API when switching to price', async ({ page }) => {
    const state = await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
    const before = state.requests.length;

    await page.getByTestId('sort-field').selectOption('price');
    await page.getByTestId('sort-direction-asc').click();
    await expect(card(page, 'shiba-inu')).toBeVisible();

    expect(state.requests.length).toBe(before);
  });

  test('does not hit the API when switching to 24h change', async ({ page }) => {
    const state = await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
    const before = state.requests.length;

    await page.getByTestId('sort-field').selectOption('change');
    await page.getByTestId('sort-direction-desc').click();

    const ids = await visibleCoinIds(page);
    expect(ids[0]).toBe('avalanche-2');
    expect(state.requests.length).toBe(before);
  });

  test('never sends an order value the API silently ignores', async ({ page }) => {
    const state = await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('sort-field').selectOption('price');
    await page.getByTestId('sort-direction-asc').click();
    await page.getByTestId('sort-field').selectOption('change');
    await page.getByTestId('sort-direction-desc').click();
    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-indicator')).toContainText('2');

    const orders = state.requests.map((r) => r.order);
    expect(orders.every((o) => o === 'market_cap_desc' || o === 'market_cap_asc')).toBe(true);
  });

  test('keeps the fetched pool when switching from market cap to price', async ({ page }) => {
    const state = await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('sort-field').selectOption('market_cap');
    await page.getByTestId('sort-direction-asc').click();
    await expect.poll(async () => (await visibleCoinIds(page))[0]).toBe('cardano');
    const after = state.requests.length;

    await page.getByTestId('sort-field').selectOption('price');

    // Switching to a client-side field must not silently refetch.
    expect(state.requests.length).toBe(after);
  });
});

test.describe('the UI says which scope applies', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });

  test('states that market cap spans the whole market', async ({ page }) => {
    await page.getByTestId('sort-field').selectOption('market_cap');

    await expect(page.getByTestId('sort-scope')).toContainText('whole market');
  });

  test('states that price is limited to the current page', async ({ page }) => {
    await page.getByTestId('sort-field').selectOption('price');

    await expect(page.getByTestId('sort-scope')).toContainText('this page');
  });

  test('states that 24h change is limited to the current page', async ({ page }) => {
    await page.getByTestId('sort-field').selectOption('change');

    await expect(page.getByTestId('sort-scope')).toContainText('this page');
  });
});
