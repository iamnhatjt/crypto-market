import type { Page } from '@playwright/test';
import { coinsFixture, MarketCoinFixture } from '../fixtures/coins';

/** Matches the CoinGecko markets endpoint regardless of query string. */
export const MARKETS_ROUTE = '**/api/v3/coins/markets*';

/** Serve the fixture (or a subset) for every markets request. */
export async function mockCoins(page: Page, coins: MarketCoinFixture[] = coinsFixture): Promise<void> {
  await page.route(MARKETS_ROUTE, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(coins) })
  );
}

/** Serve the fixture, but only after `delayMs` — keeps the loading state observable. */
export async function mockCoinsDelayed(page: Page, delayMs: number): Promise<void> {
  await page.route(MARKETS_ROUTE, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(coinsFixture),
    });
  });
}

/** Always answer with an HTTP error, exhausting the client's retries. */
export async function mockServerError(page: Page, status = 500): Promise<void> {
  await page.route(MARKETS_ROUTE, (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) })
  );
}

/** Simulate the connection dropping (DNS/offline), not an HTTP error response. */
export async function mockNetworkFailure(page: Page): Promise<void> {
  await page.route(MARKETS_ROUTE, (route) => route.abort('internetdisconnected'));
}

/**
 * Fail every request until `recover()` is called, then serve the fixture.
 * Used to prove the retry button actually recovers rather than just re-erroring.
 */
export async function mockFailThenRecover(page: Page): Promise<{ recover: () => void }> {
  let failing = true;

  await page.route(MARKETS_ROUTE, (route) => {
    if (failing) {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'unavailable' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(coinsFixture),
    });
  });

  return {
    recover: () => {
      failing = false;
    },
  };
}
