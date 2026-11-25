import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'error'
            ? AlertCircle
            : toast.type === 'info'
              ? Info
              : CheckCircle2;

        const borderClass =
          toast.type === 'error'
            ? 'border-rose-500/40'
            : toast.type === 'info'
              ? 'border-lab-500/40'
              : 'border-emerald-500/40';

        const iconColor =
          toast.type === 'error'
            ? 'text-rose-500'
            : toast.type === 'info'
              ? 'text-lab-500'
              : 'text-emerald-500';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border ${borderClass} bg-[var(--bg-surface)]/95 p-3.5 text-[var(--text-primary)] shadow-xl backdrop-blur-md`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} aria-hidden="true" />
            <p className="flex-1 text-xs font-medium leading-relaxed wrap-anywhere">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
              aria-label="Tutup notifikasi"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
