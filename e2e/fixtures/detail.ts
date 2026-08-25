/**
 * Stand-in for `/coins/{id}`, whose shape differs from `/coins/markets`.
 *
 * Verified against the live API:
 *   image                        object {thumb, small, large}, not a string
 *   market_cap_rank              top level, not inside market_data
 *   current_price / high_24h /
 *   low_24h / market_cap /
 *   total_volume / ath / atl /
 *   ath_date / atl_date          dicts keyed by currency
 *   price_change_percentage_24h  plain number
 *   circulating / total / max
 *   supply                       plain numbers
 *   links.homepage               array of strings
 */
export interface CoinDetailFixture {
  id: string;
  symbol: string;
  name: string;
  image: { thumb: string; small: string; large: string };
  market_cap_rank: number | null;
  description: { en: string };
  links: { homepage: string[] };
  market_data: {
    current_price: { usd: number };
    high_24h: { usd: number | null };
    low_24h: { usd: number | null };
    market_cap: { usd: number | null };
    total_volume: { usd: number | null };
    ath: { usd: number | null };
    ath_date: { usd: string | null };
    atl: { usd: number | null };
    atl_date: { usd: string | null };
    price_change_percentage_24h: number | null;
    price_change_percentage_7d: number | null;
    circulating_supply: number | null;
    total_supply: number | null;
    max_supply: number | null;
  };
}

const icon = (size: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32" fill="#f7931a"/><title>${size}</title></svg>`
  )}`;

export const bitcoinDetailFixture: CoinDetailFixture = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: { thumb: icon('thumb'), small: icon('small'), large: icon('large') },
  market_cap_rank: 1,
  description: {
    en: 'Bitcoin is the first decentralised cryptocurrency, released in 2009.',
  },
  links: { homepage: ['https://bitcoin.org'] },
  market_data: {
    current_price: { usd: 64000 },
    high_24h: { usd: 65100 },
    low_24h: { usd: 62800 },
    market_cap: { usd: 1_260_000_000_000 },
    total_volume: { usd: 45_600_000_000 },
    ath: { usd: 126_080 },
    ath_date: { usd: '2025-10-06T10:57:42.000Z' },
    atl: { usd: 67.81 },
    atl_date: { usd: '2013-07-05T16:00:00.000Z' },
    price_change_percentage_24h: 2.5,
    price_change_percentage_7d: 25.86,
    circulating_supply: 20_074_793,
    total_supply: 20_074_843,
    max_supply: 21_000_000,
  },
};

/** Build a variant without repeating the whole nested structure. */
export function makeDetail(
  overrides: Partial<CoinDetailFixture> & { market_data?: Partial<CoinDetailFixture['market_data']> }
): CoinDetailFixture {
  const { market_data, ...rest } = overrides;

  return {
    ...bitcoinDetailFixture,
    ...rest,
    market_data: { ...bitcoinDetailFixture.market_data, ...(market_data ?? {}) },
  };
}
