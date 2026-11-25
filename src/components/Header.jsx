import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  Sun,
  Moon,
  ShieldCheck,
  Lock,
  LogOut,
  HardDrive,
} from 'lucide-react';

export default function Header({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  isDark,
  onToggleTheme,
  isEditor,
  onOpenAuthModal,
  onExitEditor,
  onResetRoot,
  authTriggerRef,
}) {
  const searchInputRef = useRef(null);

  // Pintasan keyboard `/` atau `Ctrl+K` untuk langsung fokus ke kolom pencarian
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 backdrop-blur-xl">
      {/* Skip link untuk pengguna keyboard (ui-ux-pro-max §1 skip-links) */}
      <a
        href="#main-repository-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-lab-600 focus:px-3.5 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Langsung ke daftar berkas
      </a>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
          {/* Brand / Identitas Portal */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onResetRoot}
              className="group flex items-center gap-3 rounded-xl p-1 -ml-1 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
              title="Kembali ke Root Repository"
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lab-500/30 bg-gradient-to-b from-lab-500 to-lab-700 text-white shadow-sm transition-colors group-hover:from-lab-500 group-hover:to-lab-600">
                <HardDrive className="h-5 w-5" aria-hidden="true" />
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-surface)] bg-emerald-500"
                  aria-hidden="true"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg">
                    Abyakta Lab Repository
                  </span>
                  <span className="hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[var(--text-secondary)] sm:inline-block">
                    EDGE v3
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[var(--text-secondary)]">
                  file.abyakta-h.id • Software &amp; Lab Mirror
                </p>
              </div>
            </button>

            {/* Kontrol Mobile (Dark Mode & Editor) */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                aria-label={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              {isEditor ? (
                <button
                  type="button"
                  onClick={onExitEditor}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Keluar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-lab-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-lab-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Editor</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar + View Switcher + Theme + Editor Mode */}
          <div className="flex flex-1 items-center justify-end gap-2.5 md:max-w-2xl">
            {/* Command Live Search Bar */}
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.isComposing || e.keyCode === 229) return;
                  if (e.key === 'Escape' && searchQuery) {
                    e.stopPropagation();
                    onSearchChange('');
                  }
                }}
                placeholder="Cari berkas, installer, atau ketik ekstensi (.exe, .iso, .ps1)..."
                aria-label="Cari berkas atau direktori"
                className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/75 pl-10 pr-16 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/75 transition focus:border-lab-500 focus:bg-[var(--bg-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500/25"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                  aria-label="Bersihkan kata kunci pencarian"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : (
                <kbd
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--text-secondary)] sm:inline-block"
                >
                  Ctrl K
                </kbd>
              )}
            </div>

            {/* Segmented Toggle List / Grid View */}
            <div
              className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1"
              role="group"
              aria-label="Mode tampilan daftar berkas"
            >
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 ${
                  viewMode === 'list'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Tampilan Tabel (List View)"
                aria-pressed={viewMode === 'list'}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden lg:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 ${
                  viewMode === 'grid'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Tampilan Kartu Bento (Grid View)"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden lg:inline">Grid</span>
              </button>
            </div>

            {/* Toggle Dark / Light Mode (Desktop) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 md:inline-flex"
              title={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
              aria-label={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {/* Tombol Editor Mode (Desktop) */}
            {isEditor ? (
              <div className="hidden items-center gap-1.5 md:flex">
                <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Editor Aktif</span>
                </span>
                <button
                  type="button"
                  onClick={onExitEditor}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-secondary)] transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  title="Keluar dari sesi Editor Mode"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <button
                ref={authTriggerRef}
                type="button"
                onClick={onOpenAuthModal}
                className="hidden h-10 shrink-0 items-center gap-1.5 rounded-xl bg-lab-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-lab-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 md:inline-flex"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Editor Mode</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
