import React from 'react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

function ErrorState({ message, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <div
      data-testid="error-state"
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-500/30 dark:bg-rose-500/10"
    >
      <span aria-hidden="true" className="text-3xl">
        ⚠
      </span>

      <div className="space-y-1">
        <h2 className="text-base font-semibold text-rose-900 dark:text-rose-200">
          Could not load market data
        </h2>
        <p className="text-sm text-rose-800 dark:text-rose-300">{message}</p>
      </div>

      <button
        type="button"
        data-testid="retry-button"
        onClick={onRetry}
        disabled={retrying}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {retrying ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  );
}

export default ErrorState;
