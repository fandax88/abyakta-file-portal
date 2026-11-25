const TOKEN_KEY = 'abyakta_editor_token';
const TOKEN_EXP_KEY = 'abyakta_editor_exp';

/**
 * Mengambil token sesi Editor Mode yang masih aktif dari sessionStorage.
 */
export function getStoredEditorToken() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const exp = Number(sessionStorage.getItem(TOKEN_EXP_KEY) || 0);
    if (!token) return null;
    if (exp && Date.now() >= exp) {
      clearStoredEditorToken();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function saveEditorToken(token, expiresAt) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    if (expiresAt) {
      sessionStorage.setItem(TOKEN_EXP_KEY, String(expiresAt));
    }
  } catch {
    // Abaikan jika mode privasi ketat memblokir storage
  }
}

export function clearStoredEditorToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
  } catch {
    // Abaikan
  }
}

async function parseApiJson(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      res.ok
        ? 'Respons server bukan format JSON yang valid.'
        : `Server mengembalikan status ${res.status}. Pastikan Cloudflare Pages Functions sudah berjalan.`
    );
  }

  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error || `Permintaan gagal dengan kode status ${res.status}.`);
    err.status = res.status;
    throw err;
  }

  return data;
}

/**
 * Mengambil daftar folder & file dari /api/files?folderId=...
 */
export async function fetchFolderContents(folderId = 'root', signal) {
  const params = new URLSearchParams();
  if (folderId && folderId !== 'root') {
    params.set('folderId', folderId);
  }
  const query = params.toString();
  const res = await fetch(`/api/files${query ? `?${query}` : ''}`, {
    method: 'GET',
    signal,
  });
  return parseApiJson(res);
}

/**
 * Memverifikasi PIN Admin melalui POST /api/auth
 */
export async function authenticateEditorPin(pin) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  const data = await parseApiJson(res);
  saveEditorToken(data.token, data.expiresAt);
  return data;
}

/**
 * Membuat subfolder baru melalui POST /api/folders
 */
export async function createDriveFolder({ name, parentId, token }) {
  const res = await fetch('/api/folders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, parentId }),
  });
  return parseApiJson(res);
}

/**
 * Menghapus file/folder (pindah ke Trash) melalui DELETE /api/files/:id
 */
export async function deleteDriveItem({ id, token }) {
  const res = await fetch(`/api/files/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiJson(res);
}

/**
 * Menginisiasi Resumable Upload URI via backend /api/upload-init,
 * lalu mengunggah file langsung dari browser ke Google Drive API dengan progress bar real-time
 * serta dukungan pemulihan otomatis (auto-resume) jika koneksi sempat terputus.
 */
export function uploadFileResumable({ file, folderId, token, onProgress }) {
  let activeXhr = null;
  let aborted = false;

  const promise = (async () => {
    // Tahap 1: Minta Resumable Upload Session URI dari backend Cloudflare Pages Functions
    const initRes = await fetch('/api/upload-init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        folderId: folderId || 'root',
      }),
    });

    const { uploadUrl } = await parseApiJson(initRes);
    if (aborted) {
      const abortErr = new Error('Upload dibatalkan oleh pengguna.');
      abortErr.isAborted = true;
      throw abortErr;
    }

    // Tahap 2: Streaming file langsung dari disk browser ke Google Drive API
    const startedAt = Date.now();

    const sendSlice = (startByte = 0) =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        activeXhr = xhr;

        xhr.open('PUT', uploadUrl, true);
        const contentType = file.type || 'application/octet-stream';
        xhr.setRequestHeader('Content-Type', contentType);

        const slice = startByte > 0 ? file.slice(startByte) : file;
        if (startByte > 0 && file.size > 0) {
          xhr.setRequestHeader('Content-Range', `bytes ${startByte}-${file.size - 1}/${file.size}`);
        }

        xhr.upload.onprogress = (event) => {
          if (!onProgress) return;
          const total = file.size || event.total || 1;
          const loaded = Math.min(startByte + event.loaded, total);
          const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 100;
          const elapsedSec = Math.max((Date.now() - startedAt) / 1000, 0.2);
          const speedBps = loaded / elapsedSec;
          const remainingBytes = Math.max(total - loaded, 0);
          const etaSeconds = speedBps > 0 ? remainingBytes / speedBps : Infinity;

          onProgress({
            loaded,
            total,
            percent,
            speedBps,
            etaSeconds,
          });
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            let uploadedMeta = null;
            try {
              uploadedMeta = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            } catch {
              uploadedMeta = null;
            }
            resolve(uploadedMeta);
          } else {
            reject(
              new Error(
                `Upload ke Google Drive gagal (HTTP ${xhr.status}): ${
                  xhr.responseText?.slice(0, 180) || xhr.statusText
                }`
              )
            );
          }
        };

        xhr.onerror = () => {
          const netErr = new Error('Koneksi jaringan terputus saat mengunggah ke Google Drive.');
          netErr.isNetworkError = true;
          reject(netErr);
        };

        xhr.onabort = () => {
          const abortErr = new Error('Upload dibatalkan oleh pengguna.');
          abortErr.isAborted = true;
          reject(abortErr);
        };

        xhr.send(slice);
      });

    // Query offset byte terakhir dari Google jika perlu melanjutkan upload yang terputus
    const queryUploadedOffset = () =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        activeXhr = xhr;
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Range', `bytes */${file.size}`);
        xhr.onload = () => {
          if (xhr.status === 308) {
            const rangeHeader = xhr.getResponseHeader('Range');
            if (rangeHeader) {
              const match = rangeHeader.match(/bytes=0-(\d+)/);
              if (match) {
                resolve(Number(match[1]) + 1);
                return;
              }
            }
            resolve(0);
          } else if (xhr.status >= 200 && xhr.status < 300) {
            resolve(file.size);
          } else {
            reject(new Error(`Gagal memeriksa status resume upload (HTTP ${xhr.status}).`));
          }
        };
        xhr.onerror = () => reject(new Error('Gagal memeriksa status sesi upload.'));
        xhr.onabort = () => {
          const abortErr = new Error('Upload dibatalkan oleh pengguna.');
          abortErr.isAborted = true;
          reject(abortErr);
        };
        xhr.send();
      });

    let attempt = 0;
    let offset = 0;
    const maxRetries = 2;

    while (true) {
      try {
        return await sendSlice(offset);
      } catch (err) {
        if (err.isAborted || aborted || !err.isNetworkError || attempt >= maxRetries || file.size === 0) {
          throw err;
        }
        attempt += 1;
        await new Promise((r) => setTimeout(r, 1200 * attempt));
        offset = await queryUploadedOffset();
        if (offset >= file.size) {
          return null;
        }
      }
    }
  })();

  return {
    promise,
    abort: () => {
      aborted = true;
      if (activeXhr) {
        activeXhr.abort();
      }
    },
  };
}

