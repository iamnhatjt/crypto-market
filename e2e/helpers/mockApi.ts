import type { Page } from '@playwright/test';
import {
  coinsFixture,
  coinsServerOrderedFixture,
  makeCoins,
  MarketCoinFixture,
  pagedFixtures,
} from '../fixtures/coins';

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

export interface MarketsRequest {
  page: number;
  order: string;
}

/**
 * Serve a payload that depends on the `order` param, recording every request.
 *
 * `market_cap_asc` returns a list whose order does not match its own market_cap
 * values, so a test can prove the app renders the server's ordering rather than
 * re-sorting locally.
 */
export async function mockCoinsOrdered(page: Page): Promise<{ requests: MarketsRequest[] }> {
  const state = { requests: [] as MarketsRequest[] };

  await page.route(MARKETS_ROUTE, (route) => {
    const params = new URL(route.request().url()).searchParams;
    const requestedPage = Number(params.get('page') ?? '1');
    const order = params.get('order') ?? '';

    state.requests.push({ page: requestedPage, order });

    const body =
      order === 'market_cap_asc'
        ? coinsServerOrderedFixture
        : pagedFixtures[requestedPage] ?? [];

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  return state;
}

export interface SizedRequest {
  page: number;
  perPage: number;
}

/**
 * Serve exactly `per_page` coins for whatever size is requested, recording each
 * request. `totalAvailable` caps the pool so a short final page can be tested at
 * any page size.
 */
export async function mockCoinsSized(
  page: Page,
  totalAvailable: number = Number.POSITIVE_INFINITY
): Promise<{ requests: SizedRequest[] }> {
  const state = { requests: [] as SizedRequest[] };

  await page.route(MARKETS_ROUTE, (route) => {
    const params = new URL(route.request().url()).searchParams;
    const perPage = Number(params.get('per_page') ?? '20');
    const requestedPage = Number(params.get('page') ?? '1');

    state.requests.push({ page: requestedPage, perPage });

    const startIndex = (requestedPage - 1) * perPage;
    const remaining = Math.max(0, totalAvailable - startIndex);
    const count = Math.min(perPage, remaining);

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeCoins(startIndex + 1, count)),
    });
  });

  return state;
}
