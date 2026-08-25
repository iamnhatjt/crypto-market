import axios, { AxiosError, AxiosRequestConfig, AxiosInstance } from 'axios';

export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;

/** Per-request retry bookkeeping, carried on the config axios hands back to us. */
interface RetryableConfig extends AxiosRequestConfig {
  retryCount?: number;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: COINGECKO_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

/**
 * Retry only what is worth retrying: a dropped connection, a timeout, a
 * rate-limit, or a server-side fault. A 400 or 404 means our request was wrong,
 * so hammering the API would only burn the rate limit.
 */
function isRetryable(error: AxiosError): boolean {
  if (axios.isCancel(error)) {
    return false;
  }

  const status = error.response?.status;

  if (status === undefined) {
    // No response at all: network failure or timeout.
    return true;
  }

  return status === 429 || status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetryableConfig | undefined;

  if (!config || !isRetryable(error)) {
    throw error;
  }

  const attempt = (config.retryCount ?? 0) + 1;

  if (attempt > MAX_RETRIES) {
    throw error;
  }

  config.retryCount = attempt;

  // Exponential backoff: 300ms, then 600ms.
  await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));

  return apiClient(config);
});

/** Turn an axios failure into something worth showing a human. */
export function toErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 429) {
      return 'CoinGecko is rate-limiting this request. Please wait a moment and try again.';
    }

    if (status !== undefined && status >= 500) {
      return `CoinGecko returned a server error (${status}). Please try again.`;
    }

    if (status !== undefined) {
      return `The request failed with status ${status}.`;
    }

    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Check your connection and try again.';
    }

    return 'Could not reach CoinGecko. Check your connection and try again.';
  }

  return 'Something went wrong while loading market data.';
}
