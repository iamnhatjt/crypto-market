/**
 * Journey 6 (bonus)
 * As a crypto watcher, I want to switch between light and dark themes and have
 * my choice remembered, so that the dashboard matches my environment.
 */
import { test, expect } from '@playwright/test';
import { mockCoins } from './helpers/mockApi';
import { EXPECTED_COIN_COUNT } from './fixtures/coins';
import { expectCardCount } from './helpers/dom';

test.beforeEach(async ({ page }) => {
  await mockCoins(page);
  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);
});

test('toggles the document into dark mode', async ({ page }) => {
  const root = page.locator('html');
  await expect(root).not.toHaveClass(/dark/);

  await page.getByTestId('theme-toggle').click();

  await expect(root).toHaveClass(/dark/);
});

test('toggles back to light mode', async ({ page }) => {
  const toggle = page.getByTestId('theme-toggle');
  const root = page.locator('html');

  await toggle.click();
  await expect(root).toHaveClass(/dark/);

  await toggle.click();
  await expect(root).not.toHaveClass(/dark/);
});

test('remembers the chosen theme across a reload', async ({ page }) => {
  await page.getByTestId('theme-toggle').click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.reload();

  await expect(page.locator('html')).toHaveClass(/dark/);
});
