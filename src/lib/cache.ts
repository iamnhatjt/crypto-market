/**
 * A tiny TTL cache backed by sessionStorage, with an in-memory tier in front.
 *
 * Why this exists: CoinGecko's free tier rate-limits aggressively, and React
 * StrictMode plus ordinary navigation would otherwise re-fetch the same list
 * repeatedly. The in-memory tier serves re-renders; sessionStorage survives a
 * page reload but is deliberately scoped to the tab, so a fresh visit still
 * gets fresh prices.
 *
 * All storage access is defensive — Safari private mode and blocked-cookie
 * settings make sessionStorage throw rather than return null.
 */
import { config } from '../config/env';

export const CACHE_TTL_MS = config.cacheTtlMs;

interface CacheEntry<T> {
  storedAt: number;
  value: T;
}

const memory = new Map<string, CacheEntry<unknown>>();

function readStorage<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as CacheEntry<T>);
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, entry: CacheEntry<T>): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage unavailable or over quota — the in-memory tier still applies.
  }
}

function isFresh(entry: CacheEntry<unknown>, ttlMs: number): boolean {
  return Date.now() - entry.storedAt < ttlMs;
}

/** Returns the cached value, or null when absent or stale. */
export function readCache<T>(key: string, ttlMs: number = CACHE_TTL_MS): T | null {
  const cached = (memory.get(key) as CacheEntry<T> | undefined) ?? readStorage<T>(key);

  if (!cached) {
    return null;
  }

  if (!isFresh(cached, ttlMs)) {
    clearCache(key);
    return null;
  }

  memory.set(key, cached);

  return cached.value;
}

export function writeCache<T>(key: string, value: T): void {
  const entry: CacheEntry<T> = { storedAt: Date.now(), value };

  memory.set(key, entry);
  writeStorage(key, entry);
}

export function clearCache(key: string): void {
  memory.delete(key);

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Nothing to do — the in-memory entry is already gone.
  }
}
