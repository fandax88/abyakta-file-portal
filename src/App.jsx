import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, FlaskConical, RefreshCw } from 'lucide-react';
import Header from './components/Header.jsx';
import Breadcrumbs from './components/Breadcrumbs.jsx';
import EditorToolbar from './components/EditorToolbar.jsx';
import UploadPanel from './components/UploadPanel.jsx';
import FileBrowser from './components/FileBrowser.jsx';
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
import { DEMO_REPOSITORY_TREE, getFileExtension } from './utils/fileHelpers.js';

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
        { id: initialFolder, name: 'Memuat Folder...' },
      ];
    }
    return [{ id: 'root', name: 'Root Repository' }];
  });

  const currentFolder = breadcrumbs[breadcrumbs.length - 1];
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Mode Demo opsional (hanya aktif jika diklik pengguna saat backend belum dikonfigurasi)
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoTree, setDemoTree] = useState(DEMO_REPOSITORY_TREE);

  // State Autentikasi Editor Mode
  const [editorToken, setEditorToken] = useState(() => getStoredEditorToken());
  const isEditor = Boolean(editorToken);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

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

  // Sinkronisasi query string `?folder=...` agar tautan subfolder bisa dibagikan langsung
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

  // Memuat isi folder dari API (atau dari state Demo jika Mode Demo aktif)
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
        setApiError(err.message || 'Gagal memuat daftar file dari server.');
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
    setBreadcrumbs((prev) => {
      const next = prev.slice(0, index + 1);
      const target = next[next.length - 1];
      syncUrlFolder(target.id);
      return next;
    });
  };

  const handleResetRoot = () => {
    if (breadcrumbs.length === 1 && !searchQuery) return;
    setSearchQuery('');
    setBreadcrumbs([{ id: 'root', name: 'Root Repository' }]);
    syncUrlFolder('root');
  };

  // Pencarian langsung (Live Search) berdasarkan nama atau ekstensi
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    const cleanExtQuery = q.startsWith('.') ? q.slice(1) : q;
    return items.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(q);
      const ext = getFileExtension(item.name, item.fileExtension);
      const extMatch = ext && ext === cleanExtQuery;
      return nameMatch || extMatch;
    });
  }, [items, searchQuery]);

  // Statistik direktori saat ini
  const directoryStats = useMemo(() => {
    let folderCount = 0;
    let fileCount = 0;
    let totalBytes = 0;
    for (const item of filteredItems) {
      if (item.isFolder) {
        folderCount += 1;
      } else {
        fileCount += 1;
        if (item.size) totalBytes += Number(item.size);
      }
    }
    return { folderCount, fileCount, totalBytes };
  }, [filteredItems]);

  // Salin tautan langsung ke clipboard
  const handleCopyLink = async (item) => {
    const link = item.webContentLink;
    if (!link) {
      addToast('Tautan langsung tidak tersedia untuk item ini.', 'error');
      return false;
    }
    try {
      await navigator.clipboard.writeText(link);
      addToast(`Direct link disalin: ${item.name}`, 'info');
      return true;
    } catch {
      addToast('Gagal menyalin ke clipboard secara otomatis.', 'error');
      return false;
    }
  };

  // Penanganan Sesi Kadaluwarsa / 401
  const handleAuthExpired = useCallback(() => {
    clearStoredEditorToken();
    setEditorToken(null);
    setShowUploadPanel(false);
    setIsAuthModalOpen(true);
    addToast('Sesi Editor Mode telah berakhir. Silakan masukkan PIN kembali.', 'error');
  }, [addToast]);

  // Login Editor Mode
  const handleVerifyPin = async (pin) => {
    if (isDemoMode) {
      const fakeToken = 'demo-editor-session-token';
      saveEditorToken(fakeToken, Date.now() + 3600_000);
      setEditorToken(fakeToken);
      setShowUploadPanel(true);
      addToast('Editor Mode diaktifkan (Mode Pratinjau Demo).');
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
    addToast('Keluar dari Editor Mode.', 'info');
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
      addToast(`Folder "${name}" berhasil dibuat (Demo).`);
      return;
    }

    try {
      await createDriveFolder({
        name,
        parentId: currentFolder.id,
        token: editorToken,
      });
      addToast(`Folder "${name}" berhasil dibuat.`);
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
      addToast(`"${item.name}" berhasil dihapus.`);
    } catch (err) {
      if (err.status === 401) handleAuthExpired();
      throw err;
    }
  };

  // Upload File Resumable (Mendukung Multi-File & File Besar)
  const handleSelectFilesForUpload = (selectedFiles) => {
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
        status: 'init', // 'init' | 'uploading' | 'done' | 'error' | 'canceled'
        errorMessage: '',
      };

      setUploads((prev) => [newEntry, ...prev]);

      // Simulasi progress bar mulus jika sedang berada di Mode Pratinjau Demo
      if (isDemoMode) {
        let progress = 0;
        const total = file.size || 1024 * 1024 * 25;
        const timer = setInterval(() => {
          progress = Math.min(100, progress + 12);
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
                    etaSeconds: ((100 - progress) / 12) * 0.25,
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
            addToast(`File "${file.name}" selesai diunggah (Demo).`);
          }
        }, 240);

        uploadControllersRef.current.set(uid, () => {
          clearInterval(timer);
          setUploads((prev) =>
            prev.map((u) => (u.uid === uid ? { ...u, status: 'canceled' } : u))
          );
        });
        return;
      }

      // Upload Resumable Asli ke Google Drive API v3
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
          addToast(`File "${file.name}" berhasil diunggah ke Google Drive.`);
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
                    errorMessage: err?.message || 'Gagal mengunggah file.',
                  }
                : u
            )
          );
          if (!err?.isAborted) {
            addToast(`Gagal mengunggah "${file.name}": ${err.message}`, 'error');
          }
        });
    });
  };

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

  return (
    <div className="flex min-h-screen flex-col bg-tech-grid">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        isEditor={isEditor}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onExitEditor={handleExitEditor}
        onResetRoot={handleResetRoot}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        {/* Banner Mode Pratinjau Demo */}
        {isDemoMode && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <FlaskConical className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Anda sedang melihat <strong>Mode Pratinjau Demo</strong>. Seluruh aksi tidak mengubah Google Drive asli.
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
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-amber-600/30 bg-white/80 px-3 py-1.5 font-semibold text-amber-900 transition hover:bg-white dark:bg-slate-900 dark:text-amber-200"
            >
              Kembali ke Koneksi Live API
            </button>
          </div>
        )}

        {/* Toolbar Manajemen Editor Mode */}
        {isEditor && (
          <EditorToolbar
            currentFolderName={currentFolder.name}
            showUploadPanel={showUploadPanel}
            onToggleUploadPanel={() => setShowUploadPanel((prev) => !prev)}
            onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
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

        {/* Navigasi Breadcrumb & Statistik */}
        <Breadcrumbs
          breadcrumbs={breadcrumbs}
          onNavigateBreadcrumb={handleNavigateBreadcrumb}
          onRefresh={() => loadFolder(currentFolder.id)}
          isLoading={isLoading}
          stats={directoryStats}
          isDemoMode={isDemoMode}
        />

        {/* Penanganan Error Koneksi / Konfigurasi API */}
        {apiError && !isDemoMode ? (
          <div className="rounded-xl border border-rose-500/30 bg-white p-6 shadow-sm dark:border-rose-500/25 dark:bg-slate-900/90">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tidak Dapat Memuat Repositori dari Backend API
                </h2>
                <p className="mt-1 font-mono text-xs text-rose-600 dark:text-rose-400">
                  {apiError}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Pastikan Cloudflare Pages Functions sedang berjalan (<code className="font-mono">npm run pages:dev</code>) dan keempat Environment Variables (<code className="font-mono">GOOGLE_CLIENT_EMAIL</code>, <code className="font-mono">GOOGLE_PRIVATE_KEY</code>, <code className="font-mono">GOOGLE_ROOT_FOLDER_ID</code>, <code className="font-mono">ADMIN_PIN</code>) telah dikonfigurasi serta folder Google Drive sudah dibagikan ke email Service Account.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => loadFolder(currentFolder.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-lab-600 px-3.5 text-xs font-semibold text-white transition hover:bg-lab-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Coba Lagi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBreadcrumbs([{ id: 'root', name: 'Root Repository' }]);
                      syncUrlFolder('root');
                      setIsDemoMode(true);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
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
            searchQuery={searchQuery}
            isEditor={isEditor}
            onOpenFolder={handleOpenFolder}
            onCopyLink={handleCopyLink}
            onRequestDelete={(item) => setItemToDelete(item)}
          />
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200/80 bg-white/70 py-4 dark:border-slate-800/80 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              Abyakta Lab Repository
            </strong>{' '}
            • Portal Distribusi Perangkat Lunak &amp; Modul Praktikum
          </p>
          <p className="font-mono text-[11px]">
            Cloudflare Pages Functions + Google Drive API v3
          </p>
        </div>
      </footer>

      {/* Modal Autentikasi PIN, Buat Folder, dan Konfirmasi Hapus */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSubmitPin={handleVerifyPin}
        isDemoMode={isDemoMode}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreateFolder={handleCreateFolder}
        parentFolderName={currentFolder.name}
      />

      <DeleteModal
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

