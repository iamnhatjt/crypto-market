import React, { useMemo, useState } from 'react';
import CoinGrid from './components/CoinGrid';
import SearchBar from './components/SearchBar';
import SortControls from './components/SortControls';
import ThemeToggle from './components/ThemeToggle';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import SkeletonGrid from './components/states/SkeletonGrid';
import { useCoins } from './hooks/useCoins';
import { useTheme } from './hooks/useTheme';
import { filterCoins, sortCoins } from './lib/sort';
import { SortDirection, SortField } from './types/coin';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { coins, loading, error, retry, refresh } = useCoins();

  const [query, setQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('market_cap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filtering and sorting are cheap over 20 coins, but memoising keeps the
  // memoised CoinCard children from re-rendering on unrelated state changes.
  const visibleCoins = useMemo(
    () => sortCoins(filterCoins(coins, query), sortField, sortDirection),
    [coins, query, sortField, sortDirection]
  );

  // Exactly one of these is true at a time; order encodes the priority.
  const showError = error !== null;
  const showSkeleton = !showError && loading && coins.length === 0;
  const showEmpty = !showError && !showSkeleton && visibleCoins.length === 0;
  const showGrid = !showError && !showSkeleton && visibleCoins.length > 0;

  const controlsDisabled = showSkeleton || showError;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Crypto Market Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Top 20 cryptocurrencies by market capitalisation, priced in USD.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                data-testid="refresh-button"
                onClick={refresh}
                disabled={loading}
                aria-label="Refresh market data"
                title="Refresh market data"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-slate-100/10"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>

              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBar
              value={query}
              onChange={setQuery}
              disabled={controlsDisabled}
              resultCount={visibleCoins.length}
            />
            <SortControls
              field={sortField}
              direction={sortDirection}
              onFieldChange={setSortField}
              onDirectionChange={setSortDirection}
              disabled={controlsDisabled}
            />
          </div>
        </header>

        <main>
          {showError && <ErrorState message={error} onRetry={retry} retrying={loading} />}
          {showSkeleton && <SkeletonGrid />}
          {showEmpty && <EmptyState query={query} onClear={() => setQuery('')} />}
          {showGrid && <CoinGrid coins={visibleCoins} />}
        </main>

        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Market data from{' '}
          <a
            href="https://www.coingecko.com/en/api"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline decoration-dotted underline-offset-2 hover:text-slate-700 dark:hover:text-slate-200"
          >
            CoinGecko
          </a>
          . Responses are cached for 60 seconds to stay within the free-tier rate limit.
        </footer>
      </div>
    </div>
  );
}

export default App;
