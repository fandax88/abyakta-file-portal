import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, FlaskConical, RefreshCw, UploadCloud } from 'lucide-react';
import Header from './components/Header.jsx';
import Breadcrumbs from './components/Breadcrumbs.jsx';
import EditorToolbar from './components/EditorToolbar.jsx';
import UploadPanel from './components/UploadPanel.jsx';
import FileBrowser from './components/FileBrowser.jsx';
import FileInspectorModal from './components/FileInspectorModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import CreateFolderModal from './components/CreateFolderModal.jsx';
import DeleteModal from './components/DeleteModal.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import {
  fetchFolderContents,
  authenticateEditorPin,
  createDriveFolder,
  deleteDriveItem,
  uploadFileResumable,
  getStoredEditorToken,
  clearStoredEditorToken,
  saveEditorToken,
} from './utils/api.js';
import {
  DEMO_REPOSITORY_TREE,
  getFileExtension,
  getFileVisualMeta,
} from './utils/fileHelpers.js';

export default function App() {
  // Preferensi Tema (Dark / Light) & Mode Tampilan (List / Grid)
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('abyakta_view_mode') === 'grid' ? 'grid' : 'list';
    } catch {
      return 'list';
    }
  });

  // State Direktori & Breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const initialFolder = params.get('folder');
    if (initialFolder && initialFolder !== 'root') {
      return [
        { id: 'root', name: 'Root Repository' },
        { id: initialFolder, name: 'Memuat Direktori…' },
      ];
    }
    return [{ id: 'root', name: 'Root Repository' }];
  });

  const currentFolder = breadcrumbs[breadcrumbs.length - 1];
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Mode Simulasi Demo (opsional)
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoTree, setDemoTree] = useState(DEMO_REPOSITORY_TREE);

  // State Autentikasi Editor Mode & Modal Focus Return Refs (ui-ux-pro-max Modal Dialog Focus)
  const [editorToken, setEditorToken] = useState(() => getStoredEditorToken());
  const isEditor = Boolean(editorToken);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [inspectedItem, setInspectedItem] = useState(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [isWindowDragging, setIsWindowDragging] = useState(false);

  const authTriggerRef = useRef(null);
  const createFolderTriggerRef = useRef(null);
  const lastFocusedElementRef = useRef(null);
  const dragDepthRef = useRef(0);

  // State Antrean Upload Resumable & Toast
  const [uploads, setUploads] = useState([]);
  const uploadControllersRef = useRef(new Map());
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const restoreFocus = useCallback((fallbackRef = null) => {
    const target = lastFocusedElementRef.current || fallbackRef?.current;
    lastFocusedElementRef.current = null;
    if (target && typeof target.focus === 'function') {
      setTimeout(() => target.focus(), 20);
    }
  }, []);

  // Sinkronisasi Dark Mode ke elemen <html> & localStorage
  const handleToggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
      try {
        localStorage.setItem('abyakta_theme', next ? 'dark' : 'light');
      } catch {
        // Abaikan
      }
      return next;
    });
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('abyakta_view_mode', mode);
    } catch {
      // Abaikan
    }
  };

  const syncUrlFolder = (folderId) => {
    const url = new URL(window.location.href);
    if (!folderId || folderId === 'root') {
      url.searchParams.delete('folder');
    } else {
      url.searchParams.set('folder', folderId);
    }
    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const folderParam = params.get('folder') || 'root';
      setActiveCategory('all');
      if (folderParam === 'root') {
        setBreadcrumbs([{ id: 'root', name: 'Root Repository' }]);
      } else {
        setBreadcrumbs((prev) => {
          const existingIdx = prev.findIndex((b) => b.id === folderParam);
          if (existingIdx !== -1) return prev.slice(0, existingIdx + 1);
          return [
            { id: 'root', name: 'Root Repository' },
            { id: folderParam, name: 'Subfolder' },
          ];
        });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Memuat isi folder dari API (atau dari state Demo)
  const loadFolder = useCallback(
    async (folderId, signal) => {
      setIsLoading(true);
      setApiError('');

      if (isDemoMode) {
        const node = demoTree[folderId] || demoTree.root;
        setItems(node.items || []);
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchFolderContents(folderId, signal);
        setItems(Array.isArray(data.items) ? data.items : []);
        if (data.folder?.name && folderId !== 'root') {
          setBreadcrumbs((prev) =>
            prev.map((crumb) =>
              crumb.id === folderId ? { ...crumb, name: data.folder.name } : crumb
            )
          );
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setApiError(err.message || 'Gagal memuat daftar berkas dari server.');
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    },
    [isDemoMode, demoTree]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadFolder(currentFolder.id, controller.signal);
    return () => controller.abort();
  }, [currentFolder.id, loadFolder]);

  // Navigasi masuk ke subfolder
  const handleOpenFolder = (folderItem) => {
    setSearchQuery('');
    setActiveCategory('all');
    setBreadcrumbs((prev) => {
      const existsIdx = prev.findIndex((c) => c.id === folderItem.id);
      if (existsIdx !== -1) return prev.slice(0, existsIdx + 1);
      return [...prev, { id: folderItem.id, name: folderItem.name }];
    });
    syncUrlFolder(folderItem.id);
  };

  // Navigasi via Breadcrumb
  const handleNavigateBreadcrumb = (index) => {
    setSearchQuery('');
    setActiveCategory('all');
    setBreadcrumbs((prev) => {
      const next = prev.slice(0, index + 1);
      const target = next[next.length - 1];
      syncUrlFolder(target.id);
      return next;
    });
  };

  const handleResetRoot = () => {
    if (breadcrumbs.length === 1 && !searchQuery && activeCategory === 'all') return;
    setSearchQuery('');
    setActiveCategory('all');
    setBreadcrumbs([{ id: 'root', name: 'Root Repository' }]);
    syncUrlFolder('root');
  };

  // Filter gabungan: Kategori Bento + Live Search
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cleanExtQuery = q.startsWith('.') ? q.slice(1) : q;

    return items.filter((item) => {
      if (activeCategory !== 'all') {
        const meta = getFileVisualMeta(item);
        if (meta.groupKey !== activeCategory) return false;
      }

      if (!q) return true;
      const nameMatch = item.name.toLowerCase().includes(q);
      const ext = getFileExtension(item.name, item.fileExtension);
      const extMatch = ext && ext === cleanExtQuery;
      return nameMatch || extMatch;
    });
  }, [items, searchQuery, activeCategory]);

  // Salin teks generik / Direct Link ke clipboard
  const handleCopyText = useCallback(
    async (text, label = 'Teks') => {
      if (!text) {
        addToast(`${label} tidak tersedia.`, 'error');
        return false;
      }
      try {
        await navigator.clipboard.writeText(text);
        addToast(`${label} berhasil disalin ke clipboard.`, 'info');
        return true;
      } catch {
        addToast('Gagal menyalin ke clipboard secara otomatis.', 'error');
        return false;
      }
    },
    [addToast]
  );

  const handleCopyLink = useCallback(
    (item) => handleCopyText(item.webContentLink, `Direct link ${item.name}`),
    [handleCopyText]
  );

  // Penanganan Sesi Kadaluwarsa / 401
  const handleAuthExpired = useCallback(() => {
    clearStoredEditorToken();
    setEditorToken(null);
    setShowUploadPanel(false);
    setIsAuthModalOpen(true);
    addToast('Sesi Editor Mode berakhir. Silakan verifikasi PIN kembali.', 'error');
  }, [addToast]);

  // Login Editor Mode
  const handleVerifyPin = async (pin) => {
    if (isDemoMode) {
      const fakeToken = 'demo-editor-session-token';
      saveEditorToken(fakeToken, Date.now() + 3600_000);
      setEditorToken(fakeToken);
      setShowUploadPanel(true);
      addToast('Editor Mode diaktifkan (Mode Simulasi).');
      return;
    }

    const res = await authenticateEditorPin(pin);
    setEditorToken(res.token);
    setShowUploadPanel(true);
    addToast('Editor Mode berhasil diaktifkan.');
  };

  const handleExitEditor = () => {
    clearStoredEditorToken();
    setEditorToken(null);
    setShowUploadPanel(false);
    addToast('Keluar dari sesi Editor Mode.', 'info');
  };

  // Buat Folder Baru
  const handleCreateFolder = async (name) => {
    if (isDemoMode) {
      const newId = `demo-folder-${Date.now()}`;
      const newFolder = {
        id: newId,
        name,
        mimeType: 'application/vnd.google-apps.folder',
        isFolder: true,
        size: null,
        modifiedTime: new Date().toISOString(),
      };
      setDemoTree((prev) => {
        const currentNode = prev[currentFolder.id] || {
          id: currentFolder.id,
          name: currentFolder.name,
          items: [],
        };
        return {
          ...prev,
          [currentFolder.id]: {
            ...currentNode,
            items: [newFolder, ...currentNode.items],
          },
          [newId]: {
            id: newId,
            name,
            isRoot: false,
            items: [],
          },
        };
      });
      addToast(`Direktori "${name}" berhasil dibuat (Demo).`);
      return;
    }

    try {
      await createDriveFolder({
        name,
        parentId: currentFolder.id,
        token: editorToken,
      });
      addToast(`Direktori "${name}" berhasil dibuat.`);
      await loadFolder(currentFolder.id);
    } catch (err) {
      if (err.status === 401) handleAuthExpired();
      throw err;
    }
  };

  // Hapus File / Folder
  const handleConfirmDelete = async (item) => {
    if (isDemoMode) {
      setDemoTree((prev) => {
        const currentNode = prev[currentFolder.id];
        if (!currentNode) return prev;
        return {
          ...prev,
          [currentFolder.id]: {
            ...currentNode,
            items: currentNode.items.filter((i) => i.id !== item.id),
          },
        };
      });
      addToast(`"${item.name}" dipindahkan ke Trash (Demo).`);
      return;
    }

    try {
      await deleteDriveItem({ id: item.id, token: editorToken });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      addToast(`"${item.name}" berhasil dipindahkan ke Trash.`);
    } catch (err) {
      if (err.status === 401) handleAuthExpired();
      throw err;
    }
  };

  // Upload File Resumable (Mendukung Multi-File & File Besar)
  const handleSelectFilesForUpload = useCallback(
    (selectedFiles) => {
      setShowUploadPanel(true);
      selectedFiles.forEach((file) => {
        const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newEntry = {
          uid,
          name: file.name,
          loaded: 0,
          total: file.size,
          percent: 0,
          speedBps: 0,
          etaSeconds: Infinity,
          status: 'init',
          errorMessage: '',
        };

        setUploads((prev) => [newEntry, ...prev]);

        if (isDemoMode) {
          let progress = 0;
          const total = file.size || 1024 * 1024 * 25;
          const timer = setInterval(() => {
            progress = Math.min(100, progress + 14);
            const loaded = Math.round((progress / 100) * total);
            setUploads((prev) =>
              prev.map((u) =>
                u.uid === uid
                  ? {
                      ...u,
                      status: progress >= 100 ? 'done' : 'uploading',
                      percent: progress,
                      loaded,
                      total,
                      speedBps: 18 * 1024 * 1024,
                      etaSeconds: ((100 - progress) / 14) * 0.22,
                    }
                  : u
              )
            );
            if (progress >= 100) {
              clearInterval(timer);
              uploadControllersRef.current.delete(uid);
              const demoFile = {
                id: `demo-upload-${uid}`,
                name: file.name,
                mimeType: file.type || 'application/octet-stream',
                isFolder: false,
                size: file.size,
                modifiedTime: new Date().toISOString(),
                md5Checksum: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
                webContentLink: `https://file.abyakta-h.id/#demo-${encodeURIComponent(file.name)}`,
              };
              setDemoTree((prev) => {
                const currentNode = prev[currentFolder.id] || demoTree.root;
                return {
                  ...prev,
                  [currentFolder.id]: {
                    ...currentNode,
                    items: [...currentNode.items, demoFile],
                  },
                };
              });
              addToast(`Berkas "${file.name}" selesai diunggah (Demo).`);
            }
          }, 220);

          uploadControllersRef.current.set(uid, () => {
            clearInterval(timer);
            setUploads((prev) =>
              prev.map((u) => (u.uid === uid ? { ...u, status: 'canceled' } : u))
            );
          });
          return;
        }

        const task = uploadFileResumable({
          file,
          folderId: currentFolder.id,
          token: editorToken,
          onProgress: ({ loaded, total, percent, speedBps, etaSeconds }) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.uid === uid
                  ? {
                      ...u,
                      status: 'uploading',
                      loaded,
                      total,
                      percent,
                      speedBps,
                      etaSeconds,
                    }
                  : u
              )
            );
          },
        });

        uploadControllersRef.current.set(uid, task.abort);

        task.promise
          .then(() => {
            uploadControllersRef.current.delete(uid);
            setUploads((prev) =>
              prev.map((u) =>
                u.uid === uid
                  ? { ...u, status: 'done', percent: 100, loaded: file.size }
                  : u
              )
            );
            addToast(`Berkas "${file.name}" berhasil diunggah ke Google Drive.`);
            loadFolder(currentFolder.id);
          })
          .catch((err) => {
            uploadControllersRef.current.delete(uid);
            if (err?.status === 401) {
              handleAuthExpired();
            }
            setUploads((prev) =>
              prev.map((u) =>
                u.uid === uid
                  ? {
                      ...u,
                      status: err?.isAborted ? 'canceled' : 'error',
                      errorMessage: err?.message || 'Gagal mengunggah berkas.',
                    }
                  : u
              )
            );
            if (!err?.isAborted) {
              addToast(`Gagal mengunggah "${file.name}": ${err.message}`, 'error');
            }
          });
      });
    },
    [isDemoMode, currentFolder.id, editorToken, demoTree.root, addToast, loadFolder, handleAuthExpired]
  );

  // Global Window Drag-and-Drop saat Editor Mode aktif
  useEffect(() => {
    if (!isEditor) {
      setIsWindowDragging(false);
      dragDepthRef.current = 0;
      return undefined;
    }

    const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');

    const onDragEnter = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current += 1;
      setIsWindowDragging(true);
    };

    const onDragOver = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
    };

    const onDragLeave = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsWindowDragging(false);
      }
    };

    const onDrop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsWindowDragging(false);
      const dropped = Array.from(e.dataTransfer?.files || []);
      if (dropped.length > 0) {
        handleSelectFilesForUpload(dropped);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [isEditor, handleSelectFilesForUpload]);

  const handleCancelUpload = (uid) => {
    const cancelFn = uploadControllersRef.current.get(uid);
    if (cancelFn) {
      cancelFn();
      uploadControllersRef.current.delete(uid);
    }
  };

  const handleClearFinishedUploads = () => {
    setUploads((prev) =>
      prev.filter((u) => u.status === 'uploading' || u.status === 'init')
    );
  };

  const activeUploadCount = uploads.filter(
    (u) => u.status === 'uploading' || u.status === 'init'
  ).length;

  const hasActiveFilters = Boolean(searchQuery.trim()) || activeCategory !== 'all';

  return (
    <div className="flex min-h-dvh flex-col bg-lab-atmosphere">
      {/* Overlay Global Drag-and-Drop saat Editor Mode Aktif */}
      {isEditor && isWindowDragging && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-slate-950/65 p-6 backdrop-blur-sm"
        >
          <div className="flex max-w-md flex-col items-center rounded-3xl border-2 border-dashed border-lab-400 bg-[var(--bg-surface)] px-10 py-12 text-center shadow-2xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lab-500/15 text-lab-500">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="font-display text-lg font-bold text-[var(--text-primary)]">
              Lepaskan untuk Mengunggah Berkas
            </p>
            <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">
              Tujuan: /{currentFolder.name}
            </p>
          </div>
        </div>
      )}

      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        isEditor={isEditor}
        authTriggerRef={authTriggerRef}
        onOpenAuthModal={() => {
          lastFocusedElementRef.current = document.activeElement;
          setIsAuthModalOpen(true);
        }}
        onExitEditor={handleExitEditor}
        onResetRoot={handleResetRoot}
      />

      <main
        id="main-repository-content"
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8"
      >
        {/* Banner Mode Simulasi Demo */}
        {isDemoMode && (
          <div className="surface-card flex flex-col gap-2.5 rounded-2xl border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <FlaskConical className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>
                Anda sedang melihat <strong>Mode Simulasi UI</strong>. Seluruh perubahan bersifat lokal dan tidak mengubah Google Drive asli.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearStoredEditorToken();
                setEditorToken(null);
                setIsDemoMode(false);
                setBreadcrumbs([{ id: 'root', name: 'Root Repository' }]);
                syncUrlFolder('root');
              }}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-xl border border-amber-600/30 bg-[var(--bg-surface)] px-3 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Kembali ke Live Google Drive
            </button>
          </div>
        )}

        {/* Toolbar Manajemen Editor Mode */}
        {isEditor && (
          <EditorToolbar
            currentFolderName={currentFolder.name}
            showUploadPanel={showUploadPanel}
            onToggleUploadPanel={() => setShowUploadPanel((prev) => !prev)}
            createFolderTriggerRef={createFolderTriggerRef}
            onOpenCreateFolder={() => {
              lastFocusedElementRef.current = document.activeElement;
              setIsCreateFolderOpen(true);
            }}
            activeUploadCount={activeUploadCount}
          />
        )}

        {/* Panel Upload File Besar (Resumable Upload) */}
        {isEditor && showUploadPanel && (
          <UploadPanel
            uploads={uploads}
            onSelectFiles={handleSelectFilesForUpload}
            onCancelUpload={handleCancelUpload}
            onClearFinishedUploads={handleClearFinishedUploads}
            currentFolderName={currentFolder.name}
            isDemoMode={isDemoMode}
          />
        )}

        {/* Bento Overview: Breadcrumb + Telemetry + Category Filter Chips */}
        <Breadcrumbs
          breadcrumbs={breadcrumbs}
          onNavigateBreadcrumb={handleNavigateBreadcrumb}
          onRefresh={() => loadFolder(currentFolder.id)}
          isLoading={isLoading}
          allItems={items}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          isDemoMode={isDemoMode}
        />

        {/* Penanganan Error Koneksi / Konfigurasi API */}
        {apiError && !isDemoMode ? (
          <div className="surface-card rounded-2xl border-rose-500/30 p-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
                  Tidak Dapat Memuat Repositori dari Backend API
                </h2>
                <p className="mt-1 font-mono text-xs text-rose-600 dark:text-rose-400 wrap-anywhere">
                  {apiError}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                  Pastikan konfigurasi kredensial Google Drive (<code className="font-mono">GOOGLE_CLIENT_ID</code>,{' '}
                  <code className="font-mono">GOOGLE_CLIENT_SECRET</code>,{' '}
                  <code className="font-mono">GOOGLE_REFRESH_TOKEN</code>,{' '}
                  <code className="font-mono">GOOGLE_ROOT_FOLDER_ID</code>, dan{' '}
                  <code className="font-mono">ADMIN_PIN</code>) telah aktif pada Cloudflare Pages.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => loadFolder(currentFolder.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-lab-600 px-4 text-xs font-semibold text-white transition hover:bg-lab-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Coba Lagi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBreadcrumbs([{ id: 'root', name: 'Root Repository' }]);
                      syncUrlFolder('root');
                      setIsDemoMode(true);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 text-xs font-semibold text-[var(--text-primary)] transition hover:border-lab-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-lab-500"
                  >
                    <FlaskConical className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                    <span>Pratinjau UI dengan Data Demo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <FileBrowser
            items={filteredItems}
            viewMode={viewMode}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            searchQuery={searchQuery}
            isEditor={isEditor}
            onOpenFolder={handleOpenFolder}
            onInspectFile={(fileItem, triggerEl) => {
              lastFocusedElementRef.current = triggerEl || document.activeElement;
              setInspectedItem(fileItem);
            }}
            onCopyLink={handleCopyLink}
            onRequestDelete={(targetItem, triggerEl) => {
              lastFocusedElementRef.current = triggerEl || document.activeElement;
              setItemToDelete(targetItem);
            }}
            onResetFilters={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
          />
        )}
      </main>

      <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/75 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-[var(--text-secondary)] sm:flex-row sm:px-6 lg:px-8">
          <p>
            <strong className="font-display font-semibold text-[var(--text-primary)]">
              Abyakta Lab Repository
            </strong>{' '}
            • Portal Distribusi Perangkat Lunak &amp; Modul Praktikum
          </p>
          <p className="font-mono text-[11px]">
            Cloudflare Pages Edge + Google Drive API v3
          </p>
        </div>
      </footer>

      {/* Modal Detail & Checksum Berkas */}
      <FileInspectorModal
        item={inspectedItem}
        onClose={() => {
          setInspectedItem(null);
          restoreFocus();
        }}
        onCopyText={handleCopyText}
        isEditor={isEditor}
        onRequestDelete={(targetItem) => setItemToDelete(targetItem)}
      />

      {/* Modal Autentikasi PIN, Buat Folder, dan Konfirmasi Hapus */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          restoreFocus(authTriggerRef);
        }}
        onSubmitPin={handleVerifyPin}
        isDemoMode={isDemoMode}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => {
          setIsCreateFolderOpen(false);
          restoreFocus(createFolderTriggerRef);
        }}
        onCreateFolder={handleCreateFolder}
        parentFolderName={currentFolder.name}
      />

      <DeleteModal
        item={itemToDelete}
        onClose={() => {
          setItemToDelete(null);
          restoreFocus();
        }}
        onConfirmDelete={handleConfirmDelete}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
