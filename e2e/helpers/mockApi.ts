import type { Page } from '@playwright/test';
import { coinsFixture, MarketCoinFixture, pagedFixtures } from '../fixtures/coins';

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

/**
 * Serve a different payload per `page` query param, recording which pages were
 * requested and in what order. An unknown page yields an empty list, which the
 * UI must treat as the end of the data rather than an error.
 */
export async function mockCoinsPaged(
  page: Page,
  pages: Record<number, MarketCoinFixture[]> = pagedFixtures
): Promise<{ requestedPages: number[] }> {
  const state = { requestedPages: [] as number[] };

  await page.route(MARKETS_ROUTE, (route) => {
    const requested = Number(new URL(route.request().url()).searchParams.get('page') ?? '1');
    state.requestedPages.push(requested);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pages[requested] ?? []),
    });
  });

  return state;
}

/** Serve page 1 normally, but fail every request for any other page. */
export async function mockPageTwoFailure(page: Page): Promise<{ recover: () => void }> {
  let failing = true;

  await page.route(MARKETS_ROUTE, (route) => {
    const requested = Number(new URL(route.request().url()).searchParams.get('page') ?? '1');

    if (requested !== 1 && failing) {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'boom' }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(pagedFixtures[requested] ?? []),
    });
  });

  return {
    recover: () => {
      failing = false;
    },
  };
}
