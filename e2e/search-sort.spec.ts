/**
 * Journey 2
 * As a crypto watcher, I want to filter the list by typing a coin name or
 * symbol, so that I can find one coin without scrolling.
 *
 * Journey 3
 * As a crypto watcher, I want to sort by price or 24h change in either
 * direction, so that I can see the biggest movers and the most valuable coins.
 */
import { test, expect } from '@playwright/test';
import { mockCoins } from './helpers/mockApi';
import { EXPECTED_COIN_COUNT } from './fixtures/coins';
import { card, expectCardCount, visibleCoinIds } from './helpers/dom';

test.beforeEach(async ({ page }) => {
  await mockCoins(page);
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
  test('orders by price descending, putting the most expensive coin first', async ({ page }) => {
    await page.getByTestId('sort-field').selectOption('price');
    await page.getByTestId('sort-direction-desc').click();

    const ids = await visibleCoinIds(page);
    expect(ids[0]).toBe('bitcoin');
    expect(ids[1]).toBe('wrapped-bitcoin');
  });

  test('orders by price ascending, putting the cheapest coin first', async ({ page }) => {
    await page.getByTestId('sort-field').selectOption('price');
    await page.getByTestId('sort-direction-asc').click();

    const ids = await visibleCoinIds(page);
    expect(ids[0]).toBe('shiba-inu');
  });

  test('orders by 24h change descending, putting the biggest gainer first', async ({ page }) => {
    await page.getByTestId('sort-field').selectOption('change');
    await page.getByTestId('sort-direction-desc').click();

    const ids = await visibleCoinIds(page);
    expect(ids[0]).toBe('avalanche-2');
  });

  test('orders by 24h change ascending, putting the biggest loser first', async ({ page }) => {
    await page.getByTestId('sort-field').selectOption('change');
    await page.getByTestId('sort-direction-asc').click();

    const ids = await visibleCoinIds(page);
    expect(ids[0]).toBe('uniswap');
  });

  test('keeps coins with a missing 24h change last in both directions', async ({ page }) => {
    await page.getByTestId('sort-field').selectOption('change');

    await page.getByTestId('sort-direction-desc').click();
    let ids = await visibleCoinIds(page);
    expect(ids[ids.length - 1]).toBe('stasis-eurs');

    await page.getByTestId('sort-direction-asc').click();
    ids = await visibleCoinIds(page);
    expect(ids[ids.length - 1]).toBe('stasis-eurs');
  });

  test('falls back to market cap order when sorting is reset', async ({ page }) => {
    await page.getByTestId('sort-field').selectOption('price');
    await page.getByTestId('sort-field').selectOption('market_cap');

    const ids = await visibleCoinIds(page);
    expect(ids[0]).toBe('bitcoin');
    expect(ids[1]).toBe('ethereum');
  });
});

test('search and sort apply together', async ({ page }) => {
  await page.getByTestId('search-input').fill('bitcoin');
  await page.getByTestId('sort-field').selectOption('price');
  await page.getByTestId('sort-direction-asc').click();

  const ids = await visibleCoinIds(page);
  expect(ids).toEqual(['wrapped-bitcoin', 'bitcoin']);
});
