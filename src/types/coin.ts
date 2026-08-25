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
  total_volume: number | null;
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
  totalVolume: number | null;
  priceChange24h: number | null;
}

/**
 * Fields the grid can be ordered by.
 *
 * Deliberately limited to what CoinGecko's `order` parameter honours. Price and
 * 24h change are absent because the API answers 200 with plain market-cap
 * ordering when asked for them — offering them would ship two sorts that only
 * appear to work.
 */
export type SortField = 'market_cap' | 'volume';

export type SortDirection = 'asc' | 'desc';

/**
 * `order` values CoinGecko's /coins/markets actually honours.
 *
 * Verified against the live API, which answers 200 with plain market-cap
 * ordering for unsupported values such as `price_desc` rather than erroring.
 * This union exists so an ignored value cannot be sent by accident.
 */
export type MarketsOrder = `${SortField}_${SortDirection}`;



/** Direction of a coin's 24h move, used for colour and iconography. */
export type Trend = 'up' | 'down' | 'flat';

/**
 * Wire shape of `/coins/{id}`.
 *
 * Differs from `/coins/markets` in ways worth spelling out: `image` is an object
 * rather than a URL string, `market_cap_rank` sits at the top level, and the
 * monetary fields are dicts keyed by currency. All verified against the live API.
 */
export interface CoinDetailResponse {
  id: string;
  symbol: string;
  name: string;
  image?: { thumb?: string; small?: string; large?: string };
  market_cap_rank: number | null;
  description?: { en?: string };
  links?: { homepage?: string[] };
  market_data?: {
    current_price?: { usd?: number | null };
    high_24h?: { usd?: number | null };
    low_24h?: { usd?: number | null };
    market_cap?: { usd?: number | null };
    total_volume?: { usd?: number | null };
    ath?: { usd?: number | null };
    ath_date?: { usd?: string | null };
    atl?: { usd?: number | null };
    atl_date?: { usd?: string | null };
    price_change_percentage_24h?: number | null;
    price_change_percentage_7d?: number | null;
    circulating_supply?: number | null;
    total_supply?: number | null;
    max_supply?: number | null;
  };
}

/** Domain model for the detail page. Every optional wire field lands as null. */
export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  marketCapRank: number | null;
  description: string;
  homepage: string | null;
  currentPrice: number | null;
  high24h: number | null;
  low24h: number | null;
  marketCap: number | null;
  totalVolume: number | null;
  ath: number | null;
  athDate: string | null;
  atl: number | null;
  atlDate: string | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
}

/** Wire shape of `/coins/{id}/market_chart`. */
export interface MarketChartResponse {
  prices?: Array<[number, number]>;
}

/** One plotted point: epoch milliseconds and a USD price. */
export interface PricePoint {
  time: number;
  price: number;
}

/**
 * Chart ranges, in days.
 *
 * `max` is deliberately absent: the free tier rejects it with error 10012,
 * limiting history to 365 days.
 */
export type ChartRange = 1 | 7 | 30 | 90 | 365;
