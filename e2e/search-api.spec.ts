/**
 * Journey 12
 * As a crypto watcher, I want the search box to find any coin CoinGecko knows
 * about, not just the rows currently on screen, without firing a request per
 * keystroke.
 *
 * /coins/markets has no keyword parameter, so this is two calls: /search
 * resolves a keyword to coin ids, then /coins/markets?ids=... hydrates them
 * with prices. Verified against the live API — /search returns identities and
 * a nullable market_cap_rank, and the ids call returns full market rows.
 */
import { test, expect } from '@playwright/test';
import { mockSearchFlow } from './helpers/mockApi';
import { EXPECTED_COIN_COUNT } from './fixtures/coins';
import { card, cards, expectCardCount } from './helpers/dom';

test.describe('debouncing', () => {
  test('does not search until typing settles', async ({ page }) => {
    const state = await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    // Type a whole word character by character with no pause.
    await page.getByTestId('search-input').pressSequentially('cardano', { delay: 30 });

    await expect.poll(() => state.searchQueries).toEqual(['cardano']);
  });

  test('sends only the final query when the user keeps typing', async ({ page }) => {
    const state = await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    const input = page.getByTestId('search-input');
    await input.fill('car');
    await input.fill('carda');
    await input.fill('cardano');

    await expect.poll(() => state.searchQueries).toEqual(['cardano']);
    await expect(card(page, 'cardano')).toBeVisible();
  });

  test('ignores a query too short to be worth a request', async ({ page }) => {
    const state = await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('search-input').fill('c');

    // Still showing the browse list, and nothing was searched.
    await expectCardCount(page, EXPECTED_COIN_COUNT);
    expect(state.searchQueries).toEqual([]);
  });

  test('trims the query before sending it', async ({ page }) => {
    const state = await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('search-input').fill('   cardano   ');

    await expect.poll(() => state.searchQueries).toEqual(['cardano']);
  });

  test('shows that a search is in flight', async ({ page }) => {
    await mockSearchFlow(page, { delayMs: 1200 });
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('search-input').fill('cardano');

    await expect(page.getByTestId('search-status')).toBeVisible();
    await expect(card(page, 'cardano')).toBeVisible();
    await expect(page.getByTestId('search-status')).toBeHidden();
  });
});

test.describe('the two-step flow', () => {
  test('hydrates the ids /search returned so prices are shown', async ({ page }) => {
    const state = await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    // Tezos is deliberately NOT in the browse list, so its card can only come
    // from the search flow — a page-1 coin would appear either way.
    await page.getByTestId('search-input').fill('tezos');

    await expect.poll(() => state.hydratedIds.at(-1) ?? []).toContain('tezos');

    // The hydration call is what supplies the price /search omits.
    await expect(card(page, 'tezos').getByTestId('coin-price')).toHaveText('$0.7823');
    await expect(card(page, 'tezos').getByTestId('coin-change')).toHaveText('+0.90%');
  });

  test('finds coins that are not on the page being viewed', async ({ page }) => {
    await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    // Tezos lives on page 2; the old page-scoped filter could never find it.
    await page.getByTestId('search-input').fill('tezos');

    await expectCardCount(page, 1);
    await expect(card(page, 'tezos')).toBeVisible();
  });

  test('returns every coin the keyword matches', async ({ page }) => {
    await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('search-input').fill('bitcoin');

    await expectCardCount(page, 2);
    await expect(card(page, 'bitcoin')).toBeVisible();
    await expect(card(page, 'wrapped-bitcoin')).toBeVisible();
  });

  test('skips the hydration call when nothing matched', async ({ page }) => {
    const state = await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);
    const before = state.hydratedIds.length;

    await page.getByTestId('search-input').fill('zzzznotacoin');

    await expect(page.getByTestId('empty-state')).toBeVisible();
    // No point asking for prices for an empty id list.
    expect(state.hydratedIds.length).toBe(before);
  });
});

test.describe('races and caching', () => {
  test('renders the latest query, not whichever response arrives last', async ({ page }) => {
    await mockSearchFlow(page, { delayMs: 600 });
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    const input = page.getByTestId('search-input');
    await input.fill('tezos');
    await input.fill('cardano');

    await expect(card(page, 'cardano')).toBeVisible();
    await expect(card(page, 'tezos')).toHaveCount(0);
  });

  test('reuses a cached result when the same query comes back', async ({ page }) => {
    const state = await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    const input = page.getByTestId('search-input');
    await input.fill('tezos');
    await expect.poll(() => state.searchQueries).toEqual(['tezos']);
    await expect(card(page, 'tezos')).toBeVisible();

    await input.fill('');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await input.fill('tezos');
    await expect(card(page, 'tezos')).toBeVisible();

    // Wait past the debounce window so a second request would have landed.
    await page.waitForTimeout(800);
    expect(state.searchQueries).toEqual(['tezos']);
  });
});

test.describe('browse and search modes', () => {
  test('hides the pager while searching, and restores it afterwards', async ({ page }) => {
    await mockSearchFlow(page);
    await page.goto('/');
    await expect(page.getByTestId('pagination')).toBeVisible();

    await page.getByTestId('search-input').fill('cardano');
    await expect(card(page, 'cardano')).toBeVisible();

    // Search results are one relevance-ranked set, not a page of the market.
    await expect(page.getByTestId('pagination')).toHaveCount(0);

    await page.getByTestId('search-input').fill('');
    await expect(page.getByTestId('pagination')).toBeVisible();
  });

  test('returns to the page you were on when the search is cleared', async ({ page }) => {
    await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-indicator')).toContainText('2');

    await page.getByTestId('search-input').fill('cardano');
    await expect(card(page, 'cardano')).toBeVisible();

    await page.getByTestId('search-input').fill('');

    await expect(page.getByTestId('page-indicator')).toContainText('2');
    await expect(card(page, 'ethereum-classic')).toBeVisible();
  });

  test('says that sorting applies to the search results', async ({ page }) => {
    await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('search-input').fill('bitcoin');
    await expectCardCount(page, 2);

    await page.getByTestId('sort-field').selectOption('price');

    await expect(page.getByTestId('sort-scope')).toContainText('search results');
  });

  test('sorts the search results locally', async ({ page }) => {
    await mockSearchFlow(page);
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('search-input').fill('bitcoin');
    await expectCardCount(page, 2);

    await page.getByTestId('sort-field').selectOption('price');
    await page.getByTestId('sort-direction-asc').click();

    const ids = await cards(page).evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-coin-id'))
    );
    expect(ids).toEqual(['wrapped-bitcoin', 'bitcoin']);
  });
});

test.describe('failure', () => {
  test('shows an error with retry when the search request fails', async ({ page }) => {
    await mockSearchFlow(page, { searchStatus: 500 });
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('search-input').fill('cardano');

    await expect(page.getByTestId('error-state')).toBeVisible();
    await expect(page.getByTestId('retry-button')).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
  });

  test('clearing a failed search restores the browse list', async ({ page }) => {
    await mockSearchFlow(page, { searchStatus: 500 });
    await page.goto('/');
    await expectCardCount(page, EXPECTED_COIN_COUNT);

    await page.getByTestId('search-input').fill('cardano');
    await expect(page.getByTestId('error-state')).toBeVisible();

    await page.getByTestId('search-input').fill('');

    await expectCardCount(page, EXPECTED_COIN_COUNT);
    await expect(page.getByTestId('error-state')).toHaveCount(0);
  });
});
