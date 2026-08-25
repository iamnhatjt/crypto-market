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

/** Two decimals, so this is the precision the user actually sees. */
const PERCENT_DECIMALS = 2;

/**
 * Round to display precision.
 *
 * Everything downstream keys off this rather than the raw value, so a
 * stablecoin reported as -0.0004% is not rendered as a red "-0.00%" loss that
 * never happened.
 */
function roundedPercent(percent: number | null | undefined): number | null {
  if (percent === null || percent === undefined || !Number.isFinite(percent)) {
    return null;
  }

  const factor = 10 ** PERCENT_DECIMALS;

  return Math.round(percent * factor) / factor;
}

/** Signed when it moved: "+2.50%", "-1.20%"; bare "0.00%" when it did not. */
export function formatPercent(percent: number | null | undefined): string {
  const rounded = roundedPercent(percent);

  if (rounded === null) {
    return PLACEHOLDER;
  }

  if (rounded === 0) {
    return `${(0).toFixed(PERCENT_DECIMALS)}%`;
  }

  const sign = rounded < 0 ? '-' : '+';

  return `${sign}${Math.abs(rounded).toFixed(PERCENT_DECIMALS)}%`;
}

/** A missing change, or one too small to show at display precision, is "flat". */
export function trendOf(percent: number | null | undefined): Trend {
  const rounded = roundedPercent(percent);

  if (rounded === null || rounded === 0) {
    return 'flat';
  }

  return rounded > 0 ? 'up' : 'down';
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
