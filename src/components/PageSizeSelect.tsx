import { useMemo } from 'react';
import { config } from '../config/env';
import { CONTROL_SELECT } from './controlStyles';

interface PageSizeSelectProps {
  value: number;
  onChange: (size: number) => void;
  disabled?: boolean;
}

/**
 * CoinGecko caps `per_page` at 250. The offered sizes stop at 100 because
 * beyond that the payload and the number of rendered cards cost more than the
 * extra rows are worth in a scannable grid.
 */
const OFFERED_SIZES = [10, 20, 50, 100];

function PageSizeSelect({ value, onChange, disabled = false }: PageSizeSelectProps) {
  // Always include the configured default, so a custom
  // REACT_APP_COINS_PER_PAGE never leaves the select showing a value it cannot
  // offer back to the user.
  const sizes = useMemo(
    () => Array.from(new Set([...OFFERED_SIZES, config.perPage, value])).sort((a, b) => a - b),
    [value]
  );

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="page-size"
        className="whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400"
      >
        Per page
      </label>

      <select
        id="page-size"
        data-testid="page-size"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={CONTROL_SELECT}
      >
        {sizes.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PageSizeSelect;
