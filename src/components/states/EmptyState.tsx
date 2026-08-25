import React from 'react';

interface EmptyStateProps {
  /** The active search query; empty when the API itself returned no coins. */
  query: string;
  onClear: () => void;
}

function EmptyState({ query, onClear }: EmptyStateProps) {
  const searching = query.trim() !== '';

  return (
    <div
      data-testid="empty-state"
      className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800"
    >
      <span aria-hidden="true" className="text-3xl">
        ⌕
      </span>

      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          {searching ? 'No coins found' : 'No market data available'}
        </h2>
        <p className="break-words text-sm text-slate-500 dark:text-slate-400">
          {searching
            ? `Nothing in the top 20 matches “${query}”. Try a different name or symbol.`
            : 'CoinGecko returned an empty list. Try refreshing in a moment.'}
        </p>
      </div>

      {searching && (
        <button
          type="button"
          data-testid="clear-search-button"
          onClick={onClear}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Clear search
        </button>
      )}
    </div>
  );
}

export default EmptyState;
