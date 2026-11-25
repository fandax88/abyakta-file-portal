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
} from 'lucide-react';

/**
 * Memformat ukuran byte ke KB / MB / GB dengan presisi teknis.
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

  // Tampilkan desimal lebih detail untuk MB/GB/TB
  const decimals = i >= 2 ? 2 : i === 1 ? 1 : 0;
  return `${val.toFixed(decimals)} ${units[i]}`;
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
 * Mengembalikan metadata visual (ikon, label kategori, warna badge) sesuai tipe/ekstensi file lab.
 */
export function getFileVisualMeta(item) {
  if (item?.isFolder || item?.mimeType === 'application/vnd.google-apps.folder') {
    return {
      Icon: Folder,
      badge: 'DIR',
      category: 'Folder Kategori',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400 border-amber-500/20',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
    };
  }

  const ext = getFileExtension(item?.name, item?.fileExtension);
  const upperExt = ext ? ext.toUpperCase() : 'FILE';

  // 1. Installer & Executable (EXE, MSI, DEB, RPM, APK, APPIMAGE)
  if (['exe', 'msi', 'deb', 'rpm', 'apk', 'appimage', 'pkg', 'bin'].includes(ext)) {
    return {
      Icon: Cpu,
      badge: upperExt,
      category: 'Installer / Binary',
      iconBg: 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400 border-sky-500/20',
      badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25',
    };
  }

  // 2. Arsip Terkompresi (ZIP, RAR, 7Z, TAR, GZ, XZ, BZ2)
  if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'xz', 'bz2', 'zst'].includes(ext)) {
    return {
      Icon: FileArchive,
      badge: upperExt,
      category: 'Arsip Terkompresi',
      iconBg: 'bg-orange-500/10 text-orange-600 dark:bg-orange-400/15 dark:text-orange-400 border-orange-500/20',
      badgeClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/25',
    };
  }

  // 3. Disk & VM Image (ISO, IMG, DMG, OVA, OVF, VMDK, VDI, QCOW2)
  if (['iso', 'img', 'dmg', 'ova', 'ovf', 'vmdk', 'vdi', 'qcow2', 'vhd'].includes(ext)) {
    return {
      Icon: Disc,
      badge: upperExt,
      category: 'Disk / VM Image',
      iconBg: 'bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-400 border-violet-500/20',
      badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25',
    };
  }

  // 4. Modul & Dokumen Praktikum (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MD, TXT)
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'md', 'txt', 'rtf'].includes(ext)) {
    return {
      Icon: FileText,
      badge: upperExt,
      category: 'Dokumen / Modul',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400 border-rose-500/20',
      badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
    };
  }

  // 5. Lab Scripts & Automation (SH, PS1, PY, BAT, CMD, RB, PL)
  if (['sh', 'bash', 'zsh', 'ps1', 'psm1', 'py', 'bat', 'cmd', 'awk', 'sed'].includes(ext)) {
    return {
      Icon: Terminal,
      badge: upperExt,
      category: 'Skrip Otomasi Lab',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400 border-emerald-500/20',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    };
  }

  // 6. Source Code & Konfigurasi Jaringan (JS, TS, C, CPP, JAVA, GO, JSON, YAML, PKT, CONF)
  if (
    ['js', 'ts', 'jsx', 'tsx', 'c', 'cpp', 'h', 'java', 'go', 'rs', 'php', 'html', 'css', 'json', 'yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'pkt', 'gns3project'].includes(ext)
  ) {
    return {
      Icon: FileCode,
      badge: upperExt,
      category: 'Kode / Konfigurasi',
      iconBg: 'bg-teal-500/10 text-teal-600 dark:bg-teal-400/15 dark:text-teal-400 border-teal-500/20',
      badgeClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25',
    };
  }

  // 7. Database & Dataset
  if (['sql', 'sqlite', 'db', 'parquet', 'bak'].includes(ext)) {
    return {
      Icon: Database,
      badge: upperExt,
      category: 'Database / Dataset',
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/15 dark:text-cyan-400 border-cyan-500/20',
      badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
    };
  }

  // 8. Gambar & Video
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
    return {
      Icon: Image,
      badge: upperExt,
      category: 'Gambar',
      iconBg: 'bg-pink-500/10 text-pink-600 dark:bg-pink-400/15 dark:text-pink-400 border-pink-500/20',
      badgeClass: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/25',
    };
  }

  if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext)) {
    return {
      Icon: Film,
      badge: upperExt,
      category: 'Video Rekaman',
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400 border-indigo-500/20',
      badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
    };
  }

  return {
    Icon: File,
    badge: upperExt.slice(0, 6),
    category: 'Berkas Umum',
    iconBg: 'bg-slate-500/10 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300 border-slate-500/20',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25',
  };
}

/**
 * Data contoh (hanya dipakai jika pengguna mengaktifkan "Pratinjau Mode Demo" sebelum kredensial GCP diisi).
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
        webContentLink: 'https://file.abyakta-h.id/#demo-ubuntu-iso',
      },
      {
        id: 'demo-file-wireshark',
        name: 'Wireshark-4.4.1-x64.exe',
        mimeType: 'application/x-msdownload',
        isFolder: false,
        size: 87451648,
        modifiedTime: '2026-11-19T09:05:00.000Z',
        fileExtension: 'exe',
        webContentLink: 'https://file.abyakta-h.id/#demo-wireshark-exe',
      },
      {
        id: 'demo-file-vbox',
        name: 'VirtualBox-7.1.4-Win.msi',
        mimeType: 'application/x-msi',
        isFolder: false,
        size: 112680960,
        modifiedTime: '2026-11-21T16:45:00.000Z',
        fileExtension: 'msi',
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
        webContentLink: 'https://file.abyakta-h.id/#demo-vlan-zip',
      },
      {
        id: 'demo-jarkom-3',
        name: 'net-diag-collector.py',
        mimeType: 'text/x-python',
        isFolder: false,
        size: 9420,
        modifiedTime: '2026-11-22T09:30:00.000Z',
        fileExtension: 'py',
        webContentLink: 'https://file.abyakta-h.id/#demo-netdiag-py',
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
        webContentLink: 'https://file.abyakta-h.id/#demo-debian-iso',
      },
      {
        id: 'demo-os-2',
        name: 'setup-docker-rootless.sh',
        mimeType: 'application/x-sh',
        isFolder: false,
        size: 6144,
        modifiedTime: '2026-11-23T15:20:00.000Z',
        fileExtension: 'sh',
        webContentLink: 'https://file.abyakta-h.id/#demo-docker-sh',
      },
    ],
  },
};

