import React from 'react';
import { Upload, FolderPlus, ShieldCheck } from 'lucide-react';

export default function EditorToolbar({
  currentFolderName,
  showUploadPanel,
  onToggleUploadPanel,
  onOpenCreateFolder,
  activeUploadCount,
}) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.08] via-lab-500/[0.06] to-transparent p-3.5 dark:border-emerald-500/25 dark:from-emerald-500/[0.12] dark:via-lab-500/[0.08]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5 sm:items-center">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 sm:mt-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Panel Manajemen Editor
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Target direktori aktif:{' '}
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                /{currentFolderName}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateFolder}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FolderPlus className="h-4 w-4 text-amber-500" />
            <span>Buat Folder Baru</span>
          </button>

          <button
            type="button"
            onClick={onToggleUploadPanel}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold shadow-sm transition ${
              showUploadPanel
                ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                : 'bg-lab-600 text-white hover:bg-lab-700 dark:bg-lab-500 dark:hover:bg-lab-400'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>{showUploadPanel ? 'Tutup Panel Upload' : 'Upload File Besar'}</span>
            {activeUploadCount > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[11px]">
                {activeUploadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

