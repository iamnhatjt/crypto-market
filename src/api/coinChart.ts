import { apiClient } from './client';
import { ChartRange, MarketChartResponse, PricePoint } from '../types/coin';

export const DEFAULT_RANGE: ChartRange = 7;

/** Offered ranges. `max` is excluded: the free tier rejects it (error 10012). */
export const CHART_RANGES: ChartRange[] = [1, 7, 30, 90, 365];

export function coinChartCacheKey(coinId: string, days: ChartRange): string {
  return `crypto-dashboard:coins:chart:${coinId}:${days}`;
}

/** `[timestamp_ms, price]` tuples -> named fields, dropping malformed entries. */
function toPricePoints(raw: MarketChartResponse): PricePoint[] {
  const prices = Array.isArray(raw?.prices) ? raw.prices : [];

  return prices
    .filter(
      (entry): entry is [number, number] =>
        Array.isArray(entry) &&
        entry.length >= 2 &&
        Number.isFinite(entry[0]) &&
        Number.isFinite(entry[1])
    )
    .map(([time, price]) => ({ time, price }));
}

const inFlight = new Map<string, Promise<PricePoint[]>>();

export async function fetchCoinChart(coinId: string, days: ChartRange): Promise<PricePoint[]> {
  const key = `${coinId}:${days}`;
  const pending = inFlight.get(key);

  if (pending) {
    return pending;
  }

  const request = apiClient
    .get<MarketChartResponse>(`/coins/${encodeURIComponent(coinId)}/market_chart`, {
      params: { vs_currency: 'usd', days },
    })
    .then((response) => toPricePoints(response.data))
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);

  return request;
}
