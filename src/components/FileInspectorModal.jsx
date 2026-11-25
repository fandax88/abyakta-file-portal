import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Download,
  Link2,
  Check,
  Copy,
  ExternalLink,
  Terminal,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import {
  formatBytes,
  formatExactBytes,
  formatModifiedDate,
  getFileVisualMeta,
} from '../utils/fileHelpers.js';

export default function FileInspectorModal({
  item,
  onClose,
  onCopyText,
  isEditor,
  onRequestDelete,
}) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [copiedField, setCopiedField] = useState('');
  const [cliTab, setCliTab] = useState('powershell'); // 'powershell' | 'curl'

  const isOpen = Boolean(item);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setCopiedField('');
      if (!dialog.open) {
        dialog.showModal();
      }
      setTimeout(() => closeBtnRef.current?.focus(), 30);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  if (!item) {
    return <dialog ref={dialogRef} onClose={onClose} className="hidden" />;
  }

  const { Icon, badge, category, iconBg, badgeClass } = getFileVisualMeta(item);
  const safeFileName = item.name.replace(/"/g, '');
  const directUrl = item.webContentLink || '';

  const cliSnippet =
    cliTab === 'powershell'
      ? `Invoke-WebRequest -Uri "${directUrl}" -OutFile "${safeFileName}"`
      : `curl -L "${directUrl}" -o "${safeFileName}"`;

  const triggerCopy = async (fieldKey, value, label) => {
    const ok = await onCopyText(value, label);
    if (ok) {
      setCopiedField(fieldKey);
      setTimeout(() => {
        setCopiedField((cur) => (cur === fieldKey ? '' : cur));
      }, 2000);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      aria-labelledby="file-inspector-title"
      className="w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-2xl"
    >
      <div className="p-6">
        {/* Header Inspector */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconBg}`}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider ${badgeClass}`}
                >
                  {badge}
                </span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">{category}</span>
              </div>
              <h2
                id="file-inspector-title"
                className="mt-1 font-display text-base font-bold leading-snug text-[var(--text-primary)] sm:text-lg wrap-anywhere"
              >
                {item.name}
              </h2>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
            aria-label="Tutup detail berkas"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Grid Spesifikasi Teknis */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Ukuran Berkas
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-[var(--text-primary)] tabular-nums">
              {formatBytes(item.size)}
            </p>
            <p className="font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
              {formatExactBytes(item.size)}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Terakhir Dimodifikasi
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-[var(--text-primary)] tabular-nums">
              {formatModifiedDate(item.modifiedTime)}
            </p>
            <p className="truncate font-mono text-[11px] text-[var(--text-secondary)]" title={item.mimeType}>
              {item.mimeType || 'application/octet-stream'}
            </p>
          </div>
        </div>

        {/* Verifikasi Integritas Checksum MD5 */}
        {item.md5Checksum && (
          <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                <span>MD5 Checksum (Verifikasi Integritas)</span>
              </span>
              <button
                type="button"
                onClick={() => triggerCopy('md5', item.md5Checksum, 'MD5 Checksum')}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
              >
                {copiedField === 'md5' ? (
                  <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                ) : (
                  <Copy className="h-3 w-3" aria-hidden="true" />
                )}
                <span>{copiedField === 'md5' ? 'Tersalin' : 'Salin Hash'}</span>
              </button>
            </div>
            <p className="mt-1.5 font-mono text-xs text-[var(--text-primary)] wrap-anywhere">
              {item.md5Checksum}
            </p>
          </div>
        )}

        {/* Perintah Unduh Terminal / Workstation Lab */}
        {directUrl && (
          <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <Terminal className="h-3.5 w-3.5 text-lab-500" aria-hidden="true" />
                <span>Unduh Cepat via Terminal Lab</span>
              </span>

              <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5">
                <button
                  type="button"
                  onClick={() => setCliTab('powershell')}
                  aria-pressed={cliTab === 'powershell'}
                  className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold transition ${
                    cliTab === 'powershell'
                      ? 'bg-lab-600 text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  PowerShell
                </button>
                <button
                  type="button"
                  onClick={() => setCliTab('curl')}
                  aria-pressed={cliTab === 'curl'}
                  className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold transition ${
                    cliTab === 'curl'
                      ? 'bg-lab-600 text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  curl (Linux)
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-start justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5">
              <code className="font-mono text-[11px] leading-relaxed text-[var(--text-primary)] wrap-anywhere">
                {cliSnippet}
              </code>
              <button
                type="button"
                onClick={() => triggerCopy('cli', cliSnippet, 'Perintah CLI')}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                title="Salin perintah terminal"
                aria-label="Salin perintah terminal"
              >
                {copiedField === 'cli' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-[var(--border-subtle)] pt-4">
          <div className="flex items-center gap-2">
            {isEditor && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestDelete(item);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Hapus</span>
              </button>
            )}

            {item.webViewLink && (
              <a
                href={item.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Pratinjau Drive</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerCopy('link', directUrl, `Direct link ${item.name}`)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 ${
                copiedField === 'link'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              {copiedField === 'link' ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{copiedField === 'link' ? 'Link Tersalin!' : 'Copy Direct Link'}</span>
            </button>

            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-lab-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-lab-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download Berkas</span>
            </a>
          </div>
        </div>
      </div>
    </dialog>
  );
}

