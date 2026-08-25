/**
 * Journey 9
 * As a crypto watcher, I want every sort option to reorder the whole market via
 * the API, so that "lowest volume" means the actual lowest in the market and not
 * merely the lowest of the twenty rows in front of me.
 *
 * Which fields exist is dictated by what CoinGecko can actually order by.
 * Verified against the live API: `market_cap_asc|desc` and `volume_asc|desc` are
 * honoured, while `price_*` and `percent_change_24h_*` return 200 with plain
 * market-cap ordering — silently ignored. Rather than ship two sorts that only
 * look like they work, price and 24h change are not offered at all.
 *
 * Because every sort is server-side, there is no page-scoped sorting left and
 * therefore no scope caveat to display.
 */
import { test, expect } from '@playwright/test';
import { mockCoinsOrdered, mockSearchFlow, MARKETS_ROUTE } from './helpers/mockApi';
import { EXPECTED_COIN_COUNT } from './fixtures/coins';
import { card, expectCardCount, visibleCoinIds } from './helpers/dom';

test.describe('the offered fields match what the API supports', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });

  test('offers exactly market cap and volume', async ({ page }) => {
    const values = await page
      .getByTestId('sort-field')
      .locator('option')
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));

    expect(values).toEqual(['market_cap', 'volume']);
  });

  test('does not offer sorts CoinGecko silently ignores', async ({ page }) => {
    const values = await page
      .getByTestId('sort-field')
      .locator('option')
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));

    expect(values).not.toContain('price');
    expect(values).not.toContain('change');
  });

  test('shows no sort-scope caveat, because every sort is market-wide', async ({ page }) => {
    await expect(page.getByTestId('sort-scope')).toHaveCount(0);
  });
});

test.describe('every field and direction reaches the API', () => {
  const cases = [
    { field: 'market_cap', direction: 'desc', order: 'market_cap_desc' },
    { field: 'market_cap', direction: 'asc', order: 'market_cap_asc' },
    { field: 'volume', direction: 'desc', order: 'volume_desc' },
    { field: 'volume', direction: 'asc', order: 'volume_asc' },
  ] as const;

  for (const { field, direction, order } of cases) {
    test(`${field} ${direction} sends order=${order}`, async ({ page }) => {
      const state = await mockCoinsOrdered(page);
      await page.goto('/');
      await expectCardCount(page, EXPECTED_COIN_COUNT);

      await page.getByTestId('sort-field').selectOption(field);
      await page.getByTestId(`sort-direction-${direction}`).click();

      await expect.poll(() => state.requests.map((r) => r.order)).toContain(order);
    });
  }

  test('sends order=market_cap_desc on first load', async ({ page }) => {
    const state = await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    expect(state.requests[0]).toEqual({ page: 1, order: 'market_cap_desc' });
  });

  test('only ever sends an order the API honours', async ({ page }) => {
    const state = await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    for (const field of ['volume', 'market_cap'] as const) {
      await page.getByTestId('sort-field').selectOption(field);
      await page.getByTestId('sort-direction-asc').click();
      await page.getByTestId('sort-direction-desc').click();
    }

    const allowed = ['market_cap_asc', 'market_cap_desc', 'volume_asc', 'volume_desc'];
    await expect
      .poll(() => state.requests.every((r) => allowed.includes(r.order)))
      .toBe(true);
  });
});

test.describe('ordering behaviour', () => {
  test('renders the order the API returned instead of re-sorting locally', async ({ page }) => {
    await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('sort-direction-asc').click();

    // The ascending payload leads with cardano (rank 8) ahead of bitcoin
    // (rank 1). Any local re-sort would move it.
    await expect.poll(async () => (await visibleCoinIds(page))[0]).toBe('cardano');
  });

  test('returns to page 1 when the order changes', async ({ page }) => {
    await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-indicator')).toContainText('2');

    await page.getByTestId('sort-field').selectOption('volume');

    await expect(page.getByTestId('page-indicator')).toContainText('1');
  });

  test('caches each order separately', async ({ page }) => {
    const state = await mockCoinsOrdered(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('sort-direction-asc').click();
    await expect.poll(async () => (await visibleCoinIds(page))[0]).toBe('cardano');

    await page.getByTestId('sort-direction-desc').click();
    await expect.poll(async () => (await visibleCoinIds(page))[0]).toBe('bitcoin');

    await page.getByTestId('sort-direction-asc').click();
    await expect.poll(async () => (await visibleCoinIds(page))[0]).toBe('cardano');

    expect(state.requests.map((r) => r.order)).toEqual(['market_cap_desc', 'market_cap_asc']);
  });
});

test.describe('search results are ordered by the API too', () => {
  test('passes the chosen order to the hydration call', async ({ page }) => {
    const state = await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('sort-field').selectOption('volume');
    await page.getByTestId('sort-direction-asc').click();

    await page.getByTestId('search-input').fill('bitcoin');
    await expectCardCount(page, 2);

    expect(state.hydrationOrders.at(-1)).toBe('volume_asc');
  });
});

test.describe('volume is visible, since it can be sorted by', () => {
  test('shows 24h volume on the card', async ({ page }) => {
    await page.route(MARKETS_ROUTE, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>',
            current_price: 64000,
            market_cap: 1_260_000_000_000,
            market_cap_rank: 1,
            total_volume: 45_600_000_000,
            price_change_percentage_24h: 2.5,
          },
        ]),
      })
    );
    await page.goto('/');
    await expectCardCount(page, 1);

    await expect(card(page, 'bitcoin').getByTestId('coin-volume')).toContainText('$45.6B');
  });

  test('renders a placeholder when volume is missing', async ({ page }) => {
    await page.route(MARKETS_ROUTE, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'bitcoin',
            symbol: 'btc',
            name: 'Bitcoin',
            image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>',
            current_price: 64000,
            market_cap: 1_260_000_000_000,
            market_cap_rank: 1,
            total_volume: null,
            price_change_percentage_24h: 2.5,
          },
        ]),
      })
    );
    await page.goto('/');
    await expectCardCount(page, 1);

    await expect(card(page, 'bitcoin').getByTestId('coin-volume')).toContainText('—');
  });
});
