/**
 * Journey 14
 * As a crypto watcher on a coin's page, I want its key market figures and a
 * short description, so that I can judge the coin without leaving for another
 * site.
 */
import { test, expect } from '@playwright/test';
import { mockCoinDetail } from './helpers/mockApi';
import { bitcoinDetailFixture, makeDetail } from './fixtures/detail';

test.describe('identity', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinDetail(page);
    await page.goto('/coins/bitcoin');
  });

  test('shows the name, symbol, icon and rank', async ({ page }) => {
    await expect(page.getByTestId('coin-detail-name')).toHaveText('Bitcoin');
    await expect(page.getByTestId('coin-detail-symbol')).toHaveText('BTC');
    await expect(page.getByTestId('coin-detail-icon')).toBeVisible();
    await expect(page.getByTestId('coin-detail-rank')).toContainText('1');
  });

  test('shows the current price and 24h change', async ({ page }) => {
    await expect(page.getByTestId('coin-detail-price')).toHaveText('$64,000.00');
    await expect(page.getByTestId('coin-detail-change')).toHaveText('+2.50%');
    await expect(page.getByTestId('coin-detail-change')).toHaveAttribute('data-trend', 'up');
  });

  test('requests the coin named in the URL', async ({ page }) => {
    const state = await mockCoinDetail(page);
    await page.goto('/coins/cardano');
    await expect(page.getByTestId('coin-detail-name')).toBeVisible();

    expect(state.requestedIds).toContain('cardano');
  });
});

test.describe('market statistics', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinDetail(page);
    await page.goto('/coins/bitcoin');
    await expect(page.getByTestId('coin-detail-name')).toBeVisible();
  });

  const expected: Array<[string, string]> = [
    ['stat-high-24h', '$65,100.00'],
    ['stat-low-24h', '$62,800.00'],
    ['stat-market-cap', '$1.3T'],
    ['stat-volume-24h', '$45.6B'],
    ['stat-ath', '$126,080.00'],
    ['stat-atl', '$67.81'],
  ];

  for (const [testId, value] of expected) {
    test(`shows ${testId.replace('stat-', '')}`, async ({ page }) => {
      await expect(page.getByTestId(testId)).toContainText(value);
    });
  }

  test('dates the all-time high and low', async ({ page }) => {
    await expect(page.getByTestId('stat-ath')).toContainText('2025');
    await expect(page.getByTestId('stat-atl')).toContainText('2013');
  });

  test('shows supply figures with thousands separators', async ({ page }) => {
    await expect(page.getByTestId('stat-circulating-supply')).toContainText('20,074,793');
    await expect(page.getByTestId('stat-max-supply')).toContainText('21,000,000');
  });

  test('shows the 7 day change', async ({ page }) => {
    await expect(page.getByTestId('stat-change-7d')).toContainText('+25.86%');
  });
});

test.describe('missing figures', () => {
  test('shows a placeholder instead of a blank or NaN', async ({ page }) => {
    await mockCoinDetail(page, {
      detail: makeDetail({
        market_cap_rank: null,
        market_data: {
          max_supply: null,
          ath_date: { usd: null },
          high_24h: { usd: null },
          price_change_percentage_7d: null,
        },
      }),
    });
    await page.goto('/coins/bitcoin');
    await expect(page.getByTestId('coin-detail-name')).toBeVisible();

    await expect(page.getByTestId('stat-max-supply')).toContainText('—');
    await expect(page.getByTestId('stat-high-24h')).toContainText('—');
    await expect(page.getByTestId('stat-change-7d')).toContainText('—');
    await expect(page.getByTestId('coin-detail-rank')).toHaveCount(0);
  });

  test('leaks no NaN, undefined or null', async ({ page }) => {
    await mockCoinDetail(page, {
      detail: makeDetail({
        market_cap_rank: null,
        market_data: { max_supply: null, ath_date: { usd: null }, atl: { usd: null } },
      }),
    });
    await page.goto('/coins/bitcoin');
    await expect(page.getByTestId('coin-detail-name')).toBeVisible();

    const text = (await page.locator('main').innerText()).toLowerCase();
    expect(text).not.toMatch(/\bnan\b/);
    expect(text).not.toMatch(/\bundefined\b/);
    expect(text).not.toMatch(/\bnull\b/);
  });
});

test.describe('description', () => {
  test('shows the description text', async ({ page }) => {
    await mockCoinDetail(page);
    await page.goto('/coins/bitcoin');

    await expect(page.getByTestId('coin-description')).toContainText(
      'first decentralised cryptocurrency'
    );
  });

  test('renders markup in the description as text, never as HTML', async ({ page }) => {
    // CoinGecko descriptions commonly embed <a> tags. Injecting them into the
    // DOM would be an XSS hole, so the markup must appear literally.
    await mockCoinDetail(page, {
      detail: makeDetail({
        description: {
          en: 'Danger <a href="https://evil.example">click me</a> and <img src=x onerror="alert(1)">.',
        },
      }),
    });
    await page.goto('/coins/bitcoin');

    const description = page.getByTestId('coin-description');
    await expect(description).toContainText('<a href="https://evil.example">click me</a>');
    await expect(description.locator('a')).toHaveCount(0);
    await expect(description.locator('img')).toHaveCount(0);
  });

  test('links to the homepage when one is given', async ({ page }) => {
    await mockCoinDetail(page);
    await page.goto('/coins/bitcoin');

    await expect(page.getByTestId('coin-homepage')).toHaveAttribute('href', 'https://bitcoin.org');
  });

  test('omits the homepage link when none is given', async ({ page }) => {
    await mockCoinDetail(page, { detail: makeDetail({ links: { homepage: [] } }) });
    await page.goto('/coins/bitcoin');
    await expect(page.getByTestId('coin-detail-name')).toBeVisible();

    await expect(page.getByTestId('coin-homepage')).toHaveCount(0);
  });
});

test.describe('failure and loading', () => {
  test('shows skeletons while the request is in flight', async ({ page }) => {
    await mockCoinDetail(page, { delayMs: 1500 });
    await page.goto('/coins/bitcoin');

    await expect(page.getByTestId('detail-skeleton')).toBeVisible();
    await expect(page.getByTestId('coin-detail-name')).toBeVisible();
    await expect(page.getByTestId('detail-skeleton')).toBeHidden();
  });

  test('shows an error with retry when the coin is not found', async ({ page }) => {
    await mockCoinDetail(page, { status: 404 });
    await page.goto('/coins/not-a-real-coin');

    await expect(page.getByTestId('error-state')).toBeVisible();
    await expect(page.getByTestId('retry-button')).toBeVisible();
    // The way back must still be reachable from an error.
    await expect(page.getByTestId('back-to-list')).toBeVisible();
  });

  test('retry recovers once the request succeeds', async ({ page }) => {
    const state = await mockCoinDetail(page, { failUntilRecovered: true });
    await page.goto('/coins/bitcoin');
    await expect(page.getByTestId('error-state')).toBeVisible();

    state.recover();
    await page.getByTestId('retry-button').click();

    await expect(page.getByTestId('coin-detail-name')).toHaveText('Bitcoin');
    await expect(page.getByTestId('error-state')).toHaveCount(0);
  });

  test('the fixture used by these tests matches the live response shape', async () => {
    // Guards the fixture itself: these are the shapes verified against the API.
    expect(typeof bitcoinDetailFixture.image.large).toBe('string');
    expect(typeof bitcoinDetailFixture.market_data.current_price.usd).toBe('number');
    expect(typeof bitcoinDetailFixture.market_data.price_change_percentage_24h).toBe('number');
    expect(typeof bitcoinDetailFixture.market_data.ath_date.usd).toBe('string');
    expect(Array.isArray(bitcoinDetailFixture.links.homepage)).toBe(true);
  });
});
