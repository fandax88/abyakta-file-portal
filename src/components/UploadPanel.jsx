import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  FileUp,
  Ban,
  Trash2,
} from 'lucide-react';
import { formatBytes, formatEta } from '../utils/fileHelpers.js';

export default function UploadPanel({
  uploads,
  onSelectFiles,
  onCancelUpload,
  onClearFinishedUploads,
  currentFolderName,
  isDemoMode,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    if (droppedFiles.length > 0) {
      onSelectFiles(droppedFiles);
    }
  };

  const handleFileChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length > 0) {
      onSelectFiles(chosen);
    }
    e.target.value = '';
  };

  const hasFinished = uploads.some(
    (u) => u.status === 'done' || u.status === 'error' || u.status === 'canceled'
  );

  return (
    <section
      aria-label="Panel unggah berkas ke Google Drive"
      className="surface-card rounded-2xl p-4 sm:p-5"
    >
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
            Direct Resumable Upload ke Google Drive API v3
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Streaming langsung dari browser ke server Google Drive (bebas limit body 100 MB Cloudflare Workers) menuju{' '}
            <span className="font-mono font-medium text-[var(--text-primary)]">/{currentFolderName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Keyboard & Single-Pointer Alternative to Drag-and-Drop (WCAG 2.2 dragging-alternative) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-lab-600 px-3 text-xs font-semibold text-white transition hover:bg-lab-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
          >
            <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Pilih Berkas</span>
          </button>

          {hasFinished && (
            <button
              type="button"
              onClick={onClearFinishedUploads}
              className="inline-flex h-8 items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Bersihkan Selesai</span>
            </button>
          )}
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Area unggah berkas: klik atau seret berkas ke sini"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 ${
          isDragging
            ? 'border-lab-500 bg-lab-500/10'
            : 'border-[var(--border-strong)] bg-[var(--bg-elevated)]/45 hover:border-lab-500/60 hover:bg-[var(--bg-elevated)]/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl border border-lab-500/25 bg-lab-500/10 text-lab-600 dark:text-lab-400">
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Seret &amp; lepas berkas ke area ini, atau{' '}
          <span className="text-lab-600 underline dark:text-lab-400">jelajahi komputer</span>
        </p>
        <p className="mt-1 font-mono text-[11px] text-[var(--text-secondary)]">
          Mendukung multi-file: ISO, EXE/MSI, ZIP/7Z, PDF, maupun skrip praktikum berukuran multi-GB
          {isDemoMode ? ' • [Simulasi Mode Demo]' : ''}
        </p>
      </div>

      {/* Daftar Antrean & Progress Bar Upload */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2.5" aria-live="polite">
          {uploads.map((item) => (
            <div
              key={item.uid}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/55 p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileUp className="h-4 w-4 shrink-0 text-lab-500" aria-hidden="true" />
                  <span className="truncate text-xs font-semibold text-[var(--text-primary)] sm:text-sm">
                    {item.name}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[var(--text-primary)] tabular-nums">
                    {item.status === 'done'
                      ? '100%'
                      : item.status === 'init'
                        ? 'Inisiasi…'
                        : `${item.percent}%`}
                  </span>

                  {(item.status === 'uploading' || item.status === 'init') && (
                    <button
                      type="button"
                      onClick={() => onCancelUpload(item.uid)}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 text-[11px] font-medium text-[var(--text-secondary)] transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Batalkan unggahan ini"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                      <span>Batal</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div
                className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]"
                role="progressbar"
                aria-valuenow={item.percent || 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progres unggah ${item.name}`}
              >
                <div
                  className={`h-full transition-all duration-200 ${
                    item.status === 'done'
                      ? 'bg-emerald-500'
                      : item.status === 'error'
                        ? 'bg-rose-500'
                        : item.status === 'canceled'
                          ? 'bg-slate-400'
                          : 'bg-lab-500'
                  }`}
                  style={{ width: `${Math.max(item.percent || 0, item.status === 'init' ? 5 : 0)}%` }}
                />
              </div>

              {/* Detail Kecepatan / Status */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
                <span>
                  {formatBytes(item.loaded)} / {formatBytes(item.total)}
                </span>

                {item.status === 'uploading' && (
                  <span>
                    {formatBytes(item.speedBps)}/s • Sisa {formatEta(item.etaSeconds)}
                  </span>
                )}

                {item.status === 'init' && (
                  <span>Menyiapkan sesi Resumable Upload Google Drive…</span>
                )}

                {item.status === 'done' && (
                  <span className="inline-flex items-center gap-1 font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Tersimpan di Google Drive</span>
                  </span>
                )}

                {item.status === 'canceled' && (
                  <span className="inline-flex items-center gap-1 font-sans font-medium text-[var(--text-secondary)]">
                    <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Dibatalkan</span>
                  </span>
                )}

                {item.status === 'error' && (
                  <span className="inline-flex items-center gap-1 font-sans font-medium text-rose-600 dark:text-rose-400 wrap-anywhere">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{item.errorMessage || 'Unggahan gagal'}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
