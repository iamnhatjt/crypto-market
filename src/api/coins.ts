import { apiClient } from './client';
import { Coin, CoinMarketResponse } from '../types/coin';

export const COINS_CACHE_KEY = 'crypto-dashboard:coins:markets:usd';

const MARKETS_PATH = '/coins/markets';

const MARKETS_PARAMS = {
  vs_currency: 'usd',
  order: 'market_cap_desc',
  per_page: 20,
  page: 1,
  sparkline: false,
} as const;

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
 * Coalesces concurrent callers onto a single request.
 *
 * React StrictMode mounts effects twice in development, and a user can click
 * refresh while a load is already running. Without this, both cases would fire
 * duplicate requests at a rate-limited API.
 */
let inFlight: Promise<Coin[]> | null = null;

export async function fetchCoins(): Promise<Coin[]> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = apiClient
    .get<CoinMarketResponse[]>(MARKETS_PATH, { params: MARKETS_PARAMS })
    .then((response) => {
      if (!Array.isArray(response.data)) {
        throw new Error('Unexpected response shape from CoinGecko.');
      }

      return response.data.map(toCoin);
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
