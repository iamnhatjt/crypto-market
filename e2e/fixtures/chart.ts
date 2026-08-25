/**
 * Stand-in for `/coins/{id}/market_chart`.
 *
 * Verified against the live API: `prices` is `[[timestamp_ms, price], ...]`,
 * alongside `market_caps` and `total_volumes`. Point density varies by range —
 * days=1 gives 5-minute points, days=7 and 30 hourly, days=90 hourly (2161
 * points), days=365 daily. days=max is rejected with error 10012.
 */
export interface MarketChartFixture {
  prices: Array<[number, number]>;
  market_caps: Array<[number, number]>;
  total_volumes: Array<[number, number]>;
}

/** A fixed epoch so every generated series is byte-identical between runs. */
export const SERIES_START_MS = 1_700_000_000_000;

export interface SeriesOptions {
  /** Milliseconds between points. Defaults to one hour. */
  stepMs?: number;
  startPrice?: number;
  /** Added to the price each step; negative trends the series down. */
  drift?: number;
  /** Overrides the price at a specific index, for planting a known min or max. */
  spikes?: Record<number, number>;
}

export function makeSeries(count: number, options: SeriesOptions = {}): MarketChartFixture {
  const { stepMs = 3_600_000, startPrice = 100, drift = 1, spikes = {} } = options;

  const prices = Array.from({ length: count }, (_, index): [number, number] => {
    const timestamp = SERIES_START_MS + index * stepMs;
    const price = spikes[index] ?? startPrice + index * drift;

    return [timestamp, price];
  });

  return {
    prices,
    market_caps: prices.map(([t, p]) => [t, p * 1_000_000] as [number, number]),
    total_volumes: prices.map(([t, p]) => [t, p * 1_000] as [number, number]),
  };
}

/** Every price identical — the divide-by-zero case for any y-scaling. */
export function makeFlatSeries(count: number): MarketChartFixture {
  return makeSeries(count, { startPrice: 42, drift: 0 });
}

export const emptySeries: MarketChartFixture = { prices: [], market_caps: [], total_volumes: [] };
