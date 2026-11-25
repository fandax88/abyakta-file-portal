import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, X, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onSubmitPin, isDemoMode }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setPin('');
      setShowPin(false);
      setError('');
      if (!dialog.open) {
        dialog.showModal();
      }
      setTimeout(() => inputRef.current?.focus(), 35);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!pin.trim()) {
      setError('Silakan masukkan Admin PIN terlebih dahulu.');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmitPin(pin.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal memverifikasi PIN Admin.');
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
      aria-labelledby="auth-modal-title"
      className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-2xl"
    >
      <form onSubmit={handleFormSubmit} noValidate className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-lab-500/25 bg-lab-500/10 text-lab-600 dark:text-lab-400">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="font-display text-base font-bold text-[var(--text-primary)]">
                Autentikasi Editor Mode
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Masukkan Admin PIN untuk mengunggah &amp; mengelola berkas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
            aria-label="Tutup modal autentikasi"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {isDemoMode && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
            <strong>Mode Simulasi:</strong> Masukkan PIN bebas (contoh: <code className="font-mono">123456</code>) untuk mencoba panel Editor Mode.
          </div>
        )}

        <div className="mt-5">
          <label
            htmlFor="admin-pin-input"
            className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
          >
            Admin PIN <span className="text-rose-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <input
              ref={inputRef}
              id="admin-pin-input"
              type={showPin ? 'text' : 'password'}
              autoComplete="current-password"
              value={pin}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'admin-pin-error' : undefined}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              placeholder="Masukkan PIN Admin"
              className={`h-11 w-full rounded-xl border bg-[var(--bg-elevated)]/60 pl-3.5 pr-11 font-mono text-sm text-[var(--text-primary)] transition focus:bg-[var(--bg-surface)] focus:outline-none focus-visible:ring-2 ${
                error
                  ? 'border-rose-500 focus-visible:ring-rose-500/25'
                  : 'border-[var(--border-strong)] focus:border-lab-500 focus-visible:ring-lab-500/25'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPin((prev) => !prev)}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
              aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
              aria-pressed={showPin}
            >
              {showPin ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            id="admin-pin-error"
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
            <span>Aktifkan Editor Mode</span>
          </button>
        </div>
      </form>
    </dialog>
  );
}
