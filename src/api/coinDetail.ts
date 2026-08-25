import { apiClient } from './client';
import { CoinDetail, CoinDetailResponse } from '../types/coin';

const DETAIL_PARAMS = {
  localization: false,
  tickers: false,
  market_data: true,
  community_data: false,
  developer_data: false,
  sparkline: false,
} as const;

export function coinDetailCacheKey(coinId: string): string {
  return `crypto-dashboard:coins:detail:${coinId}`;
}

/** Narrow an unknown numeric field to a number or null. Never NaN. */
function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function toCoinDetail(raw: CoinDetailResponse): CoinDetail {
  const md = raw.market_data ?? {};

  return {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    image: stringOrNull(raw.image?.large ?? raw.image?.small ?? raw.image?.thumb),
    marketCapRank: numberOrNull(raw.market_cap_rank),
    description: typeof raw.description?.en === 'string' ? raw.description.en : '',
    homepage: stringOrNull(raw.links?.homepage?.[0]),
    currentPrice: numberOrNull(md.current_price?.usd),
    high24h: numberOrNull(md.high_24h?.usd),
    low24h: numberOrNull(md.low_24h?.usd),
    marketCap: numberOrNull(md.market_cap?.usd),
    totalVolume: numberOrNull(md.total_volume?.usd),
    ath: numberOrNull(md.ath?.usd),
    athDate: stringOrNull(md.ath_date?.usd),
    atl: numberOrNull(md.atl?.usd),
    atlDate: stringOrNull(md.atl_date?.usd),
    priceChange24h: numberOrNull(md.price_change_percentage_24h),
    priceChange7d: numberOrNull(md.price_change_percentage_7d),
    circulatingSupply: numberOrNull(md.circulating_supply),
    totalSupply: numberOrNull(md.total_supply),
    maxSupply: numberOrNull(md.max_supply),
  };
}

/** Coalesces concurrent callers per coin, matching fetchCoins. */
const inFlight = new Map<string, Promise<CoinDetail>>();

export async function fetchCoinDetail(coinId: string): Promise<CoinDetail> {
  const pending = inFlight.get(coinId);

  if (pending) {
    return pending;
  }

  const request = apiClient
    .get<CoinDetailResponse>(`/coins/${encodeURIComponent(coinId)}`, { params: DETAIL_PARAMS })
    .then((response) => {
      if (response.data === null || typeof response.data !== 'object') {
        throw new Error('Unexpected response shape from CoinGecko.');
      }

      return toCoinDetail(response.data);
    })
    .finally(() => {
      inFlight.delete(coinId);
    });

  inFlight.set(coinId, request);

  return request;
}
