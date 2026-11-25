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
      setTimeout(() => inputRef.current?.focus(), 40);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    try {
      await onCreateFolder(trimmed);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal membuat folder baru.');
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
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Buat Subfolder Baru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Di dalam <span className="font-mono">/{parentFolderName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <label
            htmlFor="new-folder-name"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
          >
            Nama Folder / Kategori Praktikum
          </label>
          <input
            ref={inputRef}
            id="new-folder-name"
            type="text"
            maxLength={200}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Contoh: 03 - Keamanan Jaringan & Firewall"
            required
            className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm text-slate-900 focus:border-lab-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lab-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-lab-400"
          />
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!folderName.trim() || isSubmitting}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-lab-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-lab-700 disabled:opacity-50 dark:bg-lab-600 dark:hover:bg-lab-500"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Buat Folder</span>
          </button>
        </div>
      </form>
    </dialog>
  );
}

