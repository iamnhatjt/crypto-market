/**
 * Journey 5
 * As a crypto watcher on any device, I want the card grid to reflow to my
 * screen width, so that the dashboard is usable on a phone and dense on a
 * desktop.
 */
import { test, expect } from '@playwright/test';
import { mockCoins } from './helpers/mockApi';
import { EXPECTED_COIN_COUNT } from './fixtures/coins';
import { expectCardCount, firstRowColumnCount } from './helpers/dom';

// Driven by explicit viewport sizes, so it only needs to run once.
test.skip(({ isMobile }) => Boolean(isMobile), 'viewport-driven; runs on the desktop project only');

test.beforeEach(async ({ page }) => {
  await mockCoins(page);
});

const breakpoints = [
  { label: 'mobile', width: 390, height: 844, columns: 1 },
  { label: 'tablet', width: 768, height: 1024, columns: 2 },
  { label: 'laptop', width: 1024, height: 800, columns: 3 },
  { label: 'desktop', width: 1440, height: 900, columns: 4 },
];

for (const { label, width, height, columns } of breakpoints) {
  test(`lays out ${columns} column(s) at ${label} width (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    expect(await firstRowColumnCount(page)).toBe(columns);
  });
}

test('never scrolls horizontally on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await expectCardCount(page, EXPECTED_COIN_COUNT);

  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );

  expect(overflows).toBe(false);
});
