import {
  Folder,
  Cpu,
  FileArchive,
  Disc,
  FileText,
  Terminal,
  FileCode,
  Image,
  Film,
  Database,
  File,
  Layers,
} from 'lucide-react';

/**
 * Memformat ukuran byte ke KB / MB / GB dengan presisi teknis (tabular-nums).
 */
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) {
    return '—';
  }
  const num = Number(bytes);
  if (num === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(num) / Math.log(k)), units.length - 1);
  const val = num / Math.pow(k, i);
  const decimals = i >= 2 ? 2 : i === 1 ? 1 : 0;
  return `${val.toFixed(decimals)} ${units[i]}`;
}

export function formatExactBytes(bytes) {
  if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) return '—';
  return `${new Intl.NumberFormat('id-ID').format(Number(bytes))} byte`;
}

/**
 * Memformat tanggal ISO 8601 ke format lokal Indonesia ringkas & rapi.
 */
export function formatModifiedDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Memformat estimasi sisa waktu (detik) saat upload berlangsung.
 */
export function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'menghitung...';
  if (seconds < 1) return '< 1 dtk';
  const sec = Math.round(seconds);
  if (sec < 60) return `${sec} dtk`;
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (mins < 60) return `${mins} mnt ${remSec} dtk`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours} jam ${remMins} mnt`;
}

/**
 * Mengekstrak ekstensi huruf kecil dari nama file.
 */
export function getFileExtension(name = '', explicitExt = null) {
  if (explicitExt && typeof explicitExt === 'string') {
    return explicitExt.toLowerCase().replace(/^\./, '');
  }
  const cleanName = String(name).trim();
  const lastDot = cleanName.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === cleanName.length - 1) return '';
  return cleanName.slice(lastDot + 1).toLowerCase();
}

/**
 * Definisi filter chip kategori untuk Bento Filter Bar.
 */
export const CATEGORY_FILTERS = [
  { key: 'all', label: 'Semua Item', Icon: Layers, dotClass: 'bg-blue-500' },
  { key: 'folder', label: 'Folder', Icon: Folder, dotClass: 'bg-amber-500' },
  { key: 'installer', label: 'Installer', Icon: Cpu, dotClass: 'bg-sky-500' },
  { key: 'iso', label: 'ISO & VM', Icon: Disc, dotClass: 'bg-violet-500' },
  { key: 'archive', label: 'Arsip', Icon: FileArchive, dotClass: 'bg-orange-500' },
  { key: 'script', label: 'Skrip & Kode', Icon: Terminal, dotClass: 'bg-emerald-500' },
  { key: 'doc', label: 'Dokumen', Icon: FileText, dotClass: 'bg-rose-500' },
];

/**
 * Mengembalikan metadata visual (ikon, groupKey untuk filter, label kategori, warna badge & bar)
 * sesuai tipe/ekstensi file laboratorium.
 */
export function getFileVisualMeta(item) {
  if (item?.isFolder || item?.mimeType === 'application/vnd.google-apps.folder') {
    return {
      groupKey: 'folder',
      Icon: Folder,
      badge: 'DIR',
      category: 'Direktori',
      barColor: 'bg-amber-500',
      iconBg:
        'bg-amber-500/12 text-amber-700 border-amber-500/25 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/25',
      badgeClass:
        'bg-amber-500/10 text-amber-800 border-amber-500/25 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/25',
      accentRing: 'group-hover:border-amber-500/45 dark:group-hover:border-amber-400/40',
    };
  }

  const ext = getFileExtension(item?.name, item?.fileExtension);
  const upperExt = ext ? ext.toUpperCase() : 'BIN';

  // 1. Installer & Executable (EXE, MSI, DEB, RPM, APK, APPIMAGE)
  if (['exe', 'msi', 'deb', 'rpm', 'apk', 'appimage', 'pkg', 'bin', 'npk'].includes(ext)) {
    return {
      groupKey: 'installer',
      Icon: Cpu,
      badge: upperExt,
      category: 'Installer / Binary',
      barColor: 'bg-sky-500',
      iconBg:
        'bg-sky-500/12 text-sky-700 border-sky-500/25 dark:bg-sky-400/15 dark:text-sky-300 dark:border-sky-400/25',
      badgeClass:
        'bg-sky-500/10 text-sky-800 border-sky-500/25 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/25',
      accentRing: 'group-hover:border-sky-500/40 dark:group-hover:border-sky-400/40',
    };
  }

  // 2. Disk & VM Image (ISO, IMG, DMG, OVA, OVF, VMDK, VDI, QCOW2)
  if (['iso', 'img', 'dmg', 'ova', 'ovf', 'vmdk', 'vdi', 'qcow2', 'vhd', 'vhdx'].includes(ext)) {
    return {
      groupKey: 'iso',
      Icon: Disc,
      badge: upperExt,
      category: 'Disk / VM Image',
      barColor: 'bg-violet-500',
      iconBg:
        'bg-violet-500/12 text-violet-700 border-violet-500/25 dark:bg-violet-400/15 dark:text-violet-300 dark:border-violet-400/25',
      badgeClass:
        'bg-violet-500/10 text-violet-800 border-violet-500/25 dark:bg-violet-400/10 dark:text-violet-300 dark:border-violet-400/25',
      accentRing: 'group-hover:border-violet-500/40 dark:group-hover:border-violet-400/40',
    };
  }

  // 3. Arsip Terkompresi (ZIP, RAR, 7Z, TAR, GZ, XZ, BZ2)
  if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'xz', 'bz2', 'zst'].includes(ext)) {
    return {
      groupKey: 'archive',
      Icon: FileArchive,
      badge: upperExt,
      category: 'Arsip Terkompresi',
      barColor: 'bg-orange-500',
      iconBg:
        'bg-orange-500/12 text-orange-700 border-orange-500/25 dark:bg-orange-400/15 dark:text-orange-300 dark:border-orange-400/25',
      badgeClass:
        'bg-orange-500/10 text-orange-800 border-orange-500/25 dark:bg-orange-400/10 dark:text-orange-300 dark:border-orange-400/25',
      accentRing: 'group-hover:border-orange-500/40 dark:group-hover:border-orange-400/40',
    };
  }

  // 4. Modul & Dokumen Praktikum (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MD, TXT)
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'md', 'txt', 'rtf'].includes(ext)) {
    return {
      groupKey: 'doc',
      Icon: FileText,
      badge: upperExt,
      category: 'Dokumen / Modul',
      barColor: 'bg-rose-500',
      iconBg:
        'bg-rose-500/12 text-rose-700 border-rose-500/25 dark:bg-rose-400/15 dark:text-rose-300 dark:border-rose-400/25',
      badgeClass:
        'bg-rose-500/10 text-rose-800 border-rose-500/25 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-400/25',
      accentRing: 'group-hover:border-rose-500/40 dark:group-hover:border-rose-400/40',
    };
  }

  // 5. Lab Scripts & Automation (SH, PS1, PY, BAT, CMD, RSC)
  if (['sh', 'bash', 'zsh', 'ps1', 'psm1', 'py', 'bat', 'cmd', 'awk', 'sed', 'rsc'].includes(ext)) {
    return {
      groupKey: 'script',
      Icon: Terminal,
      badge: upperExt,
      category: 'Skrip Otomasi Lab',
      barColor: 'bg-emerald-500',
      iconBg:
        'bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/25',
      badgeClass:
        'bg-emerald-500/10 text-emerald-800 border-emerald-500/25 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/25',
      accentRing: 'group-hover:border-emerald-500/40 dark:group-hover:border-emerald-400/40',
    };
  }

  // 6. Source Code & Konfigurasi Jaringan (JS, TS, C, CPP, JAVA, GO, JSON, YAML, PKT, CONF)
  if (
    [
      'js',
      'ts',
      'jsx',
      'tsx',
      'c',
      'cpp',
      'h',
      'java',
      'go',
      'rs',
      'php',
      'html',
      'css',
      'json',
      'yaml',
      'yml',
      'toml',
      'ini',
      'conf',
      'cfg',
      'pkt',
      'gns3project',
    ].includes(ext)
  ) {
    return {
      groupKey: 'script',
      Icon: FileCode,
      badge: upperExt.slice(0, 6),
      category: 'Kode / Konfigurasi',
      barColor: 'bg-teal-500',
      iconBg:
        'bg-teal-500/12 text-teal-700 border-teal-500/25 dark:bg-teal-400/15 dark:text-teal-300 dark:border-teal-400/25',
      badgeClass:
        'bg-teal-500/10 text-teal-800 border-teal-500/25 dark:bg-teal-400/10 dark:text-teal-300 dark:border-teal-400/25',
      accentRing: 'group-hover:border-teal-500/40 dark:group-hover:border-teal-400/40',
    };
  }

  // 7. Database & Dataset
  if (['sql', 'sqlite', 'db', 'parquet', 'bak'].includes(ext)) {
    return {
      groupKey: 'other',
      Icon: Database,
      badge: upperExt,
      category: 'Database / Dataset',
      barColor: 'bg-cyan-500',
      iconBg:
        'bg-cyan-500/12 text-cyan-700 border-cyan-500/25 dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/25',
      badgeClass:
        'bg-cyan-500/10 text-cyan-800 border-cyan-500/25 dark:bg-cyan-400/10 dark:text-cyan-300 dark:border-cyan-400/25',
      accentRing: 'group-hover:border-cyan-500/40 dark:group-hover:border-cyan-400/40',
    };
  }

  // 8. Gambar & Video
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
    return {
      groupKey: 'other',
      Icon: Image,
      badge: upperExt,
      category: 'Gambar / Aset',
      barColor: 'bg-pink-500',
      iconBg:
        'bg-pink-500/12 text-pink-700 border-pink-500/25 dark:bg-pink-400/15 dark:text-pink-300 dark:border-pink-400/25',
      badgeClass:
        'bg-pink-500/10 text-pink-800 border-pink-500/25 dark:bg-pink-400/10 dark:text-pink-300 dark:border-pink-400/25',
      accentRing: 'group-hover:border-pink-500/40 dark:group-hover:border-pink-400/40',
    };
  }

  if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext)) {
    return {
      groupKey: 'other',
      Icon: Film,
      badge: upperExt,
      category: 'Video Rekaman',
      barColor: 'bg-indigo-500',
      iconBg:
        'bg-indigo-500/12 text-indigo-700 border-indigo-500/25 dark:bg-indigo-400/15 dark:text-indigo-300 dark:border-indigo-400/25',
      badgeClass:
        'bg-indigo-500/10 text-indigo-800 border-indigo-500/25 dark:bg-indigo-400/10 dark:text-indigo-300 dark:border-indigo-400/25',
      accentRing: 'group-hover:border-indigo-500/40 dark:group-hover:border-indigo-400/40',
    };
  }

  return {
    groupKey: 'other',
    Icon: File,
    badge: upperExt.slice(0, 6),
    category: 'Berkas Umum',
    barColor: 'bg-slate-500',
    iconBg:
      'bg-slate-500/10 text-slate-700 border-slate-400/30 dark:bg-slate-400/15 dark:text-slate-300 dark:border-slate-500/30',
    badgeClass:
      'bg-slate-500/10 text-slate-700 border-slate-400/30 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-500/30',
    accentRing: 'group-hover:border-slate-400/50 dark:group-hover:border-slate-500/50',
  };
}

/**
 * Data contoh (hanya dipakai jika pengguna mengaktifkan "Pratinjau Mode Demo").
 */
export const DEMO_REPOSITORY_TREE = {
  root: {
    id: 'root',
    name: 'Root Repository',
    isRoot: true,
    items: [
      {
        id: 'demo-folder-jarkom',
        name: '01 - Praktikum Jaringan Komputer',
        mimeType: 'application/vnd.google-apps.folder',
        isFolder: true,
        size: null,
        modifiedTime: '2026-11-20T08:30:00.000Z',
      },
      {
        id: 'demo-folder-os',
        name: '02 - Sistem Operasi & Virtualisasi',
        mimeType: 'application/vnd.google-apps.folder',
        isFolder: true,
        size: null,
        modifiedTime: '2026-11-22T10:15:00.000Z',
      },
      {
        id: 'demo-file-ubuntu',
        name: 'ubuntu-24.04.1-live-server-amd64.iso',
        mimeType: 'application/x-iso9660-image',
        isFolder: false,
        size: 2794840064,
        modifiedTime: '2026-11-18T14:20:00.000Z',
        fileExtension: 'iso',
        md5Checksum: 'e240e4b801f7bb68c20d1356b60968ad',
        webContentLink: 'https://file.abyakta-h.id/#demo-ubuntu-iso',
      },
      {
        id: 'demo-file-winbox',
        name: 'winbox64.exe',
        mimeType: 'application/x-msdownload',
        isFolder: false,
        size: 2296320,
        modifiedTime: '2026-11-25T09:05:00.000Z',
        fileExtension: 'exe',
        md5Checksum: '9f86d081884c7d659a2feaa0c55ad015',
        webContentLink: 'https://file.abyakta-h.id/#demo-winbox64-exe',
      },
      {
        id: 'demo-file-vbox',
        name: 'VirtualBox-7.1.4-Win.msi',
        mimeType: 'application/x-msi',
        isFolder: false,
        size: 112680960,
        modifiedTime: '2026-11-21T16:45:00.000Z',
        fileExtension: 'msi',
        md5Checksum: '4b227777d4dd1fc61c6f884f48641d02',
        webContentLink: 'https://file.abyakta-h.id/#demo-vbox-msi',
      },
      {
        id: 'demo-file-labpack',
        name: 'Starter-Kit-Praktikum-2026.7z',
        mimeType: 'application/x-7z-compressed',
        isFolder: false,
        size: 548921344,
        modifiedTime: '2026-11-23T11:10:00.000Z',
        fileExtension: '7z',
        md5Checksum: 'd4735e3a265e16eee03f59718b9b5d03',
        webContentLink: 'https://file.abyakta-h.id/#demo-starter-7z',
      },
      {
        id: 'demo-file-setup',
        name: 'provision-lab-workstation.ps1',
        mimeType: 'text/plain',
        isFolder: false,
        size: 18432,
        modifiedTime: '2026-11-24T13:00:00.000Z',
        fileExtension: 'ps1',
        md5Checksum: '4e07408562bedb8b60ce05c1decfe3ad',
        webContentLink: 'https://file.abyakta-h.id/#demo-provision-ps1',
      },
      {
        id: 'demo-file-panduan',
        name: 'Panduan-Standar-Laboratorium-Abyakta.pdf',
        mimeType: 'application/pdf',
        isFolder: false,
        size: 4521984,
        modifiedTime: '2026-11-25T07:30:00.000Z',
        fileExtension: 'pdf',
        md5Checksum: '6b86b273ff34fce19d6b804eff5a3f57',
        webContentLink: 'https://file.abyakta-h.id/#demo-panduan-pdf',
      },
    ],
  },
  'demo-folder-jarkom': {
    id: 'demo-folder-jarkom',
    name: '01 - Praktikum Jaringan Komputer',
    isRoot: false,
    items: [
      {
        id: 'demo-jarkom-1',
        name: 'CiscoPacketTracer-822-Win64.exe',
        mimeType: 'application/x-msdownload',
        isFolder: false,
        size: 238942208,
        modifiedTime: '2026-11-20T08:45:00.000Z',
        fileExtension: 'exe',
        md5Checksum: 'ef2d127de37b942baad06145e54b0c61',
        webContentLink: 'https://file.abyakta-h.id/#demo-pt-exe',
      },
      {
        id: 'demo-jarkom-2',
        name: 'Topologi-VLAN-OSPF-Lab03.zip',
        mimeType: 'application/zip',
        isFolder: false,
        size: 12845056,
        modifiedTime: '2026-11-21T13:12:00.000Z',
        fileExtension: 'zip',
        md5Checksum: 'e7f6c011776e8db7cd330b54174fd76f',
        webContentLink: 'https://file.abyakta-h.id/#demo-vlan-zip',
      },
    ],
  },
  'demo-folder-os': {
    id: 'demo-folder-os',
    name: '02 - Sistem Operasi & Virtualisasi',
    isRoot: false,
    items: [
      {
        id: 'demo-os-1',
        name: 'debian-12.8.0-amd64-netinst.iso',
        mimeType: 'application/x-iso9660-image',
        isFolder: false,
        size: 662700032,
        modifiedTime: '2026-11-22T10:30:00.000Z',
        fileExtension: 'iso',
        md5Checksum: '7902699be42c8a8e46fbbb4501726517',
        webContentLink: 'https://file.abyakta-h.id/#demo-debian-iso',
      },
    ],
  },
};
