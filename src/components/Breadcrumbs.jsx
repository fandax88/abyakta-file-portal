import React from 'react';
import { Home, ChevronRight, RefreshCw, CornerLeftUp } from 'lucide-react';
import { formatBytes } from '../utils/fileHelpers.js';

export default function Breadcrumbs({
  breadcrumbs,
  onNavigateBreadcrumb,
  onRefresh,
  isLoading,
  stats,
  isDemoMode,
}) {
  const canGoUp = breadcrumbs.length > 1;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
      {/* Jalur Navigasi Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 overflow-x-auto py-0.5">
        {canGoUp && (
          <button
            type="button"
            onClick={() => onNavigateBreadcrumb(breadcrumbs.length - 2)}
            className="mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Naik satu folder"
          >
            <CornerLeftUp className="h-3.5 w-3.5" />
          </button>
        )}

        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${crumb.id}-${idx}`}>
              {idx > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-600" />}
              <button
                type="button"
                onClick={() => !isLast && onNavigateBreadcrumb(idx)}
                disabled={isLast}
                className={`inline-flex max-w-[220px] shrink-0 items-center gap-1.5 truncate rounded-md px-2 py-1 text-xs font-medium transition sm:text-sm ${
                  isLast
                    ? 'cursor-default bg-lab-500/10 font-semibold text-lab-700 dark:bg-lab-400/15 dark:text-lab-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                {idx === 0 && <Home className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{crumb.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Statistik Direktori & Tombol Refresh */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-2 dark:border-slate-800 sm:border-t-0 sm:pt-0">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
          {isDemoMode && (
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              DEMO DATA
            </span>
          )}
          <span>
            {stats.folderCount} folder • {stats.fileCount} file
          </span>
          {stats.totalBytes > 0 && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>{formatBytes(stats.totalBytes)}</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          title="Muat ulang daftar file"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-lab-500' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>
    </div>
  );
}

