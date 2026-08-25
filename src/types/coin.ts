/**
 * Shape of a single entry in the CoinGecko `/coins/markets` response.
 *
 * Only the fields this dashboard consumes are declared. `price_change_percentage_24h`
 * is genuinely nullable in the live API (stablecoins and thinly traded assets can
 * come back without a 24h window), which is why every consumer has to handle null.
 */
export interface CoinMarketResponse {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number | null;
}

/** The domain model the UI renders. Camel-cased and decoupled from the wire format. */
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  priceChange24h: number | null;
}

/** Which field the grid is ordered by. */
export type SortField = 'market_cap' | 'price' | 'change';

export type SortDirection = 'asc' | 'desc';

/** Direction of a coin's 24h move, used for colour and iconography. */
export type Trend = 'up' | 'down' | 'flat';
