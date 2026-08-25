import { apiClient } from './client';
import { config } from '../config/env';
import { Coin, CoinMarketResponse, MarketsOrder } from '../types/coin';

const MARKETS_PATH = '/coins/markets';

export const FIRST_PAGE = 1;

export const DEFAULT_ORDER: MarketsOrder = 'market_cap_desc';

/**
 * Each combination of ordering, page size and page number caches independently,
 * so revisiting any of them is free.
 */
export function coinsCacheKey(page: number, order: MarketsOrder, perPage: number): string {
  return `crypto-dashboard:coins:markets:usd:${order}:per-${perPage}:page-${page}`;
}

/** Wire format -> domain model. Keeps snake_case out of the components. */
function toCoin(raw: CoinMarketResponse): Coin {
  return {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    image: raw.image,
    currentPrice: raw.current_price,
    marketCap: raw.market_cap,
    marketCapRank: raw.market_cap_rank,
    priceChange24h:
      typeof raw.price_change_percentage_24h === 'number' ? raw.price_change_percentage_24h : null,
  };
}

/**
 * Coalesces concurrent callers onto a single request, per page.
 *
 * React StrictMode mounts effects twice in development, and a user can click
 * refresh while a load is already running. Without this, both cases would fire
 * duplicate requests at a rate-limited API. Keying by page means paging quickly
 * does not collapse two different pages into one request.
 */
const inFlight = new Map<string, Promise<Coin[]>>();

export async function fetchCoins(
  page: number = FIRST_PAGE,
  order: MarketsOrder = DEFAULT_ORDER,
  perPage: number = config.perPage
): Promise<Coin[]> {
  const key = `${order}:${perPage}:${page}`;
  const pending = inFlight.get(key);

  if (pending) {
    return pending;
  }

  const request = apiClient
    .get<CoinMarketResponse[]>(MARKETS_PATH, {
      params: {
        vs_currency: 'usd',
        order,
        per_page: perPage,
        page,
        sparkline: false,
      },
    })
    .then((response) => {
      if (!Array.isArray(response.data)) {
        throw new Error('Unexpected response shape from CoinGecko.');
      }

      return response.data.map(toCoin);
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);

  return request;
}
