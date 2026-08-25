import React from "react";
import { Link } from "react-router-dom";
import TrendBadge from "./TrendBadge";
import { Coin } from "../types/coin";
import { formatCompactUsd, formatPrice } from "../lib/format";

interface CoinCardProps {
  coin: Coin;
}

function CoinCard({ coin }: CoinCardProps) {
  return (
    <Link
      to={`/coins/${coin.id}`}
      data-testid="coin-card-link"
      aria-label={`${coin.name} details`}
      className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-slate-100/20"
    >
      <article
        data-testid="coin-card"
        data-coin-id={coin.id}
        className="flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
      >
        <header className="flex min-w-0 items-center gap-3">
          <img
            data-testid="coin-icon"
            src={coin.image}
            alt={`${coin.name} logo`}
            width={32}
            height={32}
            loading="lazy"
            // Neutral backdrop so white-on-transparent logos (XRP, WhiteBIT) stay
            // visible in both themes.
            className="h-8 w-8 shrink-0 rounded-full bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-600 dark:ring-slate-500"
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

          {/* Coins at the bottom of the market have no rank; render nothing
            rather than a dangling "#". */}
          {coin.marketCapRank !== null && (
            <span
              data-testid="coin-rank"
              title={`Market cap rank ${coin.marketCapRank}`}
              className="ml-auto shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700/60 dark:text-slate-300"
            >
              #{coin.marketCapRank}
            </span>
          )}
        </header>

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p
            data-testid="coin-price"
            className="break-all text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-50"
          >
            {formatPrice(coin.currentPrice)}
          </p>

          <TrendBadge percent={coin.priceChange24h} testId="coin-change" showGlyph />
        </div>

        <footer className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <span>Market cap {formatCompactUsd(coin.marketCap)}</span>
          {/* Shown because volume is sortable; sorting by an invisible value is
            not something a user can reason about. */}
          <span data-testid="coin-volume">
            Vol 24h {formatCompactUsd(coin.totalVolume)}
          </span>
        </footer>
      </article>
    </Link>
  );
}

export default React.memo(CoinCard);
