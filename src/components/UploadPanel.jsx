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

  const hasFinished = uploads.some((u) => u.status === 'done' || u.status === 'error' || u.status === 'canceled');

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Direct Resumable Upload ke Google Drive
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            File diunggah langsung dari browser ke Google Drive API (tanpa batas 100 MB Cloudflare Workers) ke dalam{' '}
            <span className="font-mono text-slate-700 dark:text-slate-300">/{currentFolderName}</span>.
          </p>
        </div>
        {hasFinished && (
          <button
            type="button"
            onClick={onClearFinishedUploads}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Bersihkan Riwayat</span>
          </button>
        )}
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
          isDragging
            ? 'border-lab-500 bg-lab-500/10 dark:border-lab-400 dark:bg-lab-500/15'
            : 'border-slate-300 bg-slate-50/70 hover:border-lab-400 hover:bg-slate-100/70 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-lab-500/60 dark:hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-lab-500/10 text-lab-600 dark:bg-lab-400/15 dark:text-lab-400">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Seret &amp; lepas file di sini, atau <span className="text-lab-600 underline dark:text-lab-400">pilih dari komputer</span>
        </p>
        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
          Mendukung ISO, EXE, MSI, ZIP/7Z, PDF, maupun skrip berukuran besar (multi-GB)
          {isDemoMode ? ' • [Simulasi Mode Demo]' : ''}
        </p>
      </div>

      {/* Daftar Antrean & Progress Bar Upload */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {uploads.map((item) => (
            <div
              key={item.uid}
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/60"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileUp className="h-4 w-4 shrink-0 text-lab-500" />
                  <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm">
                    {item.name}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {item.status === 'done'
                      ? '100%'
                      : item.status === 'init'
                        ? 'Inisiasi...'
                        : `${item.percent}%`}
                  </span>

                  {(item.status === 'uploading' || item.status === 'init') && (
                    <button
                      type="button"
                      onClick={() => onCancelUpload(item.uid)}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-500/40 dark:hover:text-rose-300"
                      title="Batalkan upload ini"
                    >
                      <X className="h-3 w-3" />
                      <span>Batal</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
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
                  style={{ width: `${Math.max(item.percent || 0, item.status === 'init' ? 4 : 0)}%` }}
                />
              </div>

              {/* Detail Kecepatan / Status */}
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  {formatBytes(item.loaded)} / {formatBytes(item.total)}
                </span>

                {item.status === 'uploading' && (
                  <span>
                    {formatBytes(item.speedBps)}/s • ETA {formatEta(item.etaSeconds)}
                  </span>
                )}

                {item.status === 'init' && <span>Meminta Resumable Session URI dari Google Drive...</span>}

                {item.status === 'done' && (
                  <span className="inline-flex items-center gap-1 font-sans font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Berhasil diunggah
                  </span>
                )}

                {item.status === 'canceled' && (
                  <span className="inline-flex items-center gap-1 font-sans font-medium text-slate-500">
                    <Ban className="h-3.5 w-3.5" />
                    Dibatalkan
                  </span>
                )}

                {item.status === 'error' && (
                  <span className="inline-flex items-center gap-1 font-sans font-medium text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {item.errorMessage || 'Upload gagal'}
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

