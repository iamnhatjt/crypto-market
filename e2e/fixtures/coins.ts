/**
 * Deterministic stand-in for the CoinGecko /coins/markets response.
 *
 * Every test mocks the network with this fixture instead of calling the live
 * API, so the suite is immune to rate limits and to real price movement.
 *
 * The data is deliberately shaped to carry the edge cases the UI must survive:
 *   - `stasis-euro` has a null 24h change            -> must not render NaN
 *   - `shiba-inu` is the unique lowest price          -> price sort ascending
 *   - `bitcoin` is the unique highest price           -> price sort descending
 *   - `avalanche` is the unique largest 24h gain      -> change sort descending
 *   - `uniswap` is the unique largest 24h loss        -> change sort ascending
 *   - `bnb` is a symbol that appears in no coin name  -> search matches symbols
 *   - "Bitcoin" and "Wrapped Bitcoin" both match "bitcoin" -> multi-hit search
 */
export interface MarketCoinFixture {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number | null;
}

/** Inline SVG icon so tests never depend on remote image hosts. */
const icon = (hex: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="16" fill="#${hex}"/></svg>`
  )}`;

export const coinsFixture: MarketCoinFixture[] = [
  { id: 'bitcoin',         symbol: 'btc',   name: 'Bitcoin',         image: icon('f7931a'), current_price: 64000,      market_cap: 1260000000000, market_cap_rank: 1,  price_change_percentage_24h: 2.5 },
  { id: 'ethereum',        symbol: 'eth',   name: 'Ethereum',        image: icon('627eea'), current_price: 3400,       market_cap: 408000000000,  market_cap_rank: 2,  price_change_percentage_24h: -1.2 },
  { id: 'tether',          symbol: 'usdt',  name: 'Tether',          image: icon('26a17b'), current_price: 1,          market_cap: 112000000000,  market_cap_rank: 3,  price_change_percentage_24h: 0.01 },
  { id: 'binancecoin',     symbol: 'bnb',   name: 'Binance Coin',    image: icon('f3ba2f'), current_price: 585.4,      market_cap: 86000000000,   market_cap_rank: 4,  price_change_percentage_24h: 3.15 },
  { id: 'solana',          symbol: 'sol',   name: 'Solana',          image: icon('9945ff'), current_price: 148.22,     market_cap: 68000000000,   market_cap_rank: 5,  price_change_percentage_24h: -4.6 },
  { id: 'ripple',          symbol: 'xrp',   name: 'XRP',             image: icon('23292f'), current_price: 0.5234,     market_cap: 29000000000,   market_cap_rank: 6,  price_change_percentage_24h: 1.05 },
  { id: 'usd-coin',        symbol: 'usdc',  name: 'USD Coin',        image: icon('2775ca'), current_price: 0.9998,     market_cap: 27000000000,   market_cap_rank: 7,  price_change_percentage_24h: -0.02 },
  { id: 'cardano',         symbol: 'ada',   name: 'Cardano',         image: icon('0033ad'), current_price: 0.4512,     market_cap: 16000000000,   market_cap_rank: 8,  price_change_percentage_24h: 5 },
  { id: 'avalanche-2',     symbol: 'avax',  name: 'Avalanche',       image: icon('e84142'), current_price: 37.81,      market_cap: 14000000000,   market_cap_rank: 9,  price_change_percentage_24h: 12.75 },
  { id: 'dogecoin',        symbol: 'doge',  name: 'Dogecoin',        image: icon('c2a633'), current_price: 0.1423,     market_cap: 13000000000,   market_cap_rank: 10, price_change_percentage_24h: -2.34 },
  { id: 'tron',            symbol: 'trx',   name: 'TRON',            image: icon('ef0027'), current_price: 0.1187,     market_cap: 10400000000,   market_cap_rank: 11, price_change_percentage_24h: 0.87 },
  { id: 'chainlink',       symbol: 'link',  name: 'Chainlink',       image: icon('2a5ada'), current_price: 17.63,      market_cap: 9800000000,    market_cap_rank: 12, price_change_percentage_24h: -3.11 },
  { id: 'polkadot',        symbol: 'dot',   name: 'Polkadot',        image: icon('e6007a'), current_price: 6.94,       market_cap: 8900000000,    market_cap_rank: 13, price_change_percentage_24h: 2.02 },
  { id: 'wrapped-bitcoin', symbol: 'wbtc',  name: 'Wrapped Bitcoin', image: icon('f09242'), current_price: 63950.11,   market_cap: 8100000000,    market_cap_rank: 14, price_change_percentage_24h: 2.41 },
  { id: 'matic-network',   symbol: 'matic', name: 'Polygon',         image: icon('8247e5'), current_price: 0.7215,     market_cap: 7200000000,    market_cap_rank: 15, price_change_percentage_24h: -5.67 },
  { id: 'shiba-inu',       symbol: 'shib',  name: 'Shiba Inu',       image: icon('ffa409'), current_price: 0.00002341, market_cap: 6800000000,    market_cap_rank: 16, price_change_percentage_24h: -0.83 },
  { id: 'litecoin',        symbol: 'ltc',   name: 'Litecoin',        image: icon('bfbbbb'), current_price: 84.29,      market_cap: 6300000000,    market_cap_rank: 17, price_change_percentage_24h: 1.44 },
  { id: 'uniswap',         symbol: 'uni',   name: 'Uniswap',         image: icon('ff007a'), current_price: 9.87,       market_cap: 5900000000,    market_cap_rank: 18, price_change_percentage_24h: -8.4 },
  { id: 'cosmos',          symbol: 'atom',  name: 'Cosmos',          image: icon('2e3148'), current_price: 8.15,       market_cap: 3200000000,    market_cap_rank: 19, price_change_percentage_24h: 4.19 },
  { id: 'stasis-eurs',     symbol: 'eurs',  name: 'Stasis Euro',     image: icon('0f4c81'), current_price: 1.0842,     market_cap: 130000000,     market_cap_rank: 20, price_change_percentage_24h: null },
];

/** Coins whose name or symbol contains "bitcoin"/"wbtc" etc. — handy in assertions. */
export const EXPECTED_COIN_COUNT = coinsFixture.length;

/** Matches REACT_APP_COINS_PER_PAGE's default; a short page means "no more pages". */
export const PER_PAGE = 20;

/** Compact builder for the later pages, where only identity and order matter. */
function buildPage(
  entries: Array<[id: string, symbol: string, name: string, price: number, change: number | null]>,
  startRank: number
): MarketCoinFixture[] {
  return entries.map(([id, symbol, name, current_price, price_change_percentage_24h], index) => ({
    id,
    symbol,
    name,
    image: icon('64748b'),
    current_price,
    market_cap: 3_000_000_000 - index * 10_000_000,
    market_cap_rank: startRank + index,
    price_change_percentage_24h,
  }));
}

/** A full second page — ranks 21-40. Exactly PER_PAGE long, so more pages follow. */
const coinsPage2Fixture: MarketCoinFixture[] = buildPage(
  [
    ['ethereum-classic', 'etc', 'Ethereum Classic', 24.11, 1.2],
    ['filecoin', 'fil', 'Filecoin', 5.42, -2.1],
    ['hedera', 'hbar', 'Hedera', 0.0721, 3.4],
    ['aptos', 'apt', 'Aptos', 8.93, -1.7],
    ['near', 'near', 'NEAR Protocol', 4.16, 2.8],
    ['arbitrum', 'arb', 'Arbitrum', 0.8412, -3.9],
    ['optimism', 'op', 'Optimism', 1.7234, 4.1],
    ['injective', 'inj', 'Injective', 19.86, -0.6],
    ['stacks', 'stx', 'Stacks', 1.4123, 5.2],
    ['maker', 'mkr', 'Maker', 2412.55, -1.1],
    ['thorchain', 'rune', 'THORChain', 3.8891, 6.7],
    ['algorand', 'algo', 'Algorand', 0.1512, -2.4],
    ['fantom', 'ftm', 'Fantom', 0.5231, 1.9],
    ['flow', 'flow', 'Flow', 0.6104, -4.3],
    ['sandbox', 'sand', 'The Sandbox', 0.3211, 2.2],
    ['axie-infinity', 'axs', 'Axie Infinity', 5.7712, -1.5],
    ['tezos', 'xtz', 'Tezos', 0.7823, 0.9],
    ['theta', 'theta', 'Theta Network', 1.2044, -2.8],
    ['eos', 'eos', 'EOS', 0.4712, 1.4],
    ['chiliz', 'chz', 'Chiliz', 0.0612, -3.1],
  ],
  21
);

/** A SHORT third page — 7 coins. Fewer than PER_PAGE means this is the last page. */
const coinsPage3Fixture: MarketCoinFixture[] = buildPage(
  [
    ['neo', 'neo', 'NEO', 11.24, 0.7],
    ['iota', 'iota', 'IOTA', 0.1823, -1.9],
    ['kava', 'kava', 'Kava', 0.4231, 2.6],
    ['zilliqa', 'zil', 'Zilliqa', 0.0142, -0.4],
    ['ravencoin', 'rvn', 'Ravencoin', 0.0181, 1.1],
    ['ontology', 'ont', 'Ontology', 0.2011, -2.2],
    ['digibyte', 'dgb', 'DigiByte', 0.0074, 0.3],
  ],
  41
);

/** Page number -> the coins that page serves. */
export const pagedFixtures: Record<number, MarketCoinFixture[]> = {
  1: coinsFixture,
  2: coinsPage2Fixture,
  3: coinsPage3Fixture,
};

/**
 * A payload whose order does NOT match its own market_cap values.
 *
 * When sorting by market cap the app must render exactly what the API returned,
 * because CoinGecko owns that ordering and it spans the whole market — a local
 * re-sort would only reshuffle the current page and could disagree. Serving a
 * deliberately "wrong-looking" order is what makes that assertable: a local
 * sort would move `cardano` away from the front.
 */
export const coinsServerOrderedFixture: MarketCoinFixture[] = [
  coinsFixture[7], // cardano  — rank 8, deliberately first
  coinsFixture[0], // bitcoin  — rank 1
  coinsFixture[15], // shiba-inu — rank 16
  ...coinsFixture.filter((_, index) => ![7, 0, 15].includes(index)),
];

/**
 * Synthesise `count` coins starting at a given rank.
 *
 * Page-size tests need payloads of arbitrary length (10, 50, 100...), which a
 * hand-written fixture cannot provide. Values are derived from the rank so every
 * assertion stays deterministic.
 */
export function makeCoins(startRank: number, count: number): MarketCoinFixture[] {
  return Array.from({ length: count }, (_, index) => {
    const rank = startRank + index;

    return {
      id: `synthetic-${rank}`,
      symbol: `s${rank}`,
      name: `Synthetic ${rank}`,
      image: icon('64748b'),
      current_price: Number((1000 / rank).toFixed(4)),
      market_cap: 1_000_000_000_000 - rank * 1_000_000,
      market_cap_rank: rank,
      price_change_percentage_24h: rank % 3 === 0 ? null : Number(((rank % 7) - 3).toFixed(2)),
    };
  });
}
