/**
 * Journey 1
 * As a crypto watcher, I want to see the top 20 coins by market cap with their
 * icon, name, symbol, price and 24h change, so that I can scan the market at a
 * glance.
 */
import { test, expect } from '@playwright/test';
import { mockCoins } from './helpers/mockApi';
import { coinsFixture, EXPECTED_COIN_COUNT } from './fixtures/coins';
import { card, cards, expectCardCount, textColor } from './helpers/dom';

test.beforeEach(async ({ page }) => {
  await mockCoins(page);
  await page.goto('/');
});

test('renders one card per coin returned by the API', async ({ page }) => {
  await expectCardCount(page, EXPECTED_COIN_COUNT);
});

test('each card shows an icon, a name, a symbol, a price and a 24h change', async ({ page }) => {
  const bitcoin = card(page, 'bitcoin');

  await expect(bitcoin.getByTestId('coin-icon')).toBeVisible();
  await expect(bitcoin.getByTestId('coin-name')).toHaveText('Bitcoin');
  await expect(bitcoin.getByTestId('coin-symbol')).toHaveText('BTC');
  await expect(bitcoin.getByTestId('coin-price')).toBeVisible();
  await expect(bitcoin.getByTestId('coin-change')).toBeVisible();
});

test('formats prices at or above one dollar with thousands separators and two decimals', async ({
  page,
}) => {
  await expect(card(page, 'bitcoin').getByTestId('coin-price')).toHaveText('$64,000.00');
  await expect(card(page, 'ethereum').getByTestId('coin-price')).toHaveText('$3,400.00');
  await expect(card(page, 'tether').getByTestId('coin-price')).toHaveText('$1.00');
});

test('keeps sub-dollar prices readable instead of rounding them to zero', async ({ page }) => {
  await expect(card(page, 'shiba-inu').getByTestId('coin-price')).toHaveText('$0.00002341');
  await expect(card(page, 'cardano').getByTestId('coin-price')).toHaveText('$0.4512');
});

test('shows a signed, two-decimal percentage for the 24h change', async ({ page }) => {
  await expect(card(page, 'bitcoin').getByTestId('coin-change')).toHaveText('+2.50%');
  await expect(card(page, 'ethereum').getByTestId('coin-change')).toHaveText('-1.20%');
  await expect(card(page, 'avalanche-2').getByTestId('coin-change')).toHaveText('+12.75%');
});

test('renders a positive 24h change in green', async ({ page }) => {
  const change = card(page, 'bitcoin').getByTestId('coin-change');

  await expect(change).toHaveAttribute('data-trend', 'up');

  const { r, g } = await textColor(change);
  expect(g, 'green channel should dominate for a gain').toBeGreaterThan(r);
});

test('renders a negative 24h change in red', async ({ page }) => {
  const change = card(page, 'ethereum').getByTestId('coin-change');

  await expect(change).toHaveAttribute('data-trend', 'down');

  const { r, g } = await textColor(change);
  expect(r, 'red channel should dominate for a loss').toBeGreaterThan(g);
});

test('renders a placeholder instead of NaN when the 24h change is missing', async ({ page }) => {
  const change = card(page, 'stasis-eurs').getByTestId('coin-change');

  await expect(change).toHaveText('—');
  await expect(change).toHaveAttribute('data-trend', 'flat');
});

test('never leaks NaN, undefined or null into the rendered page', async ({ page }) => {
  await expect(cards(page).first()).toBeVisible();

  const text = (await page.locator('main').innerText()).toLowerCase();

  // Word-bounded: "Binance Coin" legitimately contains the substring "nan".
  expect(text).not.toMatch(/\bnan\b/);
  expect(text).not.toMatch(/\bundefined\b/);
  expect(text).not.toMatch(/\bnull\b/);
});

test.describe('changes that round to zero', () => {
  /**
   * The live API returns values like -0.0004% for stablecoins. Deriving the
   * trend from the raw number renders a red "-0.00%", which reads as a loss
   * that did not happen. Trend must follow the number the user actually sees.
   */
  const dust = (percent: number) => [
    { ...coinsFixture[0], id: 'dust-coin', name: 'Dust Coin', symbol: 'dust', price_change_percentage_24h: percent },
  ];

  test('renders an unsigned zero for a tiny negative change', async ({ page }) => {
    await mockCoins(page, dust(-0.0004));
    await page.goto('/');

    const change = card(page, 'dust-coin').getByTestId('coin-change');
    await expect(change).toHaveText('0.00%');
    await expect(change).toHaveAttribute('data-trend', 'flat');
  });

  test('renders an unsigned zero for a tiny positive change', async ({ page }) => {
    await mockCoins(page, dust(0.0004));
    await page.goto('/');

    const change = card(page, 'dust-coin').getByTestId('coin-change');
    await expect(change).toHaveText('0.00%');
    await expect(change).toHaveAttribute('data-trend', 'flat');
  });

  test('renders an unsigned zero for an exactly zero change', async ({ page }) => {
    await mockCoins(page, dust(0));
    await page.goto('/');

    const change = card(page, 'dust-coin').getByTestId('coin-change');
    await expect(change).toHaveText('0.00%');
    await expect(change).toHaveAttribute('data-trend', 'flat');
  });

  test('still signs a change that survives rounding', async ({ page }) => {
    await mockCoins(page, dust(-0.006));
    await page.goto('/');

    const change = card(page, 'dust-coin').getByTestId('coin-change');
    await expect(change).toHaveText('-0.01%');
    await expect(change).toHaveAttribute('data-trend', 'down');
  });
});
