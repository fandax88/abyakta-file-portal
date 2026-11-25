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
}) {
  const searchInputRef = useRef(null);

  // Pintasan keyboard `/` atau `Ctrl+K` untuk langsung fokus ke kolom pencarian
  useEffect(() => {
    const handleKeyDown = (e) => {
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
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3.5 md:flex-row md:items-center md:justify-between">
          {/* Brand / Logo Portal */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onResetRoot}
              className="group flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500 rounded-lg"
              title="Kembali ke Root Repository"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lab-500/25 bg-gradient-to-br from-lab-600 to-lab-800 text-white shadow-sm transition-transform group-hover:scale-[1.03] dark:from-lab-500 dark:to-lab-700">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                    Abyakta Lab Repository
                  </h1>
                  <span className="hidden rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:inline-block">
                    v3.0
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  file.abyakta-h.id • Software &amp; Lab Portal
                </p>
              </div>
            </button>

            {/* Kontrol Ringkas Mobile (Dark Mode & Editor) */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={isDark ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </button>

              {isEditor ? (
                <button
                  type="button"
                  onClick={onExitEditor}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-900 px-3 text-xs font-semibold text-white dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Editor</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar + View Toggle + Theme + Editor Mode (Desktop & Tablet) */}
          <div className="flex flex-1 items-center justify-end gap-2.5 md:max-w-2xl">
            {/* Live Search Bar */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && searchQuery) {
                    e.stopPropagation();
                    onSearchChange('');
                  }
                }}
                placeholder="Cari installer, ISO, modul, atau ekstensi (.exe, .iso, .ps1)..."
                aria-label="Cari file atau folder"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-lab-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lab-500/20 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-lab-400 dark:focus:bg-slate-900"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-800 sm:inline-block">
                  /
                </kbd>
              )}
            </div>

            {/* Toggle Tampilan List / Grid */}
            <div
              className="inline-flex h-9 shrink-0 items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-900"
              role="group"
              aria-label="Pilih mode tampilan"
            >
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Tampilan Daftar (List View)"
                aria-pressed={viewMode === 'list'}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Tampilan Kotak (Grid View)"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Grid</span>
              </button>
            </div>

            {/* Toggle Dark / Light Mode (Desktop) */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white md:inline-flex"
              title={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
              aria-label={isDark ? 'Aktifkan Light Mode' : 'Aktifkan Dark Mode'}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Tombol Editor Mode (Desktop) */}
            {isEditor ? (
              <div className="hidden items-center gap-1.5 md:flex">
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Editor Mode</span>
                </span>
                <button
                  type="button"
                  onClick={onExitEditor}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  title="Keluar dari sesi Editor Mode"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="hidden h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-lab-500 dark:border-lab-500/40 dark:bg-lab-600 dark:hover:bg-lab-500 md:inline-flex"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Editor Mode</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

