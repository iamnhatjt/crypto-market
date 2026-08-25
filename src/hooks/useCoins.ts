import { useCallback, useEffect, useRef, useState } from 'react';
import { COINS_CACHE_KEY, fetchCoins } from '../api/coins';
import { toErrorMessage } from '../api/client';
import { clearCache, readCache, writeCache } from '../lib/cache';
import { Coin } from '../types/coin';

interface UseCoinsResult {
  coins: Coin[];
  loading: boolean;
  error: string | null;
  /** Re-read through the cache. */
  retry: () => void;
  /** Skip the cache and go back to the network. */
  refresh: () => void;
}

export function useCoins(): UseCoinsResult {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guards against setting state after the component has gone away.
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  const load = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;

    if (force) {
      clearCache(COINS_CACHE_KEY);
    } else {
      const cached = readCache<Coin[]>(COINS_CACHE_KEY);

      if (cached) {
        setCoins(cached);
        setError(null);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchCoins();

      if (!mounted.current) {
        return;
      }

      writeCache(COINS_CACHE_KEY, data);
      setCoins(data);
      setError(null);
    } catch (caught) {
      if (!mounted.current) {
        return;
      }

      setCoins([]);
      setError(toErrorMessage(caught));
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
  }, [load]);

  const retry = useCallback(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    void load({ force: true });
  }, [load]);

  return { coins, loading, error, retry, refresh };
}
