import React, { useMemo } from 'react';
import {
  Home,
  ChevronRight,
  RefreshCw,
  CornerLeftUp,
  Database,
} from 'lucide-react';
import {
  CATEGORY_FILTERS,
  formatBytes,
  getFileVisualMeta,
} from '../utils/fileHelpers.js';

export default function Breadcrumbs({
  breadcrumbs,
  onNavigateBreadcrumb,
  onRefresh,
  isLoading,
  allItems,
  activeCategory,
  onCategoryChange,
  isDemoMode,
}) {
  const canGoUp = breadcrumbs.length > 1;
  const currentCrumb = breadcrumbs[breadcrumbs.length - 1];

  // Hitung telemetri kapasitas & distribusi tipe berkas pada direktori aktif
  const telemetry = useMemo(() => {
    const counts = {
      all: allItems.length,
      folder: 0,
      installer: 0,
      iso: 0,
      archive: 0,
      script: 0,
      doc: 0,
      other: 0,
    };

    const bytesByGroup = {
      installer: 0,
      iso: 0,
      archive: 0,
      script: 0,
      doc: 0,
      other: 0,
    };

    let totalBytes = 0;
    let fileCount = 0;

    for (const item of allItems) {
      const meta = getFileVisualMeta(item);
      counts[meta.groupKey] = (counts[meta.groupKey] || 0) + 1;

      if (!item.isFolder) {
        fileCount += 1;
        const size = Number(item.size) || 0;
        totalBytes += size;
        bytesByGroup[meta.groupKey] = (bytesByGroup[meta.groupKey] || 0) + size;
      }
    }

    const segments = [
      { key: 'iso', label: 'ISO/VM', bytes: bytesByGroup.iso, color: 'bg-violet-500' },
      { key: 'installer', label: 'Installer', bytes: bytesByGroup.installer, color: 'bg-sky-500' },
      { key: 'archive', label: 'Arsip', bytes: bytesByGroup.archive, color: 'bg-orange-500' },
      { key: 'doc', label: 'Dokumen', bytes: bytesByGroup.doc, color: 'bg-rose-500' },
      { key: 'script', label: 'Skrip', bytes: bytesByGroup.script, color: 'bg-emerald-500' },
      { key: 'other', label: 'Lainnya', bytes: bytesByGroup.other, color: 'bg-slate-400 dark:bg-slate-500' },
    ].filter((seg) => seg.bytes > 0);

    return {
      counts,
      fileCount,
      folderCount: counts.folder,
      totalBytes,
      segments,
    };
  }, [allItems]);

  return (
    <section aria-label="Ringkasan dan navigasi direktori" className="space-y-3">
      {/* Asymmetric Bento Row: Directory Header (2/3) + Telemetry Breakdown (1/3) */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Bento Tile 1: Lokasi Direktori & Breadcrumbs */}
        <div className="surface-card flex flex-col justify-between rounded-2xl p-4 sm:p-5 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Breadcrumb Trail */}
            <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1">
              {canGoUp && (
                <button
                  type="button"
                  onClick={() => onNavigateBreadcrumb(breadcrumbs.length - 2)}
                  className="mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                  title="Naik satu level direktori"
                  aria-label="Naik satu level direktori"
                >
                  <CornerLeftUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}

              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={`${crumb.id}-${idx}`}>
                    {idx > 0 && (
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]/60"
                        aria-hidden="true"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => !isLast && onNavigateBreadcrumb(idx)}
                      disabled={isLast}
                      aria-current={isLast ? 'page' : undefined}
                      className={`inline-flex max-w-[200px] items-center gap-1.5 truncate rounded-lg px-2 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 ${
                        isLast
                          ? 'cursor-default bg-lab-500/10 font-semibold text-lab-700 dark:bg-lab-400/15 dark:text-lab-300'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {idx === 0 && <Home className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                      <span className="truncate">{crumb.name}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 px-3 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
              title="Sinkronkan ulang daftar berkas"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-lab-500' : ''}`}
                aria-hidden="true"
              />
              <span>Sinkronkan</span>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl wrap-anywhere">
                  {currentCrumb?.name || 'Root Repository'}
                </h2>
                {isDemoMode && (
                  <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Mode Simulasi
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Unduh langsung perangkat lunak praktikum, image sistem operasi, atau salin tautan distribusi langsung.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Tile 2: Telemetri Kapasitas & Komposisi Direktori */}
        <div className="surface-card flex flex-col justify-between rounded-2xl p-4 sm:p-5 lg:col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Volume Direktori Aktif
              </p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums">
                {telemetry.totalBytes > 0 ? formatBytes(telemetry.totalBytes) : '0 B'}
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-lab-600 dark:text-lab-400">
              <Database className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-3">
            {/* Segmented Proportion Bar */}
            <div
              className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]"
              role="img"
              aria-label={`Komposisi direktori: ${telemetry.folderCount} folder dan ${telemetry.fileCount} berkas`}
            >
              {telemetry.segments.length > 0 ? (
                telemetry.segments.map((seg) => {
                  const pct = Math.max((seg.bytes / telemetry.totalBytes) * 100, 3);
                  return (
                    <div
                      key={seg.key}
                      className={`${seg.color} h-full border-r border-[var(--bg-surface)] last:border-r-0 transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                      title={`${seg.label}: ${formatBytes(seg.bytes)}`}
                    />
                  );
                })
              ) : (
                <div className="h-full w-full bg-[var(--border-subtle)]/50" />
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
              <span>
                {telemetry.folderCount} folder • {telemetry.fileCount} berkas
              </span>
              {telemetry.segments.length > 0 && (
                <div className="flex items-center gap-2.5">
                  {telemetry.segments.slice(0, 2).map((seg) => (
                    <span key={seg.key} className="inline-flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${seg.color}`} aria-hidden="true" />
                      <span>{seg.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Chips (ui-ux-pro-max: chip-collection-reflow + color-not-only) */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Filter berdasarkan kategori berkas"
      >
        {CATEGORY_FILTERS.map((cat) => {
          const count = telemetry.counts[cat.key] || 0;
          const isActive = activeCategory === cat.key;
          const Icon = cat.Icon;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onCategoryChange(cat.key)}
              aria-pressed={isActive}
              className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 ${
                isActive
                  ? 'border-lab-600 bg-lab-600 text-white shadow-sm dark:border-lab-500 dark:bg-lab-600'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{cat.label}</span>
              <span
                className={`ml-0.5 rounded-md px-1.5 py-0.2 font-mono text-[10px] font-semibold tabular-nums ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
