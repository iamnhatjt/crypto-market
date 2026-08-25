import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  resultCount: number;
}

/**
 * Filtering happens synchronously over 20 in-memory coins, so there is no
 * debounce — it would only add latency between keystroke and result.
 */
function SearchBar({ value, onChange, disabled = false, resultCount }: SearchBarProps) {
  return (
    <div className="relative flex-1">
      <label htmlFor="coin-search" className="sr-only">
        Search coins by name or symbol
      </label>

      <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        ⌕
      </span>

      <input
        id="coin-search"
        data-testid="search-input"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Search by name or symbol…"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:ring-slate-100/10"
      />

      {/* Announces result counts to screen readers as the query changes. */}
      <p aria-live="polite" className="sr-only">
        {resultCount} coin{resultCount === 1 ? '' : 's'} match your search.
      </p>
    </div>
  );
}

export default SearchBar;
