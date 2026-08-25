/**
 * Journey 8
 * As a crypto watcher, I want to page beyond the top 20, so that I can look
 * further down the market without the dashboard loading thousands of coins at
 * once.
 *
 * Pagination is server-side: each page is a separate CoinGecko request with its
 * own `page` param and its own cache entry. That means search and sort operate
 * on the page currently loaded, which the UI states explicitly rather than
 * pretending otherwise.
 */
import { test, expect } from '@playwright/test';
import { mockCoinsPaged, mockPageTwoFailure } from './helpers/mockApi';
import { EXPECTED_COIN_COUNT, PER_PAGE } from './fixtures/coins';
import { card, cards, expectCardCount, visibleCoinIds } from './helpers/dom';

test.describe('controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinsPaged(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });

  test('shows the pager with page 1 active on first load', async ({ page }) => {
    await expect(page.getByTestId('pagination')).toBeVisible();
    await expect(page.getByTestId('page-indicator')).toContainText('1');
  });

  test('disables the previous-page control on the first page', async ({ page }) => {
    await expect(page.getByTestId('prev-page')).toBeDisabled();
    await expect(page.getByTestId('next-page')).toBeEnabled();
  });

  test('requests the next page and renders its coins', async ({ page }) => {
    await page.getByTestId('next-page').click();

    await expectCardCount(page, PER_PAGE);
    await expect(page.getByTestId('page-indicator')).toContainText('2');
    await expect(card(page, 'ethereum-classic')).toBeVisible();
    // A page-1 coin must no longer be on screen.
    await expect(card(page, 'bitcoin')).toHaveCount(0);
  });

  test('returns to the previous page', async ({ page }) => {
    await page.getByTestId('next-page').click();
    await expect(card(page, 'ethereum-classic')).toBeVisible();

    await page.getByTestId('prev-page').click();

    await expect(page.getByTestId('page-indicator')).toContainText('1');
    await expect(card(page, 'bitcoin')).toBeVisible();
    await expect(page.getByTestId('prev-page')).toBeDisabled();
  });

  test('sends the requested page number to the API', async ({ page }) => {
    const state = await mockCoinsPaged(page);
    await page.reload();
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('next-page').click();
    await expect(card(page, 'ethereum-classic')).toBeVisible();

    expect(state.requestedPages).toContain(2);
  });
});

test.describe('end of data', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinsPaged(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });

  test('disables the next-page control on a short final page', async ({ page }) => {
    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-indicator')).toContainText('2');

    await page.getByTestId('next-page').click();

    // Page 3 holds 7 coins — fewer than a full page, so there is nothing after it.
    await expectCardCount(page, 7);
    await expect(page.getByTestId('page-indicator')).toContainText('3');
    await expect(page.getByTestId('next-page')).toBeDisabled();
    await expect(page.getByTestId('prev-page')).toBeEnabled();
  });
});

test.describe('caching across pages', () => {
  test('caches each page separately and does not re-request on return', async ({ page }) => {
    const state = await mockCoinsPaged(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('next-page').click();
    await expect(card(page, 'ethereum-classic')).toBeVisible();

    await page.getByTestId('prev-page').click();
    await expect(card(page, 'bitcoin')).toBeVisible();

    // One request for page 1, one for page 2 — going back is served from cache.
    expect(state.requestedPages).toEqual([1, 2]);
  });
});

test.describe('errors while paging', () => {
  test('shows the error state when a later page fails, and retry recovers', async ({ page }) => {
    const { recover } = await mockPageTwoFailure(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('next-page').click();

    await expect(page.getByTestId('error-state')).toBeVisible();
    await expect(cards(page)).toHaveCount(0);

    recover();
    await page.getByTestId('retry-button').click();

    await expectCardCount(page, PER_PAGE);
    await expect(card(page, 'ethereum-classic')).toBeVisible();
    await expect(page.getByTestId('page-indicator')).toContainText('2');
  });
});

test.describe('interaction with sorting', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinsPaged(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });

  test('changing the sort field returns to page 1', async ({ page }) => {
    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-indicator')).toContainText('2');

    await page.getByTestId('sort-field').selectOption('volume');

    await expect(page.getByTestId('page-indicator')).toContainText('1');
  });

  test('paging keeps the chosen sort field selected', async ({ page }) => {
    await page.getByTestId('sort-field').selectOption('volume');
    await page.getByTestId('next-page').click();

    await expect(page.getByTestId('page-indicator')).toContainText('2');
    await expect(page.getByTestId('sort-field')).toHaveValue('volume');
  });
});

test('scrolls back to the top when the page changes', async ({ page }) => {
  await mockCoinsPaged(page);
  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await page.getByTestId('next-page').click();
  await expect(card(page, 'ethereum-classic')).toBeVisible();

  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test.describe('rank range summary', () => {
  /**
   * Found by visual review: the header claimed "Top 20" while page 2 showed
   * ranks 21-40. The pager must state where in the market you actually are.
   */
  test.beforeEach(async ({ page }) => {
    await mockCoinsPaged(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });

  test('summarises the rank range on the first page', async ({ page }) => {
    await expect(page.getByTestId('pagination')).toContainText('Ranks 1\u201320');
  });

  test('summarises the rank range on a later page', async ({ page }) => {
    await page.getByTestId('next-page').click();
    await expect(card(page, 'ethereum-classic')).toBeVisible();

    await expect(page.getByTestId('pagination')).toContainText('Ranks 21\u201340');
  });

  test('summarises a short final page correctly', async ({ page }) => {
    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-indicator')).toContainText('2');
    await page.getByTestId('next-page').click();
    await expectCardCount(page, 7);

    await expect(page.getByTestId('pagination')).toContainText('Ranks 41\u201347');
  });

  test('no longer claims "Top 20" once past the first page', async ({ page }) => {
    await page.getByTestId('next-page').click();
    await expect(card(page, 'ethereum-classic')).toBeVisible();

    // Each coin card also renders a <header>, so target the page-level banner
    // landmark rather than every header on the page.
    await expect(page.getByRole('banner')).not.toContainText('Top 20');
  });
});
