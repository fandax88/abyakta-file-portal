# Abyakta Lab Repository (`file.abyakta-h.id`)

Portal repositori perangkat lunak, installer, image sistem operasi (`.iso`), arsip praktikum, dan skrip otomasi laboratorium **Abyakta Lab** yang dirancang sebagai proyek mandiri (*standalone*) di atas **Cloudflare Pages** + **Cloudflare Pages Functions** dengan penyimpanan backend **Google Drive API v3** (tanpa Google Apps Script).

---

## Fitur Utama

- **Mode Viewer Publik (Default):**
  - Penjelajah direktori bertingkat dengan *breadcrumb* interaktif dan sinkronisasi URL (`?folder=...`).
  - Ikon dan lencana otomatis sesuai ekstensi teknis (`EXE`/`MSI`, `ZIP`/`RAR`/`7Z`, `ISO`/`OVA`, `PDF`, `SH`/`PS1`/`PY`).
  - *Live Search Bar* instan (tekan `/` atau `Ctrl+K`), pengurutan kolom (Nama, Ukuran, Tanggal), toggle **List / Grid View**, serta **Dark / Light Mode** bebas kedipan (*anti-FOUC*).
  - Tombol **Download** langsung dan **Copy Direct Link** (`webContentLink`).
- **Mode Editor Terproteksi (Admin PIN):**
  - Verifikasi `ADMIN_PIN` melalui `/api/auth` dengan *stateless* **HMAC-SHA256 Session Token** yang disimpan di `sessionStorage`.
  - **Direct Resumable Upload (Mendukung File Multi-GB):** Backend `/api/upload-init` membuat *Google Drive Resumable Session URI* dengan meneruskan header `Origin` browser sehingga browser mengunggah file langsung ke server Google Drive dilengkapi *progress bar* persentase, kecepatan (`MB/s`), estimasi waktu (`ETA`), *auto-resume* saat jaringan terputus, dan tombol batal — melewati batas ukuran body request Cloudflare Workers.
  - **Manajemen Folder & Item:** Buat subfolder kategori baru (`/api/folders`) dan hapus file/folder ke Trash (`DELETE /api/files/:id`) dengan dialog konfirmasi.
- **Zero Heavy Node Dependencies di Edge:**
  - Penandatanganan JWT **RS256** untuk Google Service Account dibangun 100% menggunakan standar **Web Crypto API (`crypto.subtle`)** bawaan Cloudflare Workers.

---

## Struktur Proyek

```text
abyakta-lab-repository/
├── functions/
│   └── api/
│       └── [[route]].js          # Serverless API (Cloudflare Pages Functions + Web Crypto JWT RS256)
├── public/
│   ├── favicon.svg               # Ikon portal Abyakta Lab
│   └── _headers                  # Security headers Cloudflare Pages
├── src/
│   ├── components/
│   │   ├── Header.jsx            # Logo, Live Search, Toggle Grid/List, Dark Mode, tombol Editor Mode
│   │   ├── Breadcrumbs.jsx       # Navigasi path direktori & statistik ukuran
│   │   ├── EditorToolbar.jsx     # Panel aksi Admin (Upload File Besar & Buat Folder)
│   │   ├── UploadPanel.jsx       # Drag & drop + progress bar Resumable Upload
│   │   ├── FileBrowser.jsx       # Tabel List View & kartu Grid View
│   │   ├── AuthModal.jsx         # Modal input Admin PIN
│   │   ├── CreateFolderModal.jsx # Modal pembuatan subfolder baru
│   │   ├── DeleteModal.jsx       # Modal konfirmasi hapus item
│   │   └── ToastContainer.jsx    # Notifikasi status & salin tautan
│   ├── utils/
│   │   ├── api.js                # Klien HTTP & XHR Resumable Uploader
│   │   └── fileHelpers.js        # Pemformat byte, tanggal, dan pemetaan ikon ekstensi
│   ├── App.jsx                   # Orkestrasi state utama aplikasi
│   ├── index.css                 # Konfigurasi Tailwind CSS & utilitas visual teknis
│   └── main.jsx                  # Entrypoint React
├── .dev.vars.example             # Contoh konfigurasi secret untuk pengujian lokal Wrangler
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── wrangler.toml                 # Konfigurasi output `dist` untuk Cloudflare Pages
```

---

## Daftar Endpoint Backend (`functions/api/[[route]].js`)

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/files?folderId=...` | Publik | Mengambil daftar subfolder & file dari Google Drive API v3 beserta `webContentLink`. |
| `POST` | `/api/auth` | Publik | Memvalidasi `ADMIN_PIN` dan mengembalikan token sesi `Bearer`. |
| `POST` | `/api/upload-init` | Editor (`Bearer`) | Meminta *Resumable Upload Session URI* dari Google Drive API (dengan CORS `Origin`). |
| `POST` | `/api/folders` | Editor (`Bearer`) | Membuat folder baru di dalam folder aktif. |
| `DELETE` | `/api/files/:id` | Editor (`Bearer`) | Memindahkan file atau folder ke Trash Google Drive (juga tersedia alias `POST/DELETE /api/delete`). |
| `GET` | `/api/health` | Publik | Memeriksa kesiapan keempat Environment Variables (tanpa mengekspos nilai rahasia). |

---

## Panduan Langkah demi Langkah Setup & Deployment

### Tahap 1: Membuat Service Account di Google Cloud Console & Menyiapkan Folder Google Drive

1. **Buat Project & Aktifkan Google Drive API:**
   - Buka [Google Cloud Console](https://console.cloud.google.com/).
   - Buat project baru (misal: `abyakta-lab-repo`) atau pilih project yang sudah ada.
   - Masuk ke menu **APIs & Services > Library**, cari **Google Drive API**, lalu klik **Enable**.

2. **Buat Service Account & Unduh Kunci JSON:**
   - Masuk ke **IAM & Admin > Service Accounts** lalu klik **+ Create Service Account**.
   - Isi nama (misal: `abyakta-drive-bot`), klik **Create and Continue**, lewati bagian Role opsional, lalu klik **Done**.
   - Klik email Service Account yang baru dibuat (contoh: `abyakta-drive-bot@abyakta-lab-repo.iam.gserviceaccount.com`), buka tab **Keys**.
   - Klik **Add Key > Create new key**, pilih tipe **JSON**, lalu klik **Create**.
   - Simpan file `.json` yang terunduh. Di dalamnya terdapat dua nilai penting:
     - `"client_email"` -> akan diisi ke `GOOGLE_CLIENT_EMAIL`
     - `"private_key"` -> akan diisi ke `GOOGLE_PRIVATE_KEY`

3. **Siapkan Folder Root di Google Drive & Atur Izin Akses:**
   - Buka [Google Drive](https://drive.google.com/) dan buat folder utama, misalnya **`Abyakta Lab Repository`** *(Catatan: Menggunakan **Shared Drive / Drive Bersama** Google Workspace sangat direkomendasikan agar kuota penyimpanan mengikuti kuota organisasi, bukan kuota pribadi Service Account)*.
   - Klik kanan folder tersebut > **Share (Bagikan)**:
     1. Tempel alamat `client_email` Service Account Anda dan beri izin **Editor** (atau **Content Manager** pada Shared Drive), lalu klik **Send/Share** (tidak perlu centang *Notify people*).
     2. Pada bagian **General access (Akses umum)**, ubah menjadi **Anyone with the link (Siapa saja yang memiliki link)** dengan peran **Viewer (Pengakses lihat-saja)** agar pengunjung publik dapat mengunduh file besar secara langsung melalui `webContentLink` dari CDN Google tanpa perlu login akun Google.
   - Buka folder tersebut di browser dan salin **Folder ID** dari URL:
     ```text
     https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz123456
                                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                            Ini adalah GOOGLE_ROOT_FOLDER_ID
     ```

---

### Tahap 2: Menjalankan secara Lokal (Opsional)

1. Salin template variabel lokal:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
2. Isi nilai `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_ROOT_FOLDER_ID`, dan `ADMIN_PIN` di dalam `.dev.vars`.
3. Instal dependensi dan jalankan simulasi penuh Cloudflare Pages + Functions:
   ```bash
   npm install
   npm run pages:dev
   ```
4. Buka `http://127.0.0.1:8788` di browser.

---

### Tahap 3: Deploy ke Cloudflare Pages & Mengisi Environment Variables

1. **Push Kode ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Abyakta Lab Repository"
   git branch -M main
   git remote add origin https://github.com/<username-anda>/abyakta-lab-repository.git
   git push -u origin main
   ```

2. **Buat Project Baru di Cloudflare Pages:**
   - Masuk ke [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Compute (Workers & Pages)** > **Create** > pilih tab **Pages** > **Connect to Git**.
   - Pilih repositori GitHub `abyakta-lab-repository`.
   - Atur **Build settings**:
     - **Project name:** `abyakta-lab-repository`
     - **Production branch:** `main`
     - **Framework preset:** `Vite`
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`

3. **Isi Environment Variables (Secrets):**
   - Masuk ke proyek Pages Anda > **Settings > Environment variables** (tambahkan untuk **Production** dan **Preview**, serta pilih tipe **Encrypt / Secret**):
     - `GOOGLE_CLIENT_EMAIL` = nilai `client_email` dari JSON Service Account.
     - `GOOGLE_PRIVATE_KEY` = seluruh isi `private_key` dari JSON Service Account (termasuk `-----BEGIN PRIVATE KEY-----` hingga `-----END PRIVATE KEY-----`, baik dalam format `\n` maupun baris baru langsung).
     - `GOOGLE_ROOT_FOLDER_ID` = ID folder utama Google Drive Anda.
     - `ADMIN_PIN` = PIN rahasia pilihan Anda untuk membuka **Editor Mode** (contoh: `Abyakta#2026` atau PIN angka).
   - Lakukan **Retry deployment** / trigger deploy ulang pada tab **Deployments** agar variabel environment aktif di edge runtime.

---

### Tahap 4: Menghubungkan Custom Subdomain `file.abyakta-h.id` (Tanpa Mengganggu `abyakta-h.id`)

Karena proyek ini di-deploy sebagai proyek Cloudflare Pages terpisah dan ditempatkan pada subdomain `file.abyakta-h.id`, domain utama `abyakta-h.id` (beserta subdomain lain seperti `www.abyakta-h.id`) **sama sekali tidak akan terganggu**:

1. Di dalam proyek Cloudflare Pages `abyakta-lab-repository`, buka tab **Custom domains**.
2. Klik **Set up a custom domain**.
3. Ketik **`file.abyakta-h.id`** lalu klik **Continue**.
4. Cloudflare akan mendeteksi zona DNS `abyakta-h.id` di akun Anda dan menampilkan pembuatan record **CNAME** khusus hanya untuk host `file`:
   - **Type:** `CNAME`
   - **Name:** `file`
   - **Target:** `abyakta-lab-repository.pages.dev`
   - **Proxy status:** `Proxied` (awan oranye aktif)
5. Klik **Activate domain**.
6. Tunggu 1–3 menit hingga sertifikat SSL/TLS Edge diterbitkan otomatis (`Active`). Pastikan tidak ada record `A` atau `CNAME` lama yang bernama `file` sebelumnya; record `@` (`abyakta-h.id`) tidak diubah sedikit pun.
7. Buka **`https://file.abyakta-h.id`** untuk memverifikasi portal dan cek **`https://file.abyakta-h.id/api/health`** untuk memastikan seluruh variabel berstatus `"ok": true`.

