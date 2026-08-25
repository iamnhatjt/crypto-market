import { useCallback, useEffect, useRef, useState } from 'react';
import { toErrorMessage } from '../api/client';
import { coinChartCacheKey, fetchCoinChart } from '../api/coinChart';
import { readCache, writeCache } from '../lib/cache';
import { ChartRange, PricePoint } from '../types/coin';

interface UseCoinChartResult {
  points: PricePoint[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useCoinChart(coinId: string, range: ChartRange): UseCoinChartResult {
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  /** Discards a slow response for a range the user has already moved off. */
  const latestKey = useRef('');

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  const load = useCallback(async (targetId: string, targetRange: ChartRange) => {
    const key = `${targetId}:${targetRange}`;
    latestKey.current = key;

    if (targetId === '') {
      setPoints([]);
      setLoading(false);
      return;
    }

    const cacheKey = coinChartCacheKey(targetId, targetRange);
    const cached = readCache<PricePoint[]>(cacheKey);

    if (cached) {
      setPoints(cached);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const series = await fetchCoinChart(targetId, targetRange);

      if (!mounted.current || latestKey.current !== key) {
        return;
      }

      writeCache(cacheKey, series);
      setPoints(series);
      setError(null);
    } catch (caught) {
      if (!mounted.current || latestKey.current !== key) {
        return;
      }

      setPoints([]);
      setError(toErrorMessage(caught));
    } finally {
      if (mounted.current && latestKey.current === key) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load(coinId, range);
  }, [coinId, range, load]);

  const retry = useCallback(() => {
    void load(coinId, range);
  }, [coinId, range, load]);

  return { points, loading, error, retry };
}
