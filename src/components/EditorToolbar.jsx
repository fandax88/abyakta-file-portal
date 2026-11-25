import React from 'react';
import { Upload, FolderPlus, ShieldCheck, Sparkles } from 'lucide-react';

export default function EditorToolbar({
  currentFolderName,
  showUploadPanel,
  onToggleUploadPanel,
  onOpenCreateFolder,
  activeUploadCount,
  createFolderTriggerRef,
}) {
  return (
    <div className="surface-card rounded-2xl border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.08] via-lab-500/[0.05] to-transparent p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Konsol Manajemen Editor
              </p>
              <span className="hidden items-center gap-1 rounded-md bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)] sm:inline-flex">
                <Sparkles className="h-3 w-3 text-amber-500" aria-hidden="true" />
                Drag &amp; drop berkas ke mana saja di layar
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Target direktori aktif:{' '}
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                /{currentFolderName}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            ref={createFolderTriggerRef}
            type="button"
            onClick={onOpenCreateFolder}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
          >
            <FolderPlus className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span>Buat Folder Baru</span>
          </button>

          <button
            type="button"
            onClick={onToggleUploadPanel}
            aria-expanded={showUploadPanel}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 ${
              showUploadPanel
                ? 'border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                : 'bg-lab-600 text-white hover:bg-lab-700'
            }`}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>{showUploadPanel ? 'Sembunyikan Panel Upload' : 'Upload File Besar'}</span>
            {activeUploadCount > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
                {activeUploadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
