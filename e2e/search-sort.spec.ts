/**
 * Journey 2
 * As a crypto watcher, I want to filter the list by typing a coin name or
 * symbol, so that I can find one coin without scrolling.
 *
 * Journey 3
 * As a crypto watcher, I want to sort in either direction, so that I can look
 * at either end of the market.
 *
 * Search is server-side (see search-api.spec.ts) and so is sorting, so these
 * exercise the user-visible outcome rather than any local filtering.
 */
import { test, expect } from '@playwright/test';
import { mockSearchFlow } from './helpers/mockApi';
import { EXPECTED_COIN_COUNT } from './fixtures/coins';
import { card, expectCardCount, visibleCoinIds } from './helpers/dom';

test.beforeEach(async ({ page }) => {
  await mockSearchFlow(page);
  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);
});

test.describe('search', () => {
  test('filters to a single coin when the name is unique', async ({ page }) => {
    await page.getByTestId('search-input').fill('cardano');

    await expectCardCount(page, 1);
    await expect(card(page, 'cardano')).toBeVisible();
  });

  test('returns every coin whose name contains the query', async ({ page }) => {
    await page.getByTestId('search-input').fill('bitcoin');

    await expectCardCount(page, 2);
    await expect(card(page, 'bitcoin')).toBeVisible();
    await expect(card(page, 'wrapped-bitcoin')).toBeVisible();
  });

  test('matches on symbol even when the name does not contain the query', async ({ page }) => {
    await page.getByTestId('search-input').fill('bnb');

    await expectCardCount(page, 1);
    await expect(card(page, 'binancecoin')).toBeVisible();
  });

  test('ignores case', async ({ page }) => {
    await page.getByTestId('search-input').fill('CaRdAnO');

    await expectCardCount(page, 1);
    await expect(card(page, 'cardano')).toBeVisible();
  });

  test('ignores surrounding whitespace', async ({ page }) => {
    await page.getByTestId('search-input').fill('  cardano  ');

    await expectCardCount(page, 1);
  });

  test('restores the full list when the query is cleared', async ({ page }) => {
    const search = page.getByTestId('search-input');

    await search.fill('cardano');
    await expectCardCount(page, 1);

    await search.fill('');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });
});

test.describe('sort', () => {
  test('orders by market cap descending by default', async ({ page }) => {
    const ids = await visibleCoinIds(page);
    expect(ids[0]).toBe('bitcoin');
    expect(ids[1]).toBe('ethereum');
  });

  test('reflects the selected direction', async ({ page }) => {
    // What the reversed ordering actually renders is covered in
    // sort-order.spec.ts, which mocks a payload that varies by `order`.
    await page.getByTestId('sort-direction-asc').click();

    await expect(page.getByTestId('sort-direction-asc')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('sort-direction-desc')).toHaveAttribute('aria-pressed', 'false');
  });

  test('offers volume as the only other field, matching the API', async ({ page }) => {
    const values = await page
      .getByTestId('sort-field')
      .locator('option')
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));

    expect(values).toEqual(['market_cap', 'volume']);
  });
});

test('search and sort apply together', async ({ page }) => {
  await page.getByTestId('search-input').fill('bitcoin');
  await expectCardCount(page, 2);

  await page.getByTestId('sort-field').selectOption('volume');

  // Both the keyword and the ordering are resolved by the API; the grid renders
  // whatever comes back for that combination.
  await expectCardCount(page, 2);
  await expect(card(page, 'bitcoin')).toBeVisible();
  await expect(card(page, 'wrapped-bitcoin')).toBeVisible();
});
