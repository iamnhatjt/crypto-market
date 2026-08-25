import PageSizeSelect from './PageSizeSelect';
import { CONTROL_BUTTON } from './controlStyles';

interface PaginationProps {
  page: number;
  hasNextPage: boolean;
  /**
   * Market-cap ranks currently on screen, taken from the data rather than
   * computed from the page number — CoinGecko is the authority on rank, and a
   * short final page would make arithmetic lie.
   */
  rankRange: { first: number; last: number } | null;
  /** Coins on the page, used as the summary when none of them carry a rank. */
  coinCount: number;
  pageSize: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function Pagination({
  page,
  hasNextPage,
  rankRange,
  coinCount,
  pageSize,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  /*
   * Ranks are the most useful summary, but coins at the bottom of the market
   * have none. An absent rank range must not be mistaken for an absent page —
   * that read "No coins on this page." above 50 rendered coins.
   */
  let summary: string;

  if (coinCount === 0) {
    summary = 'No coins on this page.';
  } else if (rankRange !== null) {
    summary = `Ranks ${rankRange.first}\u2013${rankRange.last} by market cap.`;
  } else {
    summary = `Showing ${coinCount} coins.`;
  }


  return (
    <nav
      data-testid="pagination"
      aria-label="Market pages"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-xs text-slate-500 dark:text-slate-400">{summary}</p>

      <div className="flex flex-wrap items-center gap-2">
        <PageSizeSelect value={pageSize} onChange={onPageSizeChange} disabled={disabled} />

        <button
          type="button"
          data-testid="prev-page"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className={CONTROL_BUTTON}
        >
          <span aria-hidden="true">←</span> Previous
        </button>

        {/* aria-live so screen readers hear the page change, not just sighted users. */}
        <span
          data-testid="page-indicator"
          aria-live="polite"
          className="min-w-[5.5rem] text-center text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200"
        >
          Page {page}
        </span>

        <button
          type="button"
          data-testid="next-page"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || !hasNextPage}
          className={CONTROL_BUTTON}
        >
          Next <span aria-hidden="true">→</span>
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
