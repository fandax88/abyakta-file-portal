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

        const colorClasses =
          toast.type === 'error'
            ? 'border-rose-500/35 bg-white text-rose-700 dark:bg-slate-900 dark:text-rose-300'
            : toast.type === 'info'
              ? 'border-lab-500/35 bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100'
              : 'border-emerald-500/35 bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100';

        const iconColor =
          toast.type === 'error'
            ? 'text-rose-500'
            : toast.type === 'info'
              ? 'text-lab-500'
              : 'text-emerald-500';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border p-3.5 shadow-lg backdrop-blur ${colorClasses}`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
            <p className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Tutup notifikasi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

