/**
 * Journey 11
 * As a crypto watcher sorting to the bottom of the market, I want coins with no
 * market-cap rank to display sensibly, so that the dashboard does not show
 * placeholder junk or contradict itself.
 *
 * Verified against the live API: `order=market_cap_asc` returns coins such as
 * namecoin with `market_cap_rank: null` and `market_cap: 0`. The original types
 * declared the rank non-nullable, which produced a bare "#" on every card and a
 * pager reading "No coins on this page." above 50 rendered coins.
 */
import { test, expect } from '@playwright/test';
import { MARKETS_ROUTE } from './helpers/mockApi';
import { makeMixedRankCoins, makeUnrankedCoins, MarketCoinFixture } from './fixtures/coins';
import { cards, expectCardCount } from './helpers/dom';

async function serve(page: import('@playwright/test').Page, coins: MarketCoinFixture[]) {
  await page.route(MARKETS_ROUTE, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(coins),
    })
  );
  await page.goto('/');
  await expectCardCount(page, coins.length);
}

test.describe('a coin with no rank', () => {
  test('renders no rank badge rather than a dangling hash', async ({ page }) => {
    await serve(page, makeUnrankedCoins(20));

    const text = await page.locator('[data-coin-id="unranked-1"]').innerText();

    // A "#" on its own is the symptom of rendering `#{null}`.
    expect(text.split('\n').map((line) => line.trim())).not.toContain('#');
    await expect(page.getByTestId('coin-rank')).toHaveCount(0);
  });

  test('a ranked coin still shows its rank badge', async ({ page }) => {
    await serve(page, makeMixedRankCoins(20));

    // Ranks 900-909 exist on the first ten cards.
    await expect(page.locator('[data-coin-id="mixed-1"]').getByTestId('coin-rank')).toHaveText(
      '#900'
    );
    // The unranked half carries no badge at all.
    await expect(page.getByTestId('coin-rank')).toHaveCount(10);
  });

  test('still renders its name, price and 24h change', async ({ page }) => {
    await serve(page, makeUnrankedCoins(20));

    const first = page.locator('[data-coin-id="unranked-1"]');
    await expect(first.getByTestId('coin-name')).toHaveText('Unranked 1');
    await expect(first.getByTestId('coin-price')).toHaveText('$0.01');
    await expect(first.getByTestId('coin-change')).toHaveText('+1.50%');
  });

  test('leaks no NaN, undefined or null into the page', async ({ page }) => {
    await serve(page, makeUnrankedCoins(20));

    const text = (await page.locator('main').innerText()).toLowerCase();
    expect(text).not.toMatch(/\bnan\b/);
    expect(text).not.toMatch(/\bundefined\b/);
    expect(text).not.toMatch(/\bnull\b/);
  });
});

test.describe('the pager summary', () => {
  test('falls back to a coin count when no coin on the page has a rank', async ({ page }) => {
    await serve(page, makeUnrankedCoins(20));

    // It must NOT claim the page is empty while showing 20 coins.
    await expect(page.getByTestId('pagination')).toContainText('20 coins');
    await expect(page.getByTestId('pagination')).not.toContainText('No coins');
  });

  test('reports the range of the ranks that do exist when only some are missing', async ({
    page,
  }) => {
    await serve(page, makeMixedRankCoins(20));

    // Ranks 900-909 are present; the other ten are null and must be ignored.
    await expect(page.getByTestId('pagination')).toContainText('Ranks 900–909');
  });

  test('still says the page is empty when it genuinely is', async ({ page }) => {
    await page.route(MARKETS_ROUTE, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/');

    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});
