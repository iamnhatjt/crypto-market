import { useCallback, useEffect, useRef, useState } from 'react';
import { toErrorMessage } from '../api/client';
import { coinDetailCacheKey, fetchCoinDetail } from '../api/coinDetail';
import { readCache, writeCache } from '../lib/cache';
import { CoinDetail } from '../types/coin';

interface UseCoinDetailResult {
  detail: CoinDetail | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useCoinDetail(coinId: string): UseCoinDetailResult {
  const [detail, setDetail] = useState<CoinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  /** Guards against a slow request for a previous coin overwriting this one. */
  const latestId = useRef(coinId);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  const load = useCallback(async (targetId: string) => {
    latestId.current = targetId;

    if (targetId === '') {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    const cacheKey = coinDetailCacheKey(targetId);
    const cached = readCache<CoinDetail>(cacheKey);

    if (cached) {
      setDetail(cached);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const found = await fetchCoinDetail(targetId);

      if (!mounted.current || latestId.current !== targetId) {
        return;
      }

      writeCache(cacheKey, found);
      setDetail(found);
      setError(null);
    } catch (caught) {
      if (!mounted.current || latestId.current !== targetId) {
        return;
      }

      setDetail(null);
      setError(toErrorMessage(caught));
    } finally {
      if (mounted.current && latestId.current === targetId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load(coinId);
  }, [coinId, load]);

  const retry = useCallback(() => {
    void load(coinId);
  }, [coinId, load]);

  return { detail, loading, error, retry };
}
