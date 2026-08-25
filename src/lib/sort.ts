import { Coin, SortDirection, SortField } from '../types/coin';

/**
 * Case- and whitespace-insensitive match on either the coin's name or its
 * ticker, so "bnb" finds Binance Coin and "bitcoin" finds both Bitcoin and
 * Wrapped Bitcoin.
 */
export function filterCoins(coins: Coin[], query: string): Coin[] {
  const needle = query.trim().toLowerCase();

  if (needle === '') {
    return coins;
  }

  return coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(needle) || coin.symbol.toLowerCase().includes(needle)
  );
}

/**
 * Compare two possibly-null numbers, always sinking nulls to the bottom.
 *
 * Nulls are "no data", not "zero", so they should never win either end of the
 * list — a coin with an unknown 24h change is not the day's biggest loser.
 */
function compareNullable(a: number | null, b: number | null, direction: SortDirection): number {
  if (a === null && b === null) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }

  return direction === 'asc' ? a - b : b - a;
}

function valueOf(coin: Coin, field: SortField): number | null {
  switch (field) {
    case 'price':
      return coin.currentPrice;
    case 'change':
      return coin.priceChange24h;
    case 'market_cap':
    default:
      return coin.marketCap;
  }
}

/** Returns a new array; never mutates the input. */
export function sortCoins(coins: Coin[], field: SortField, direction: SortDirection): Coin[] {
  return [...coins].sort((a, b) =>
    compareNullable(valueOf(a, field), valueOf(b, field), direction)
  );
}
