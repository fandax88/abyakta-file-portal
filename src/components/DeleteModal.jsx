import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X, Loader2, AlertCircle } from 'lucide-react';

export default function DeleteModal({ item, onClose, onConfirmDelete }) {
  const dialogRef = useRef(null);
  const cancelBtnRef = useRef(null);
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
      setTimeout(() => cancelBtnRef.current?.focus(), 35);
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
      aria-labelledby="delete-modal-title"
      className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-2xl"
    >
      {item && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="delete-modal-title" className="font-display text-base font-bold text-[var(--text-primary)]">
                  Hapus {item.isFolder ? 'Direktori' : 'Berkas'}?
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Item akan dipindahkan ke Trash Google Drive
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
              aria-label="Tutup dialog konfirmasi"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/65 p-3.5">
            <p className="font-mono text-xs font-semibold text-[var(--text-primary)] wrap-anywhere">
              {item.name}
            </p>
            {item.isFolder && (
              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                Seluruh berkas dan subfolder di dalamnya juga tidak akan tampil lagi di portal.
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-55 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              <span>Ya, Pindahkan ke Trash</span>
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
