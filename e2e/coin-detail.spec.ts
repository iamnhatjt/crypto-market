/**
 * Journey 13
 * As a crypto watcher, I want to open a coin from the list and land on its own
 * page with a shareable URL, so that I can look at one coin closely and send
 * that view to someone else.
 */
import { test, expect } from '@playwright/test';
import { mockCoinsPaged } from './helpers/mockApi';
import { EXPECTED_COIN_COUNT } from './fixtures/coins';
import { card, expectCardCount } from './helpers/dom';

test.describe('navigating in', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinsPaged(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });

  test('each card is a real link, not a click handler', async ({ page }) => {
    // A real href means middle-click, cmd-click and keyboard all work for free.
    await expect(card(page, 'bitcoin').locator('xpath=ancestor-or-self::a')).toHaveAttribute(
      'href',
      '/coins/bitcoin'
    );
  });

  test('clicking a card opens that coin at its own URL', async ({ page }) => {
    await card(page, 'bitcoin').click();

    await expect(page).toHaveURL(/\/coins\/bitcoin$/);
    await expect(page.getByTestId('coin-detail-page')).toBeVisible();
  });

  test('opens the coin that was clicked, not merely the first one', async ({ page }) => {
    await card(page, 'cardano').click();

    await expect(page).toHaveURL(/\/coins\/cardano$/);
  });
});

test.describe('navigating out', () => {
  test('the back link returns to the dashboard', async ({ page }) => {
    await mockCoinsPaged(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await card(page, 'bitcoin').click();
    await expect(page.getByTestId('coin-detail-page')).toBeVisible();

    await page.getByTestId('back-to-list').click();

    await expect(page).toHaveURL(/\/$/);
    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });

  test('the browser back button also returns to the dashboard', async ({ page }) => {
    await mockCoinsPaged(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await card(page, 'bitcoin').click();
    await expect(page.getByTestId('coin-detail-page')).toBeVisible();

    await page.goBack();

    await expectCardCount(page, EXPECTED_COIN_COUNT);
  });
});

test.describe('deep linking', () => {
  test('a coin URL opens the detail page directly', async ({ page }) => {
    await mockCoinsPaged(page);

    // No visit to the list first — this is someone opening a shared link.
    await page.goto('/coins/bitcoin');

    await expect(page.getByTestId('coin-detail-page')).toBeVisible();
  });

  test('an unknown route shows a not-found page rather than a blank screen', async ({ page }) => {
    await mockCoinsPaged(page);

    await page.goto('/no-such-route');

    await expect(page.getByTestId('not-found')).toBeVisible();
    await expect(page.getByTestId('back-to-list')).toBeVisible();
  });
});

test('the theme toggle still works on the detail page', async ({ page }) => {
  await mockCoinsPaged(page);
  await page.goto('/coins/bitcoin');
  await expect(page.getByTestId('coin-detail-page')).toBeVisible();

  await page.getByTestId('theme-toggle').click();

  await expect(page.locator('html')).toHaveClass(/dark/);
});
