import React, { useMemo, useState } from 'react';
import {
  Download,
  Link2,
  Check,
  Trash2,
  FolderOpen,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  SearchX,
  Info,
  RotateCcw,
} from 'lucide-react';
import {
  formatBytes,
  formatModifiedDate,
  getFileVisualMeta,
} from '../utils/fileHelpers.js';

export default function FileBrowser({
  items,
  viewMode,
  isLoading,
  hasActiveFilters,
  searchQuery,
  isEditor,
  onOpenFolder,
  onInspectFile,
  onCopyLink,
  onRequestDelete,
  onResetFilters,
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'size' | 'modifiedTime'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir(column === 'name' ? 'asc' : 'desc');
    }
  };

  const handleCopyClick = async (e, item) => {
    e.stopPropagation();
    const ok = await onCopyLink(item);
    if (ok) {
      setCopiedId(item.id);
      setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current));
      }, 2000);
    }
  };

  const sortedItems = useMemo(() => {
    const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });
    const factor = sortDir === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      if (sortBy === 'size') {
        const sizeA = a.size ?? -1;
        const sizeB = b.size ?? -1;
        if (sizeA !== sizeB) return (sizeA - sizeB) * factor;
      } else if (sortBy === 'modifiedTime') {
        const timeA = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
        const timeB = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
        if (timeA !== timeB) return (timeA - timeB) * factor;
      }
      return collator.compare(a.name, b.name) * factor;
    });
  }, [items, sortBy, sortDir]);

  const renderSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-55" aria-hidden="true" />;
    }
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-lab-600 dark:text-lab-400" aria-hidden="true" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-lab-600 dark:text-lab-400" aria-hidden="true" />
    );
  };

  // Progressive Shimmer Skeleton (ui-ux-pro-max §3 progressive-loading)
  if (isLoading) {
    return (
      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="divide-y divide-[var(--border-subtle)]">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 px-5 py-4 animate-pulse">
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-[var(--bg-elevated)]" />
                <div className="max-w-md flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 rounded-md bg-[var(--bg-elevated)]" />
                  <div className="h-2.5 w-1/3 rounded-md bg-[var(--bg-elevated)]/70" />
                </div>
              </div>
              <div className="hidden h-3.5 w-20 rounded-md bg-[var(--bg-elevated)] sm:block" />
              <div className="h-8 w-28 rounded-xl bg-[var(--bg-elevated)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty State / No Search Results dengan Recovery Action (ui-ux-pro-max Search > No Results)
  if (sortedItems.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
        <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
          {hasActiveFilters ? (
            <SearchX className="h-6 w-6" aria-hidden="true" />
          ) : (
            <FolderOpen className="h-6 w-6" aria-hidden="true" />
          )}
        </div>
        <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
          {hasActiveFilters ? 'Tidak ditemukan berkas yang cocok' : 'Direktori ini masih kosong'}
        </h3>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[var(--text-secondary)]">
          {hasActiveFilters
            ? searchQuery
              ? `Tidak ada item dengan kata kunci "${searchQuery}" pada filter kategori yang dipilih.`
              : 'Tidak ada berkas untuk kategori tersebut di dalam folder ini.'
            : isEditor
              ? 'Seret berkas langsung ke layar ini atau gunakan tombol "Upload File Besar" di atas untuk mulai mengisi repositori.'
              : 'Belum ada perangkat lunak atau modul praktikum yang dipublikasikan pada direktori ini.'}
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 text-xs font-semibold text-[var(--text-primary)] transition hover:border-lab-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tampilkan Semua Item</span>
          </button>
        )}
      </div>
    );
  }

  /* ========================================================================
   * MODE GRID VIEW (BENTO SOFTWARE CARDS)
   * ======================================================================== */
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedItems.map((item, index) => {
          const { Icon, badge, category, iconBg, badgeClass, accentRing } = getFileVisualMeta(item);
          const isCopied = copiedId === item.id;

          return (
            <article
              key={item.id}
              style={{ animationDelay: `${Math.min(index * 25, 200)}ms` }}
              onClick={(e) => {
                if (item.isFolder) {
                  onOpenFolder(item);
                } else {
                  onInspectFile(item, e.currentTarget);
                }
              }}
              className={`surface-card animate-item-enter group relative flex cursor-pointer flex-col justify-between rounded-2xl p-4 transition duration-150 hover:shadow-hover ${accentRing}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${iconBg}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider ${badgeClass}`}
                    >
                      {badge}
                    </span>

                    {!item.isFolder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectFile(item, e.currentTarget);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                        title={`Detail & Checksum ${item.name}`}
                        aria-label={`Detail dan checksum ${item.name}`}
                      >
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}

                    {isEditor && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDelete(item, e.currentTarget);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        title={`Hapus ${item.name}`}
                        aria-label={`Hapus ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                <h3
                  className="mt-3.5 line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-lab-600 dark:group-hover:text-lab-400 wrap-anywhere"
                  title={item.name}
                >
                  {item.name}
                </h3>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">{category}</span>
                  {item.md5Checksum && (
                    <span
                      className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]"
                      title={`MD5: ${item.md5Checksum}`}
                    >
                      md5:{item.md5Checksum.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
                <div className="flex items-center justify-between font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
                  <span className="font-medium text-[var(--text-primary)]">
                    {item.isFolder ? 'Direktori' : formatBytes(item.size)}
                  </span>
                  <span>{formatModifiedDate(item.modifiedTime)}</span>
                </div>

                {item.isFolder ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFolder(item);
                    }}
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] transition hover:border-amber-500/40 hover:bg-amber-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                  >
                    <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Buka Direktori</span>
                  </button>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={item.webContentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-lab-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-lab-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Download</span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => handleCopyClick(e, item)}
                      className={`inline-flex h-9 items-center justify-center gap-1 rounded-xl border px-2.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 ${
                        isCopied
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                      title="Salin tautan unduhan langsung (Copy Direct Link)"
                      aria-label={`Salin tautan langsung ${item.name}`}
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{isCopied ? 'Tersalin' : 'Link'}</span>
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  /* ========================================================================
   * MODE LIST VIEW (TABEL REPOSITORI PRESISI)
   * ======================================================================== */
  return (
    <div className="surface-card overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              <th
                scope="col"
                aria-sort={sortBy === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="py-3.5 pl-4 pr-3 sm:pl-5"
              >
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 -ml-1 transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                >
                  <span>Nama Berkas / Direktori</span>
                  {renderSortIcon('name')}
                </button>
              </th>
              <th scope="col" className="hidden px-3 py-3.5 md:table-cell">
                Kategori
              </th>
              <th
                scope="col"
                aria-sort={sortBy === 'size' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="hidden px-3 py-3.5 sm:table-cell"
              >
                <button
                  type="button"
                  onClick={() => handleSort('size')}
                  className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 -ml-1 transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                >
                  <span>Ukuran</span>
                  {renderSortIcon('size')}
                </button>
              </th>
              <th
                scope="col"
                aria-sort={
                  sortBy === 'modifiedTime' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
                }
                className="hidden px-3 py-3.5 lg:table-cell"
              >
                <button
                  type="button"
                  onClick={() => handleSort('modifiedTime')}
                  className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 -ml-1 transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                >
                  <span>Dimodifikasi</span>
                  {renderSortIcon('modifiedTime')}
                </button>
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-4 text-right sm:pr-5">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-subtle)]">
            {sortedItems.map((item) => {
              const { Icon, badge, category, iconBg, badgeClass } = getFileVisualMeta(item);
              const isCopied = copiedId === item.id;

              return (
                <tr
                  key={item.id}
                  onClick={(e) => {
                    if (item.isFolder) {
                      onOpenFolder(item);
                    } else {
                      onInspectFile(item, e.currentTarget);
                    }
                  }}
                  className="group cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-elevated)]/65"
                >
                  {/* Kolom Nama & Ikon */}
                  <td className="py-3.5 pl-4 pr-3 sm:pl-5">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${iconBg}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm font-medium transition-colors wrap-anywhere ${
                              item.isFolder
                                ? 'font-semibold text-[var(--text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-400'
                                : 'text-[var(--text-primary)] group-hover:text-lab-600 dark:group-hover:text-lab-400'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span
                            className={`inline-block shrink-0 rounded border px-1.5 py-0.2 font-mono text-[10px] font-semibold md:hidden ${badgeClass}`}
                          >
                            {badge}
                          </span>
                        </div>

                        {/* Baris ke-2: MD5 singkat (desktop) atau ukuran+tanggal (mobile) */}
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
                          <span className="sm:hidden">
                            {item.isFolder ? 'Direktori' : formatBytes(item.size)} •{' '}
                            {formatModifiedDate(item.modifiedTime)}
                          </span>
                          {item.md5Checksum && (
                            <span className="hidden sm:inline">
                              MD5: {item.md5Checksum.slice(0, 12)}…
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Kolom Kategori */}
                  <td className="hidden whitespace-nowrap px-3 py-3.5 md:table-cell">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider ${badgeClass}`}
                      >
                        {badge}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">{category}</span>
                    </div>
                  </td>

                  {/* Kolom Ukuran */}
                  <td className="hidden whitespace-nowrap px-3 py-3.5 font-mono text-xs font-medium text-[var(--text-primary)] tabular-nums sm:table-cell">
                    {item.isFolder ? '—' : formatBytes(item.size)}
                  </td>

                  {/* Kolom Tanggal Modifikasi */}
                  <td className="hidden whitespace-nowrap px-3 py-3.5 font-mono text-xs text-[var(--text-secondary)] tabular-nums lg:table-cell">
                    {formatModifiedDate(item.modifiedTime)}
                  </td>

                  {/* Kolom Tombol Aksi */}
                  <td className="whitespace-nowrap py-3.5 pl-3 pr-4 text-right sm:pr-5">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {item.isFolder ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFolder(item);
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs font-semibold text-[var(--text-primary)] transition hover:border-amber-500/40 hover:bg-amber-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                        >
                          <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Buka</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectFile(item, e.currentTarget);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                            title="Detail berkas, Checksum MD5, & perintah CLI"
                            aria-label={`Detail berkas ${item.name}`}
                          >
                            <Info className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyClick(e, item)}
                            className={`inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 ${
                              isCopied
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                            }`}
                            title="Salin tautan unduhan langsung (Copy Direct Link)"
                            aria-label={`Salin tautan langsung ${item.name}`}
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            <span className="hidden xl:inline">
                              {isCopied ? 'Tersalin!' : 'Copy Direct Link'}
                            </span>
                          </button>

                          <a
                            href={item.webContentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-lab-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-lab-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Download</span>
                          </a>
                        </>
                      )}

                      {isEditor && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDelete(item, e.currentTarget);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          title={`Hapus ${item.name}`}
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
