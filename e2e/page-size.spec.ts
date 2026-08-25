/**
 * Journey 10
 * As a crypto watcher, I want to choose how many coins a page shows, so that I
 * can scan a short list or a long one without changing my mind about paging.
 *
 * Page size is part of the request (`per_page`), not a local slice: asking for
 * 50 fetches 50. So changing it re-requests, resets to page 1, and caches under
 * its own key.
 */
import { test, expect } from '@playwright/test';
import { mockCoinsSized } from './helpers/mockApi';
import { card, cards, expectCardCount } from './helpers/dom';

test.describe('the control', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);
  });

  test('defaults to the configured page size', async ({ page }) => {
    await expect(page.getByTestId('page-size')).toHaveValue('20');
  });

  test('offers the configured default among its options', async ({ page }) => {
    const values = await page
      .getByTestId('page-size')
      .locator('option')
      .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));

    expect(values).toContain('20');
    expect(values).toContain('50');
  });
});

test.describe('changing the size', () => {
  test('requests the new size from the API', async ({ page }) => {
    const state = await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('page-size').selectOption('50');

    await expect.poll(() => state.requests.map((r) => r.perPage)).toContain(50);
  });

  test('renders as many coins as the new size returns', async ({ page }) => {
    await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('page-size').selectOption('50');

    await expectCardCount(page, 50);
  });

  test('shrinks the list when a smaller size is chosen', async ({ page }) => {
    await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('page-size').selectOption('10');

    await expectCardCount(page, 10);
  });

  test('returns to page 1, because page N of a different size is meaningless', async ({ page }) => {
    await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-indicator')).toContainText('2');

    await page.getByTestId('page-size').selectOption('50');

    await expect(page.getByTestId('page-indicator')).toContainText('1');
    await expectCardCount(page, 50);
  });

  test('caches each size separately', async ({ page }) => {
    const state = await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('page-size').selectOption('50');
    await expectCardCount(page, 50);

    await page.getByTestId('page-size').selectOption('20');
    await expectCardCount(page, 20);

    // 20 (load), 50, then 20 again from cache -> only two requests.
    expect(state.requests.map((r) => r.perPage)).toEqual([20, 50]);
  });
});

test.describe('interaction with paging', () => {
  test('pages at the chosen size', async ({ page }) => {
    const state = await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('page-size').selectOption('10');
    await expectCardCount(page, 10);
    await expect(card(page, 'synthetic-1')).toBeVisible();

    await page.getByTestId('next-page').click();

    await expectCardCount(page, 10);
    // Page 2 at size 10 starts at rank 11, not rank 21.
    await expect(card(page, 'synthetic-11')).toBeVisible();
    expect(state.requests).toContainEqual({ page: 2, perPage: 10 });
  });

  test('detects the last page relative to the chosen size', async ({ page }) => {
    // Only 30 coins exist, so a 50-per-page request returns a short page.
    await mockCoinsSized(page, 30);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('page-size').selectOption('50');

    await expectCardCount(page, 30);
    await expect(page.getByTestId('next-page')).toBeDisabled();
  });

  test('reports the rank range for the chosen size', async ({ page }) => {
    await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('page-size').selectOption('10');
    await expectCardCount(page, 10);

    await expect(page.getByTestId('pagination')).toContainText('Ranks 1–10');
  });
});

test.describe('the rest of the UI keeps up', () => {
  test('the heading reflects the chosen size on page 1', async ({ page }) => {
    await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('page-size').selectOption('50');
    await expectCardCount(page, 50);

    await expect(page.getByRole('banner')).toContainText('Top 50');
  });

  test('search still filters the freshly sized page', async ({ page }) => {
    await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('page-size').selectOption('50');
    await expectCardCount(page, 50);

    await page.getByTestId('search-input').fill('Synthetic 42');

    await expectCardCount(page, 1);
    await expect(card(page, 'synthetic-42')).toBeVisible();
  });

  test('shows skeletons while the resized page loads', async ({ page }) => {
    await mockCoinsSized(page);
    await page.goto('/');
    await expectCardCount(page, 20);

    await page.getByTestId('page-size').selectOption('100');

    // The old page must not linger next to the new one.
    await expect(cards(page)).toHaveCount(100);
  });
});
