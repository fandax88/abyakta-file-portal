import React, { useEffect, useRef, useState } from 'react';
import { FolderPlus, X, Loader2, AlertCircle } from 'lucide-react';

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreateFolder,
  parentFolderName,
}) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setFolderName('');
      setError('');
      if (!dialog.open) {
        dialog.showModal();
      }
      setTimeout(() => inputRef.current?.focus(), 35);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = folderName.trim();
    if (!trimmed) {
      setError('Nama folder tidak boleh kosong.');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onCreateFolder(trimmed);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal membuat folder baru.');
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current && !isSubmitting) {
          onClose();
        }
      }}
      aria-labelledby="create-folder-title"
      className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-2xl"
    >
      <form onSubmit={handleSubmit} noValidate className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FolderPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="create-folder-title" className="font-display text-base font-bold text-[var(--text-primary)]">
                Buat Subfolder Baru
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Lokasi induk: <span className="font-mono">/{parentFolderName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
            aria-label="Tutup modal buat folder"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5">
          <label
            htmlFor="new-folder-name"
            className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
          >
            Nama Direktori / Modul Praktikum <span className="text-rose-500">*</span>
          </label>
          <input
            ref={inputRef}
            id="new-folder-name"
            type="text"
            maxLength={200}
            value={folderName}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'folder-name-error' : 'folder-name-hint'}
            onChange={(e) => {
              setFolderName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Contoh: 03 - Administrasi RouterOS & MikroTik"
            className={`mt-1.5 h-11 w-full rounded-xl border bg-[var(--bg-elevated)]/60 px-3.5 text-sm text-[var(--text-primary)] transition focus:bg-[var(--bg-surface)] focus:outline-none focus-visible:ring-2 ${
              error
                ? 'border-rose-500 focus-visible:ring-rose-500/25'
                : 'border-[var(--border-strong)] focus:border-lab-500 focus-visible:ring-lab-500/25'
            }`}
          />
          <p id="folder-name-hint" className="mt-1.5 text-[11px] text-[var(--text-secondary)]">
            Gunakan awalan angka (mis. <code className="font-mono">01 - ...</code>) agar urutan kategori konsisten.
          </p>
        </div>

        {error && (
          <div
            id="folder-name-error"
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-lab-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-lab-700 disabled:opacity-55 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            <span>Buat Folder</span>
          </button>
        </div>
      </form>
    </dialog>
  );
}
