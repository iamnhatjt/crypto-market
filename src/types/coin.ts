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
  /**
   * Nullable. Verified against the live API: `order=market_cap_asc` returns
   * coins such as namecoin with `market_cap_rank: null` and `market_cap: 0`.
   */
  market_cap_rank: number | null;
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
  marketCapRank: number | null;
  priceChange24h: number | null;
}

/** Which field the grid is ordered by. */
export type SortField = 'market_cap' | 'price' | 'change';

/**
 * `order` values CoinGecko's /coins/markets actually honours.
 *
 * Verified against the live API: it answers 200 with plain market-cap ordering
 * for unsupported values such as `price_desc` or `percent_change_24h_desc`
 * rather than erroring, so sending one would fail silently. This union exists
 * to make that impossible to do by accident.
 */
export type MarketsOrder = 'market_cap_desc' | 'market_cap_asc';

/** Whether a sort is resolved by the API or locally over the loaded page. */
export type SortScope = 'market' | 'page';

export type SortDirection = 'asc' | 'desc';

/** Direction of a coin's 24h move, used for colour and iconography. */
export type Trend = 'up' | 'down' | 'flat';
