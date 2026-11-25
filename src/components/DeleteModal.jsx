import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X, Loader2, AlertCircle } from 'lucide-react';

export default function DeleteModal({ item, onClose, onConfirmDelete }) {
  const dialogRef = useRef(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const isOpen = Boolean(item);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setError('');
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!item || isDeleting) return;
    setIsDeleting(true);
    setError('');
    try {
      await onConfirmDelete(item);
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menghapus item.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current && !isDeleting) {
          onClose();
        }
      }}
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
    >
      {item && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Konfirmasi Hapus {item.isFolder ? 'Folder' : 'File'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Item akan dipindahkan ke Trash Google Drive
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Tutup modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="break-all font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
              {item.name}
            </p>
            {item.isFolder && (
              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                Perhatian: Menghapus folder juga akan menyembunyikan seluruh file dan subfolder di dalamnya dari portal.
              </p>
            )}
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
              disabled={isDeleting}
              className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Ya, Hapus</span>
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

