import { Trend } from '../types/coin';

/**
 * Prices at or above a dollar: cents are the last digit anyone reads.
 *
 * /coins/markets returns pre-rounded prices, but chart series carry unrounded
 * floats — without this, a $2,524.34151352 high reached the screen.
 */
const dollarFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Prices below a dollar, where cents alone would collapse the value: SHIB has
 * to render as $0.00002341, not $0.00.
 */
const subDollarFormatter = new Intl.NumberFormat('en-US', {
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

  // Precision follows magnitude: eight decimals is right for a fraction of a
  // cent and meaningless on a four-figure price.
  return Math.abs(price) >= 1 ? dollarFormatter.format(price) : subDollarFormatter.format(price);
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

/** Whole-number counts with thousands separators: supplies, holder counts. */
export function formatSupply(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return PLACEHOLDER;
  }

  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

/**
 * Date only — the time of an all-time high years ago is noise, and omitting it
 * keeps the stat tile to one line.
 */
export function formatDate(iso: string | null | undefined): string {
  if (iso === null || iso === undefined || iso.trim() === '') {
    return PLACEHOLDER;
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return PLACEHOLDER;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}
