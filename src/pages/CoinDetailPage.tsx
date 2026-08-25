import React from 'react';
import { Link, useParams } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeControl } from '../components/ThemeProvider';

function CoinDetailPage() {
  const { coinId = '' } = useParams<{ coinId: string }>();
  const { theme, toggleTheme } = useThemeControl();

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
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <span aria-hidden="true">←</span> All coins
          </Link>

          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>

        <main>
          <h1 data-testid="coin-detail-id" className="text-2xl font-bold tracking-tight">
            {coinId}
          </h1>
        </main>
      </div>
    </div>
  );
}

export default CoinDetailPage;
