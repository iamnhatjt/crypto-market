import { useCallback, useEffect, useRef, useState } from 'react';
import { coinsCacheKey, DEFAULT_ORDER, fetchCoins } from '../api/coins';
import { toErrorMessage } from '../api/client';
import { config } from '../config/env';
import { clearCache, readCache, writeCache } from '../lib/cache';
import { Coin, MarketsOrder } from '../types/coin';

interface UseCoinsResult {
  coins: Coin[];
  loading: boolean;
  error: string | null;
  /**
   * Whether another page is likely to exist. CoinGecko does not return a total
   * count on this endpoint, so a full page is treated as "there may be more"
   * and a short page as the end. Knowing the true total would cost an extra
   * request for information the user does not see.
   */
  hasNextPage: boolean;
  /** Re-read the current page through the cache. */
  retry: () => void;
  /** Skip the cache and go back to the network for the current page. */
  refresh: () => void;
}

export function useCoins(
  page: number,
  order: MarketsOrder = DEFAULT_ORDER,
  perPage: number = config.perPage
): UseCoinsResult {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Guards against setting state after the component has gone away.
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  const load = useCallback(
    async (
      targetPage: number,
      targetOrder: MarketsOrder,
      targetPerPage: number,
      options?: { force?: boolean; reset?: boolean }
    ) => {
      const force = options?.force ?? false;
      const reset = options?.reset ?? false;

      const cacheKey = coinsCacheKey(targetPage, targetOrder, targetPerPage);

      if (force) {
        clearCache(cacheKey);
      } else {
        const cached = readCache<Coin[]>(cacheKey);

        if (cached) {
          setCoins(cached);
          setHasNextPage(cached.length >= targetPerPage);
          setError(null);
          setLoading(false);
          return;
        }
      }

      // Changing page shows different data, so clear the grid and show
      // skeletons. A refresh of the same page keeps the current rows visible.
      if (reset) {
        setCoins([]);
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchCoins(targetPage, targetOrder, targetPerPage);

        if (!mounted.current) {
          return;
        }

        writeCache(cacheKey, data);
        setCoins(data);
        setHasNextPage(data.length >= targetPerPage);
        setError(null);
      } catch (caught) {
        if (!mounted.current) {
          return;
        }

        setCoins([]);
        setHasNextPage(false);
        setError(toErrorMessage(caught));
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    mounted.current = true;
    void load(page, order, perPage, { reset: true });
  }, [page, order, perPage, load]);

  const retry = useCallback(() => {
    void load(page, order, perPage);
  }, [load, page, order, perPage]);

  const refresh = useCallback(() => {
    void load(page, order, perPage, { force: true });
  }, [load, page, order, perPage]);

  return { coins, loading, error, hasNextPage, retry, refresh };
}
