import React, { useState } from 'react';
import {
  Download,
  Link2,
  Check,
  Trash2,
  FolderOpen,
  ArrowUpDown,
  SearchX,
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
  searchQuery,
  isEditor,
  onOpenFolder,
  onCopyLink,
  onRequestDelete,
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

  // Urutkan folder selalu di atas, diikuti pengurutan kolom pilihan pengguna
  const sortedItems = React.useMemo(() => {
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

  // Skeleton saat memuat data
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 px-4 py-3.5 animate-pulse">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2 flex-1 max-w-md">
                  <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-2.5 w-1/3 rounded bg-slate-100 dark:bg-slate-800/70" />
                </div>
              </div>
              <div className="hidden sm:block h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Kondisi Kosong
  if (sortedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          {searchQuery ? <SearchX className="h-6 w-6" /> : <FolderOpen className="h-6 w-6" />}
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {searchQuery ? 'Tidak ada hasil yang cocok' : 'Folder ini masih kosong'}
        </h3>
        <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
          {searchQuery
            ? `Tidak ditemukan file atau subfolder dengan kata kunci "${searchQuery}" pada direktori ini.`
            : isEditor
              ? 'Gunakan tombol "Upload File Besar" atau "Buat Folder Baru" di atas untuk mulai mengisi repositori.'
              : 'Belum ada perangkat lunak atau modul praktikum yang diunggah pada kategori ini.'}
        </p>
      </div>
    );
  }

  /* ========================================================================
   * TAMPILAN GRID VIEW
   * ======================================================================== */
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedItems.map((item) => {
          const { Icon, badge, category, iconBg, badgeClass } = getFileVisualMeta(item);
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => item.isFolder && onOpenFolder(item)}
              className={`group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition dark:border-slate-800/90 dark:bg-slate-900/85 ${
                item.isFolder
                  ? 'cursor-pointer hover:border-lab-400 hover:shadow-md dark:hover:border-lab-500/60'
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${badgeClass}`}
                    >
                      {badge}
                    </span>
                    {isEditor && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDelete(item);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                        title={`Hapus ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3
                  className="mt-3 line-clamp-2 break-all text-sm font-semibold text-slate-900 group-hover:text-lab-600 dark:text-slate-100 dark:group-hover:text-lab-400"
                  title={item.name}
                >
                  {item.name}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{category}</p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{item.isFolder ? 'Subfolder' : formatBytes(item.size)}</span>
                  <span>{formatModifiedDate(item.modifiedTime)}</span>
                </div>

                {item.isFolder ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFolder(item);
                    }}
                    className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 transition hover:bg-lab-50 hover:text-lab-700 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Buka Folder</span>
                  </button>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={item.webContentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-lab-600 px-3 text-xs font-semibold text-white transition hover:bg-lab-700 dark:bg-lab-600 dark:hover:bg-lab-500"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => handleCopyClick(e, item)}
                      className={`inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition ${
                        isCopied
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                      title="Salin tautan unduhan langsung (Copy Direct Link)"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                      <span className="sr-only sm:not-sr-only">{isCopied ? 'Tersalin' : 'Link'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ========================================================================
   * TAMPILAN LIST VIEW (TABEL REPOSITORI TEKNIS)
   * ======================================================================== */
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-900/85">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <th className="py-3 pl-4 pr-3">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <span>Nama File / Direktori</span>
                  <ArrowUpDown className="h-3 w-3 opacity-70" />
                </button>
              </th>
              <th className="hidden px-3 py-3 md:table-cell">Tipe</th>
              <th className="hidden px-3 py-3 sm:table-cell">
                <button
                  type="button"
                  onClick={() => handleSort('size')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <span>Ukuran</span>
                  <ArrowUpDown className="h-3 w-3 opacity-70" />
                </button>
              </th>
              <th className="hidden px-3 py-3 lg:table-cell">
                <button
                  type="button"
                  onClick={() => handleSort('modifiedTime')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <span>Terakhir Dimodifikasi</span>
                  <ArrowUpDown className="h-3 w-3 opacity-70" />
                </button>
              </th>
              <th className="py-3 pl-3 pr-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {sortedItems.map((item) => {
              const { Icon, badge, category, iconBg, badgeClass } = getFileVisualMeta(item);
              const isCopied = copiedId === item.id;

              return (
                <tr
                  key={item.id}
                  onClick={() => item.isFolder && onOpenFolder(item)}
                  className={`group transition-colors ${
                    item.isFolder
                      ? 'cursor-pointer hover:bg-lab-50/60 dark:hover:bg-lab-950/25'
                      : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Kolom Nama & Ikon */}
                  <td className="py-3 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconBg}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`truncate text-sm font-medium ${
                              item.isFolder
                                ? 'font-semibold text-slate-900 group-hover:text-lab-600 dark:text-white dark:group-hover:text-lab-400'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          <span
                            className={`inline-block shrink-0 rounded border px-1.5 py-0.2 font-mono text-[10px] font-semibold md:hidden ${badgeClass}`}
                          >
                            {badge}
                          </span>
                        </div>

                        {/* Metadata ringkas khusus layar kecil */}
                        <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">
                          <span>{item.isFolder ? 'Folder' : formatBytes(item.size)}</span>
                          <span>•</span>
                          <span>{formatModifiedDate(item.modifiedTime)}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Kolom Tipe */}
                  <td className="hidden whitespace-nowrap px-3 py-3 md:table-cell">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${badgeClass}`}
                      >
                        {badge}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{category}</span>
                    </div>
                  </td>

                  {/* Kolom Ukuran */}
                  <td className="hidden whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 sm:table-cell">
                    {item.isFolder ? '—' : formatBytes(item.size)}
                  </td>

                  {/* Kolom Tanggal Modifikasi */}
                  <td className="hidden whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 lg:table-cell">
                    {formatModifiedDate(item.modifiedTime)}
                  </td>

                  {/* Kolom Tombol Aksi */}
                  <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {item.isFolder ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFolder(item);
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:border-lab-300 hover:bg-lab-50 hover:text-lab-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-lab-500/50 dark:hover:bg-slate-700"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          <span>Buka</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleCopyClick(e, item)}
                            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition ${
                              isCopied
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                            title="Copy Direct Link"
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                            <span className="hidden xl:inline">
                              {isCopied ? 'Tersalin!' : 'Copy Direct Link'}
                            </span>
                          </button>

                          <a
                            href={item.webContentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lab-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-lab-700 dark:bg-lab-600 dark:hover:bg-lab-500"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Download</span>
                          </a>
                        </>
                      )}

                      {isEditor && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDelete(item);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-rose-500/40 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          title={`Hapus ${item.name}`}
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

