import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ChartRangeSelect from '../components/ChartRangeSelect';
import PriceChart from '../components/PriceChart';
import StatGrid, { Stat } from '../components/StatGrid';
import TrendBadge from '../components/TrendBadge';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeControl } from '../components/ThemeProvider';
import DetailSkeleton from '../components/states/DetailSkeleton';
import ErrorState from '../components/states/ErrorState';
import { DEFAULT_RANGE } from '../api/coinChart';
import { useCoinChart } from '../hooks/useCoinChart';
import { useCoinDetail } from '../hooks/useCoinDetail';
import {
  formatCompactUsd,
  formatDate,
  formatPercent,
  formatPrice,
  formatSupply,
} from '../lib/format';
import { ChartRange, CoinDetail } from '../types/coin';
import { CONTROL_BUTTON } from '../components/controlStyles';

function buildStats(detail: CoinDetail): Stat[] {
  return [
    { id: 'high-24h', label: '24h high', value: formatPrice(detail.high24h) },
    { id: 'low-24h', label: '24h low', value: formatPrice(detail.low24h) },
    { id: 'change-7d', label: '7d change', value: formatPercent(detail.priceChange7d) },
    { id: 'market-cap', label: 'Market cap', value: formatCompactUsd(detail.marketCap) },
    { id: 'volume-24h', label: 'Volume 24h', value: formatCompactUsd(detail.totalVolume) },
    {
      id: 'ath',
      label: 'All-time high',
      value: formatPrice(detail.ath),
      detail: formatDate(detail.athDate),
    },
    {
      id: 'atl',
      label: 'All-time low',
      value: formatPrice(detail.atl),
      detail: formatDate(detail.atlDate),
    },
    {
      id: 'circulating-supply',
      label: 'Circulating supply',
      value: formatSupply(detail.circulatingSupply),
    },
    { id: 'max-supply', label: 'Max supply', value: formatSupply(detail.maxSupply) },
  ];
}

function CoinDetailPage() {
  const { coinId = '' } = useParams<{ coinId: string }>();
  const { theme, toggleTheme } = useThemeControl();
  const { detail, loading, error, retry } = useCoinDetail(coinId);

  /**
   * The chart is a separate request from the stats, so a chart failure leaves
   * the figures on screen and changing range does not refetch the description.
   */
  const [range, setRange] = useState<ChartRange>(DEFAULT_RANGE);
  const chart = useCoinChart(coinId, range);

  return (
    <div
      data-testid="coin-detail-page"
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            data-testid="back-to-list"
            className={CONTROL_BUTTON}
          >
            <span aria-hidden="true">←</span> All coins
          </Link>

          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <main className="flex flex-col gap-6">
          {error !== null && <ErrorState message={error} onRetry={retry} retrying={loading} />}

          {error === null && detail === null && <DetailSkeleton />}

          {error === null && detail !== null && (
            <>
              <section className="flex flex-wrap items-center gap-4">
                {detail.image !== null && (
                  <img
                    data-testid="coin-detail-icon"
                    src={detail.image}
                    alt={`${detail.name} logo`}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-full bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-600 dark:ring-slate-500"
                  />
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1
                      data-testid="coin-detail-name"
                      className="text-2xl font-bold tracking-tight sm:text-3xl"
                    >
                      {detail.name}
                    </h1>
                    <span
                      data-testid="coin-detail-symbol"
                      className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      {detail.symbol.toUpperCase()}
                    </span>
                    {detail.marketCapRank !== null && (
                      <span
                        data-testid="coin-detail-rank"
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700/60 dark:text-slate-300"
                      >
                        Rank #{detail.marketCapRank}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline gap-3">
                    <p
                      data-testid="coin-detail-price"
                      className="text-3xl font-semibold tabular-nums"
                    >
                      {formatPrice(detail.currentPrice)}
                    </p>
                    <TrendBadge percent={detail.priceChange24h} testId="coin-detail-change" />
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Price history</h2>
                  <ChartRangeSelect
                    value={range}
                    onChange={setRange}
                    disabled={chart.loading && chart.points.length === 0}
                  />
                </div>

                {chart.error !== null && (
                  <div
                    data-testid="chart-error"
                    role="alert"
                    className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm dark:border-rose-500/30 dark:bg-rose-500/10"
                  >
                    <p className="text-rose-800 dark:text-rose-300">{chart.error}</p>
                    <button
                      type="button"
                      data-testid="chart-retry"
                      onClick={chart.retry}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    >
                      Retry chart
                    </button>
                  </div>
                )}

                {chart.error === null && chart.loading && chart.points.length === 0 && (
                  <div
                    data-testid="chart-skeleton"
                    aria-busy="true"
                    aria-label="Loading price history"
                    className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                  />
                )}

                {chart.error === null && !(chart.loading && chart.points.length === 0) && (
                  <PriceChart points={chart.points} range={range} />
                )}
              </section>

              <StatGrid stats={buildStats(detail)} />

              {detail.description !== '' && (
                <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <h2 className="text-sm font-semibold">About {detail.name}</h2>
                  {/*
                    Rendered as text, never as HTML. CoinGecko descriptions
                    commonly embed <a> tags; injecting them would be an XSS hole.
                  */}
                  <p
                    data-testid="coin-description"
                    className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                  >
                    {detail.description}
                  </p>

                  {detail.homepage !== null && (
                    <a
                      data-testid="coin-homepage"
                      href={detail.homepage}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-3 inline-block text-sm font-medium underline decoration-dotted underline-offset-2"
                    >
                      Official site
                    </a>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default CoinDetailPage;
