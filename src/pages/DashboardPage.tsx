import React, { useCallback, useMemo, useState } from 'react';
import CoinGrid from '../components/CoinGrid';
import Pagination from '../components/Pagination';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeControl } from '../components/ThemeProvider';
import SearchBar from '../components/SearchBar';
import SortControls from '../components/SortControls';
import EmptyState from '../components/states/EmptyState';
import ErrorState from '../components/states/ErrorState';
import SkeletonGrid from '../components/states/SkeletonGrid';
import { FIRST_PAGE } from '../api/coins';
import { config } from '../config/env';
import { useCoins } from '../hooks/useCoins';
import { useCoinSearch } from '../hooks/useCoinSearch';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { MarketsOrder, SortDirection, SortField } from '../types/coin';

/** Long enough to skip intermediate keystrokes, short enough to feel immediate. */
const SEARCH_DEBOUNCE_MS = 400;

function DashboardPage() {
  const { theme, toggleTheme } = useThemeControl();


  const [page, setPage] = useState(FIRST_PAGE);
  /**
   * The ordering actually sent to CoinGecko. Only market cap can be ordered
   * server-side, so this changes when the user sorts by market cap and is left
   * alone otherwise — switching to a client-side field should not refetch.
   */
  const [sortField, setSortField] = useState<SortField>('market_cap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  /**
   * Every offered sort is one the API performs, so the ordering sent to
   * CoinGecko is simply the current field and direction. No local sorting
   * remains, in browse mode or in search results.
   */
  const apiOrder: MarketsOrder = `${sortField}_${sortDirection}`;
  /** How many coins to request per page. Part of the request, not a local slice. */
  const [pageSize, setPageSize] = useState(config.perPage);
  const { coins, loading, error, hasNextPage, retry, refresh } = useCoins(
    page,
    apiOrder,
    pageSize
  );

  const [query, setQuery] = useState('');
  /**
   * Search costs two network requests, so the query is debounced. Filtering a
   * loaded list needed no debounce; issuing requests does.
   */
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const search = useCoinSearch(debouncedQuery, apiOrder);

  // Search replaces the browse listing rather than filtering it: results are one
  // relevance-ranked set from the whole market, not a slice of a page.
  const searchMode = search.active;
  const activeCoins = searchMode ? search.results : coins;
  const activeLoading = searchMode ? search.loading : loading;
  const activeError = searchMode ? search.error : error;
  const activeRetry = searchMode ? search.retry : retry;



  // Exactly one of these is true at a time; order encodes the priority.
  const showError = activeError !== null;
  const showSkeleton = !showError && activeLoading && activeCoins.length === 0;
  const showEmpty = !showError && !showSkeleton && activeCoins.length === 0;
  const showGrid = !showError && !showSkeleton && activeCoins.length > 0;

  // The search box must stay usable even when the current view failed, so the
  // user can type their way out of an error.
  const controlsDisabled = showSkeleton || showError;

  /**
   * Derived from the fetched page, not from `page * perPage` — CoinGecko owns
   * rank, and arithmetic would misreport a short final page. Uses the unfiltered
   * list so searching does not appear to change your position in the market.
   */
  const rankRange = useMemo(() => {
    const ranks = activeCoins
      .map((coin) => coin.marketCapRank)
      .filter((rank): rank is number => typeof rank === 'number' && Number.isFinite(rank));

    return ranks.length === 0
      ? null
      : { first: Math.min(...ranks), last: Math.max(...ranks) };
  }, [activeCoins]);

  const goToPage = useCallback((next: number) => {
    if (next < FIRST_PAGE) {
      return;
    }

    setPage(next);
    // A new page is new content, so start reading it from the top.
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);


  /** A new global ordering makes the current page number meaningless. */
  const resetToFirstPage = useCallback(() => {
    setPage(FIRST_PAGE);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleSortFieldChange = useCallback(
    (field: SortField) => {
      setSortField(field);
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

  /** A different page size means page N points at different coins. */
  const handlePageSizeChange = useCallback(
    (size: number) => {
      if (size === pageSize) {
        return;
      }

      setPageSize(size);
      setPage(FIRST_PAGE);
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    [pageSize]
  );

  const handleSortDirectionChange = useCallback(
    (direction: SortDirection) => {
      setSortDirection(direction);
      resetToFirstPage();
    },
    [resetToFirstPage]
  );

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
                {page === FIRST_PAGE
                  ? `Top ${pageSize} cryptocurrencies by market capitalisation, priced in USD.`
                  : 'Cryptocurrencies by market capitalisation, priced in USD.'}
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
              searching={searchMode && activeLoading}
              resultCount={activeCoins.length}
            />
            <SortControls
              field={sortField}
              direction={sortDirection}
              onFieldChange={handleSortFieldChange}
              onDirectionChange={handleSortDirectionChange}
              disabled={controlsDisabled}
            />
          </div>
        </header>

        <main>
          {showError && (
            <ErrorState message={activeError} onRetry={activeRetry} retrying={activeLoading} />
          )}
          {showSkeleton && <SkeletonGrid />}
          {showEmpty && (
            <EmptyState
              query={debouncedQuery}
              page={page}
              context={searchMode ? 'search' : 'page'}
              onClear={() => setQuery('')}
            />
          )}
          {showGrid && <CoinGrid coins={activeCoins} />}
        </main>

        {/* Search results are one set, not a page of the market. */}
        {!showError && !searchMode && (
          <Pagination
            page={page}
            hasNextPage={hasNextPage}
            rankRange={rankRange}
            coinCount={activeCoins.length}
            pageSize={pageSize}
            disabled={loading}
            onPageChange={goToPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

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

export default DashboardPage;
