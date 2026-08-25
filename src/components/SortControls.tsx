import React from 'react';
import { SortDirection, SortField, SortScope } from '../types/coin';

interface SortControlsProps {
  field: SortField;
  direction: SortDirection;
  /**
   * Whether the API resolves this sort ('market') or it is applied locally to
   * the loaded page ('page'). CoinGecko cannot order by price or 24h change, so
   * those are page-scoped and the difference is shown rather than hidden.
   */
  scope: SortScope;
  onFieldChange: (field: SortField) => void;
  onDirectionChange: (direction: SortDirection) => void;
  disabled?: boolean;
}

const FIELD_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: 'market_cap', label: 'Market cap' },
  { value: 'price', label: 'Price' },
  { value: 'change', label: '24h change' },
];

const DIRECTION_OPTIONS: Array<{ value: SortDirection; label: string; hint: string }> = [
  { value: 'desc', label: 'High → low', hint: 'Sort descending' },
  { value: 'asc', label: 'Low → high', hint: 'Sort ascending' },
];

function SortControls({
  field,
  direction,
  scope,
  onFieldChange,
  onDirectionChange,
  disabled = false,
}: SortControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="sort-field" className="sr-only">
        Sort by
      </label>

      <select
        id="sort-field"
        data-testid="sort-field"
        value={field}
        disabled={disabled}
        onChange={(event) => onFieldChange(event.target.value as SortField)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:focus:ring-slate-100/10"
      >
        {FIELD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div
        role="group"
        aria-label="Sort direction"
        className="inline-flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600"
      >
        {DIRECTION_OPTIONS.map((option) => {
          const active = direction === option.value;

          return (
            <button
              key={option.value}
              type="button"
              data-testid={`sort-direction-${option.value}`}
              aria-pressed={active}
              title={option.hint}
              disabled={disabled}
              onClick={() => onDirectionChange(option.value)}
              className={`px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <p
        data-testid="sort-scope"
        title={
          scope === 'market'
            ? 'CoinGecko orders this server-side across every coin it tracks.'
            : 'CoinGecko cannot order by this field, so it is sorted on the coins currently loaded.'
        }
        className="text-xs text-slate-500 dark:text-slate-400"
      >
        {scope === 'market' ? 'across the whole market' : 'within this page only'}
      </p>
    </div>
  );
}

export default SortControls;
