import { useEffect, useState } from 'react';

/**
 * Delay propagating a value until it stops changing.
 *
 * Used for the search box: filtering a loaded list needed no debounce, but
 * searching now costs two network requests, so a request per keystroke would
 * hammer a rate-limited API and show the user results they have already typed
 * past.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
