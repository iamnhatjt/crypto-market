import { useCallback, useEffect, useRef, useState } from 'react';
import { toErrorMessage } from '../api/client';
import { MIN_SEARCH_LENGTH, searchCacheKey, searchCoins } from '../api/search';
import { readCache, writeCache } from '../lib/cache';
import { Coin } from '../types/coin';

interface UseCoinSearchResult {
  /** True once the query is long enough that search replaces the browse list. */
  active: boolean;
  results: Coin[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Runs a keyword search for an already-debounced, already-trimmed query.
 *
 * @param query debounced query; anything shorter than MIN_SEARCH_LENGTH is a no-op
 */
export function useCoinSearch(query: string): UseCoinSearchResult {
  const active = query.length >= MIN_SEARCH_LENGTH;

  const [results, setResults] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  /**
   * The query the UI is currently interested in. A slower earlier request must
   * not overwrite the results of a later one, so every response checks this
   * before touching state.
   */
  const latestQuery = useRef(query);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  const run = useCallback(async (target: string) => {
    latestQuery.current = target;

    if (target.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const cacheKey = searchCacheKey(target);
    const cached = readCache<Coin[]>(cacheKey);

    if (cached) {
      setResults(cached);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const found = await searchCoins(target);

      // A newer query has since been requested; discard this response.
      if (!mounted.current || latestQuery.current !== target) {
        return;
      }

      writeCache(cacheKey, found);
      setResults(found);
      setError(null);
    } catch (caught) {
      if (!mounted.current || latestQuery.current !== target) {
        return;
      }

      setResults([]);
      setError(toErrorMessage(caught));
    } finally {
      if (mounted.current && latestQuery.current === target) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void run(query);
  }, [query, run]);

  const retry = useCallback(() => {
    void run(query);
  }, [query, run]);

  return { active, results, loading, error, retry };
}
