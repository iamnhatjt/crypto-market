import { apiClient } from './client';
import { toCoin } from './coins';
import { Coin, CoinMarketResponse, MarketsOrder } from '../types/coin';

/** What CoinGecko's /search returns per coin: identity only, never a price. */
interface SearchCoinResponse {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
}

interface SearchResponse {
  coins?: SearchCoinResponse[];
}

/**
 * Shortest query worth a network round trip. One character matches most of the
 * market and tells the user nothing.
 */
export const MIN_SEARCH_LENGTH = 2;

/**
 * Cap on hydrated results. /search can return a long tail of near-irrelevant
 * matches, and every extra id makes the hydration URL longer for rows nobody
 * scrolls to.
 */
const MAX_SEARCH_RESULTS = 25;

export function searchCacheKey(query: string, order: MarketsOrder): string {
  return `crypto-dashboard:coins:search:${order}:${query.toLowerCase()}`;
}

const inFlight = new Map<string, Promise<Coin[]>>();

/**
 * Resolve a keyword to fully priced coins.
 *
 * Two hops by necessity: /search knows names and symbols but no market data,
 * and /coins/markets knows market data but has no keyword parameter. The `ids`
 * parameter is the bridge between them.
 */
export async function searchCoins(query: string, order: MarketsOrder): Promise<Coin[]> {
  const needle = query.trim();

  if (needle.length < MIN_SEARCH_LENGTH) {
    return [];
  }

  const key = `${order}:${needle.toLowerCase()}`;
  const cached = inFlight.get(key);

  if (cached) {
    return cached;
  }

  const request = (async () => {
    const { data } = await apiClient.get<SearchResponse>('/search', {
      params: { query: needle },
    });

    const ids = (data?.coins ?? [])
      .map((coin) => coin.id)
      .filter((id): id is string => typeof id === 'string' && id !== '')
      .slice(0, MAX_SEARCH_RESULTS);

    // Nothing matched, so there is nothing to price.
    if (ids.length === 0) {
      return [];
    }

    const { data: markets } = await apiClient.get<CoinMarketResponse[]>('/coins/markets', {
      params: {
        vs_currency: 'usd',
        ids: ids.join(','),
        order,
        per_page: ids.length,
        page: 1,
        sparkline: false,
      },
    });

    if (!Array.isArray(markets)) {
      throw new Error('Unexpected response shape from CoinGecko.');
    }

    return markets.map(toCoin);
  })().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, request);

  return request;
}
