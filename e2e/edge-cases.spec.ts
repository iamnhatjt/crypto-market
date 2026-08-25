/**
 * Journey 4
 * As a crypto watcher on a flaky connection, I want clear loading, error and
 * empty states with a way to retry, so that I am never left staring at a blank
 * screen.
 */
import { test, expect } from '@playwright/test';
import {
  mockCoins,
  mockCoinsDelayed,
  mockSearchFlow,
  mockFailThenRecover,
  mockNetworkFailure,
  mockServerError,
} from './helpers/mockApi';
import { EXPECTED_COIN_COUNT } from './fixtures/coins';
import { cards, expectCardCount } from './helpers/dom';

test.describe('loading', () => {
  test('shows skeleton placeholders while the request is in flight', async ({ page }) => {
    await mockCoinsDelayed(page, 1500);
    await page.goto('/');

    await expect(page.getByTestId('skeleton-grid')).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
  });

  test('replaces the skeletons with real cards once data arrives', async ({ page }) => {
    await mockCoinsDelayed(page, 500);
    await page.goto('/');

    await expect(page.getByTestId('skeleton-grid')).toBeVisible();
    await expectCardCount(page, EXPECTED_COIN_COUNT);
    await expect(page.getByTestId('skeleton-grid')).toBeHidden();
  });
});

test.describe('API errors', () => {
  test('shows an error state with a retry action when the API returns 500', async ({ page }) => {
    await mockServerError(page, 500);
    await page.goto('/');

    await expect(page.getByTestId('error-state')).toBeVisible();
    await expect(page.getByTestId('retry-button')).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
  });

  test('shows the error state when the API rate-limits the request', async ({ page }) => {
    await mockServerError(page, 429);
    await page.goto('/');

    await expect(page.getByTestId('error-state')).toBeVisible();
  });

  test('recovers and renders the grid when retry succeeds', async ({ page }) => {
    const { recover } = await mockFailThenRecover(page);
    await page.goto('/');

    await expect(page.getByTestId('error-state')).toBeVisible();

    recover();
    await page.getByTestId('retry-button').click();

    await expectCardCount(page, EXPECTED_COIN_COUNT);
    await expect(page.getByTestId('error-state')).toBeHidden();
  });
});

test.describe('network failure', () => {
  test('shows the error state when the connection drops', async ({ page }) => {
    await mockNetworkFailure(page);
    await page.goto('/');

    await expect(page.getByTestId('error-state')).toBeVisible();
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });
});

test.describe('empty search results', () => {
  test.beforeEach(async ({ page }) => {
    await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });

  test('shows an empty state, not an error, when nothing matches the query', async ({ page }) => {
    await page.getByTestId('search-input').fill('zzzznotacoin');

    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByTestId('error-state')).toHaveCount(0);
  });

  test('echoes the query back so the user knows what was searched', async ({ page }) => {
    await page.getByTestId('search-input').fill('zzzznotacoin');

    await expect(page.getByTestId('empty-state')).toContainText('zzzznotacoin');
  });

  test('leaves the empty state when the query is cleared', async ({ page }) => {
    await page.getByTestId('search-input').fill('zzzznotacoin');
    await expect(page.getByTestId('empty-state')).toBeVisible();

    await page.getByTestId('search-input').fill('');

    await expectCardCount(page, EXPECTED_COIN_COUNT);
    await expect(page.getByTestId('empty-state')).toHaveCount(0);
  });
});
