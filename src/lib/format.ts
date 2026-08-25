import { Trend } from '../types/coin';

/**
 * One formatter handles the full crypto price range.
 *
 * `minimumFractionDigits: 2` keeps dollar amounts looking like money
 * ($64,000.00), while `maximumFractionDigits: 8` stops sub-cent coins from
 * collapsing to $0.00 — SHIB renders as $0.00002341 rather than $0.00.
 */
const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

const PLACEHOLDER = '—';

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || !Number.isFinite(price)) {
    return PLACEHOLDER;
  }

  return priceFormatter.format(price);
}

/** Always signed, always two decimals: "+2.50%", "-1.20%", or "—" when unknown. */
export function formatPercent(percent: number | null | undefined): string {
  if (percent === null || percent === undefined || !Number.isFinite(percent)) {
    return PLACEHOLDER;
  }

  const sign = percent < 0 ? '-' : '+';

  return `${sign}${Math.abs(percent).toFixed(2)}%`;
}

/** A missing or zero change is "flat" — neither green nor red. */
export function trendOf(percent: number | null | undefined): Trend {
  if (percent === null || percent === undefined || !Number.isFinite(percent) || percent === 0) {
    return 'flat';
  }

  return percent > 0 ? 'up' : 'down';
}

export function formatCompactUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return PLACEHOLDER;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
