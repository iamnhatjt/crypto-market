import React from 'react';
import { Coin } from '../types/coin';
import { formatCompactUsd, formatPercent, formatPrice, trendOf } from '../lib/format';

interface CoinCardProps {
  coin: Coin;
}

const TREND_STYLES: Record<string, string> = {
  up: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  down: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
  flat: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/40',
};

const TREND_GLYPH: Record<string, string> = { up: '▲', down: '▼', flat: '' };

function CoinCard({ coin }: CoinCardProps) {
  const trend = trendOf(coin.priceChange24h);

  return (
    <article
      data-testid="coin-card"
      data-coin-id={coin.id}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
    >
      <header className="flex min-w-0 items-center gap-3">
        <img
          data-testid="coin-icon"
          src={coin.image}
          alt={`${coin.name} logo`}
          width={32}
          height={32}
          loading="lazy"
          className="h-8 w-8 shrink-0 rounded-full"
        />

        <div className="min-w-0">
          <h2
            data-testid="coin-name"
            className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50"
          >
            {coin.name}
          </h2>
          <p
            data-testid="coin-symbol"
            className="truncate text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            {coin.symbol.toUpperCase()}
          </p>
        </div>

        <span className="ml-auto shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700/60 dark:text-slate-300">
          #{coin.marketCapRank}
        </span>
      </header>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p
          data-testid="coin-price"
          className="break-all text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-50"
        >
          {formatPrice(coin.currentPrice)}
        </p>

        <span
          title="Change over the last 24 hours"
          className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold tabular-nums ${TREND_STYLES[trend]}`}
        >
          {/* Decorative arrow lives outside the value so the test id reads the number alone. */}
          {TREND_GLYPH[trend] && (
            <span aria-hidden="true" className="text-[0.65rem] leading-none">
              {TREND_GLYPH[trend]}
            </span>
          )}
          <span data-testid="coin-change" data-trend={trend}>
            {formatPercent(coin.priceChange24h)}
          </span>
        </span>
      </div>

      <footer className="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Market cap {formatCompactUsd(coin.marketCap)}
      </footer>
    </article>
  );
}

export default React.memo(CoinCard);
