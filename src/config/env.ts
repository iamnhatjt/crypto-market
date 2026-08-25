/**
 * Runtime configuration, read from Create React App environment variables.
 *
 * CRA inlines `process.env.REACT_APP_*` at build time, so these must be
 * referenced statically (never `process.env[someVariable]`) and a rebuild is
 * required for a change to take effect.
 *
 * Every value has a working default, so the app runs correctly with no `.env`
 * file at all — the CoinGecko markets endpoint is public and needs no key.
 */

/** Parse a positive integer, falling back when unset, empty, or nonsense. */
function positiveIntOr(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    // A malformed value must not become `per_page=NaN` in a live request.
    return fallback;
  }

  return parsed;
}

function nonEmptyOr(raw: string | undefined, fallback: string): string {
  return raw === undefined || raw.trim() === '' ? fallback : raw.trim();
}

/** Optional — returns null rather than an empty string so callers can just null-check. */
function optional(raw: string | undefined): string | null {
  return raw === undefined || raw.trim() === '' ? null : raw.trim();
}

const DEFAULT_BASE_URL = 'https://api.coingecko.com/api/v3';
const DEFAULT_PER_PAGE = 20;
const DEFAULT_CACHE_TTL_MS = 60_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

interface AppConfig {
  /** CoinGecko API root. Point at `https://pro-api.coingecko.com/api/v3` for a Pro key. */
  baseUrl: string;
  /** Demo/Pro API key, or null to call the public endpoint unauthenticated. */
  apiKey: string | null;
  /** Header name the key is sent under — differs between Demo and Pro plans. */
  apiKeyHeader: string;
  /** How many coins to request. The brief asks for the top 20. */
  perPage: number;
  /** How long a fetched market list stays fresh. */
  cacheTtlMs: number;
  requestTimeoutMs: number;
}

export const config: AppConfig = {
  baseUrl: nonEmptyOr(process.env.REACT_APP_COINGECKO_BASE_URL, DEFAULT_BASE_URL),
  apiKey: optional(process.env.REACT_APP_COINGECKO_API_KEY),
  apiKeyHeader: nonEmptyOr(process.env.REACT_APP_COINGECKO_API_KEY_HEADER, 'x-cg-demo-api-key'),
  perPage: positiveIntOr(process.env.REACT_APP_COINS_PER_PAGE, DEFAULT_PER_PAGE),
  cacheTtlMs: positiveIntOr(process.env.REACT_APP_CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS),
  requestTimeoutMs: positiveIntOr(
    process.env.REACT_APP_REQUEST_TIMEOUT_MS,
    DEFAULT_REQUEST_TIMEOUT_MS
  ),
};
