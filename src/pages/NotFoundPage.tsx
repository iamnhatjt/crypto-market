import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeControl } from '../components/ThemeProvider';

function NotFoundPage() {
  const { theme, toggleTheme } = useThemeControl();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <div
          data-testid="not-found"
          className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800"
        >
          <span aria-hidden="true" className="text-3xl">
            🧭
          </span>

          <div className="space-y-1">
            <h1 className="text-base font-semibold">Page not found</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              That address does not match anything in this dashboard.
            </p>
          </div>

          <Link
            to="/"
            data-testid="back-to-list"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Back to the market list
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
