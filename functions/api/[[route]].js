/**
 * Abyakta Lab Repository — Serverless Backend API
 * Runtime: Cloudflare Pages Functions (Edge Workers Runtime)
 * Route: /api/[[route]]
 *
 * Fitur Utama:
 * - Autentikasi Service Account Google OAuth2 (JWT RS256) menggunakan Web Crypto API murni (`crypto.subtle`)
 * - Caching Access Token di memori isolate hingga mendekati kedaluwarsa
 * - Stateless HMAC-SHA256 Admin Session Token untuk Editor Mode (aman di seluruh edge isolate)
 * - Resumable Upload Session Initiator (meneruskan header `Origin` agar browser dapat upload file besar langsung ke Google Drive tanpa kena batas ukuran body Cloudflare Workers)
 *
 * Environment Variables (Cloudflare Pages Secrets):
 * - GOOGLE_CLIENT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 * - GOOGLE_ROOT_FOLDER_ID
 * - ADMIN_PIN
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const GOOGLE_DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 jam

// Cache Access Token Google per isolate untuk menghemat latency OAuth2
let cachedGoogleToken = {
  clientEmail: null,
  accessToken: null,
  expiresAt: 0,
};

const encoder = new TextEncoder();

/* ==========================================================================
 * Utilitas Base64URL & Kriptografi (Web Crypto API Murni)
 * ========================================================================== */

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64UrlEncodeBytes(bytes) {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlEncodeString(str) {
  return base64UrlEncodeBytes(encoder.encode(str));
}

function base64UrlDecodeToString(b64url) {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function timingSafeEqualBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Mengonversi PEM PKCS#8 `GOOGLE_PRIVATE_KEY` menjadi CryptoKey RSASSA-PKCS1-v1_5.
 * Mendukung format newline ter-escape (`\n`) maupun multiline langsung dari Cloudflare Dashboard.
 */
async function importServiceAccountPrivateKey(rawPem) {
  if (!rawPem || typeof rawPem !== 'string') {
    throw new Error('GOOGLE_PRIVATE_KEY belum dikonfigurasi.');
  }

  let normalized = rawPem.trim();
  // Hapus tanda kutip pembungkus jika tidak sengaja ikut tersalin dari JSON/.env
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  normalized = normalized.replace(/\\n/g, '\n');

  if (!normalized.includes('BEGIN PRIVATE KEY')) {
    throw new Error(
      'Format GOOGLE_PRIVATE_KEY tidak valid. Pastikan Anda menyalin seluruh blok "private_key" (PKCS#8 -----BEGIN PRIVATE KEY-----) dari file JSON Service Account.'
    );
  }

  const base64Body = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  let binaryString;
  try {
    binaryString = atob(base64Body);
  } catch {
    throw new Error('Gagal mendekode Base64 pada GOOGLE_PRIVATE_KEY.');
  }

  const derBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    derBytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'pkcs8',
    derBytes.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
}

/**
 * Membuat Access Token Google OAuth2:
 * - Prioritas 1: OAuth2 Refresh Token (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_REFRESH_TOKEN`)
 *   -> Menggunakan kuota penyimpanan Google Drive pribadi milik Anda sendiri (cocok untuk @gmail.com / My Drive!).
 * - Prioritas 2: Service Account JWT RS256 (`GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY`)
 *   -> Cocok untuk folder di dalam Google Workspace Shared Drive (Drive Bersama).
 */
async function getGoogleAccessToken(env) {
  const oauthClientId = env.GOOGLE_CLIENT_ID?.trim();
  const oauthClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const oauthRefreshToken = env.GOOGLE_REFRESH_TOKEN?.trim();

  const nowMs = Date.now();

  // Mode 1: OAuth2 Refresh Token (Menggunakan kuota Google Drive akun pribadi Anda)
  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    const cacheKey = `oauth:${oauthClientId}`;
    if (
      cachedGoogleToken.accessToken &&
      cachedGoogleToken.clientEmail === cacheKey &&
      cachedGoogleToken.expiresAt > nowMs + 60_000
    ) {
      return cachedGoogleToken.accessToken;
    }

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: oauthClientId,
        client_secret: oauthClientSecret,
        refresh_token: oauthRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new HttpError(
        502,
        `Gagal menukar GOOGLE_REFRESH_TOKEN menjadi Access Token (${tokenRes.status}): ${safeParseGoogleError(errBody)}`
      );
    }

    const tokenData = await tokenRes.json();
    cachedGoogleToken = {
      clientEmail: cacheKey,
      accessToken: tokenData.access_token,
      expiresAt: nowMs + (Number(tokenData.expires_in) || 3600) * 1000,
    };

    return tokenData.access_token;
  }

  // Mode 2: Service Account JWT RS256 (Web Crypto API murni)
  const clientEmail = env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKeyPem = env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKeyPem) {
    throw new HttpError(
      500,
      'Konfigurasi kredensial Google belum lengkap: isi (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) untuk My Drive pribadi, atau (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY) untuk Shared Drive.'
    );
  }

  if (
    cachedGoogleToken.accessToken &&
    cachedGoogleToken.clientEmail === clientEmail &&
    cachedGoogleToken.expiresAt > nowMs + 60_000
  ) {
    return cachedGoogleToken.accessToken;
  }

  const nowSec = Math.floor(nowMs / 1000);
  const jwtHeader = { alg: 'RS256', typ: 'JWT' };
  const jwtClaimSet = {
    iss: clientEmail,
    scope: GOOGLE_DRIVE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: nowSec,
    exp: nowSec + 3600,
  };

  const signingInput = `${base64UrlEncodeString(JSON.stringify(jwtHeader))}.${base64UrlEncodeString(
    JSON.stringify(jwtClaimSet)
  )}`;

  const cryptoKey = await importServiceAccountPrivateKey(privateKeyPem);
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signingInput)
  );

  const jwtAssertion = `${signingInput}.${base64UrlEncodeBytes(new Uint8Array(signatureBuffer))}`;

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtAssertion,
    }),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    throw new HttpError(
      502,
      `Gagal mendapatkan token OAuth2 Google (${tokenRes.status}): ${safeParseGoogleError(errBody)}`
    );
  }

  const tokenData = await tokenRes.json();
  cachedGoogleToken = {
    clientEmail,
    accessToken: tokenData.access_token,
    expiresAt: nowMs + (Number(tokenData.expires_in) || 3600) * 1000,
  };

  return tokenData.access_token;
}

/* ==========================================================================
 * Autentikasi Editor Mode (Stateless HMAC-SHA256 Session Token)
 * ========================================================================== */

function getAdminHmacKey(env) {
  const adminPin = env.ADMIN_PIN ? String(env.ADMIN_PIN) : '';
  if (!adminPin) {
    throw new HttpError(500, 'ADMIN_PIN belum dikonfigurasi pada Cloudflare Pages Environment Variables.');
  }
  const secretMaterial = `abyakta-editor-v1:${adminPin}:${env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_EMAIL || 'default'}`;
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secretMaterial),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function verifyPinConstantTime(inputPin, expectedPin) {
  const ephemeralKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('abyakta-pin-compare-key'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', ephemeralKey, encoder.encode(String(inputPin ?? ''))),
    crypto.subtle.sign('HMAC', ephemeralKey, encoder.encode(String(expectedPin ?? ''))),
  ]);
  return timingSafeEqualBytes(new Uint8Array(sigA), new Uint8Array(sigB));
}

async function createEditorToken(env) {
  const key = await getAdminHmacKey(env);
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    role: 'editor',
    iat: nowSec,
    exp: nowSec + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload));
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(encodedPayload));
  const encodedSig = base64UrlEncodeBytes(new Uint8Array(sigBuffer));
  return {
    token: `${encodedPayload}.${encodedSig}`,
    expiresAt: payload.exp * 1000,
  };
}

async function requireEditorAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);
  if (!match) {
    throw new HttpError(401, 'Akses ditolak: sesi Editor Mode tidak ditemukan. Silakan masukkan Admin PIN kembali.');
  }

  const [encodedPayload, encodedSig] = match[1].split('.');
  const key = await getAdminHmacKey(env);
  const expectedSigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(encodedPayload));
  const expectedSigStr = base64UrlEncodeBytes(new Uint8Array(expectedSigBuf));

  const validSig = timingSafeEqualBytes(encoder.encode(encodedSig), encoder.encode(expectedSigStr));
  if (!validSig) {
    throw new HttpError(401, 'Sesi Editor Mode tidak valid atau Admin PIN telah berubah. Silakan login ulang.');
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecodeToString(encodedPayload));
  } catch {
    throw new HttpError(401, 'Format token sesi tidak valid.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec || payload.role !== 'editor') {
    throw new HttpError(401, 'Sesi Editor Mode telah kedaluwarsa. Silakan masukkan Admin PIN kembali.');
  }

  return payload;
}

/* ==========================================================================
 * Utilitas Validasi & Respons JSON
 * ========================================================================== */

class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function isValidDriveId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{3,128}$/.test(id);
}

function getRootFolderId(env) {
  const rootId = env.GOOGLE_ROOT_FOLDER_ID?.trim();
  if (!rootId || !isValidDriveId(rootId)) {
    throw new HttpError(
      500,
      'GOOGLE_ROOT_FOLDER_ID belum dikonfigurasi atau format Folder ID tidak valid di Cloudflare Pages.'
    );
  }
  return rootId;
}

function safeParseGoogleError(rawText) {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed?.error?.message) return parsed.error.message;
    if (parsed?.error_description) return parsed.error_description;
    return rawText.slice(0, 300);
  } catch {
    return (rawText || 'Unknown error').slice(0, 300);
  }
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

/* ==========================================================================
 * Handler Endpoint API
 * ========================================================================== */

/**
 * GET /api/files?folderId=...
 * Mengambil daftar subfolder & file dari Google Drive API v3 beserta webContentLink.
 */
async function handleListFiles(request, env) {
  const url = new URL(request.url);
  const rootFolderId = getRootFolderId(env);
  const rawFolderId = url.searchParams.get('folderId')?.trim();
  const targetFolderId = !rawFolderId || rawFolderId === 'root' ? rootFolderId : rawFolderId;

  if (!isValidDriveId(targetFolderId)) {
    throw new HttpError(400, 'Parameter folderId tidak valid.');
  }

  const accessToken = await getGoogleAccessToken(env);

  const listParams = new URLSearchParams({
    q: `'${targetFolderId}' in parents and trashed = false`,
    fields:
      'nextPageToken,files(id,name,mimeType,size,modifiedTime,webContentLink,webViewLink,fileExtension,md5Checksum)',
    orderBy: 'folder,name',
    pageSize: '1000',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  // Ambil daftar isi folder (dan nama folder saat ini jika bukan root) secara paralel
  const requests = [
    fetch(`${GOOGLE_DRIVE_API}/files?${listParams.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ];

  if (targetFolderId !== rootFolderId) {
    const metaParams = new URLSearchParams({
      fields: 'id,name,mimeType',
      supportsAllDrives: 'true',
    });
    requests.push(
      fetch(`${GOOGLE_DRIVE_API}/files/${encodeURIComponent(targetFolderId)}?${metaParams.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    );
  }

  const [listRes, folderMetaRes] = await Promise.all(requests);

  if (!listRes.ok) {
    const errText = await listRes.text();
    if (listRes.status === 404) {
      throw new HttpError(
        404,
        'Folder tidak ditemukan atau belum dibagikan (Share) ke email Service Account.'
      );
    }
    throw new HttpError(
      listRes.status,
      `Google Drive API error (${listRes.status}): ${safeParseGoogleError(errText)}`
    );
  }

  const listData = await listRes.json();
  let folderName = 'Root Repository';
  if (folderMetaRes && folderMetaRes.ok) {
    const meta = await folderMetaRes.json();
    if (meta?.name) folderName = meta.name;
  }

  const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });
  const rawFiles = Array.isArray(listData.files) ? listData.files : [];

  const items = rawFiles
    .map((item) => {
      const isFolder = item.mimeType === FOLDER_MIME_TYPE;
      const directLink = isFolder
        ? null
        : item.webContentLink || `https://drive.google.com/uc?id=${encodeURIComponent(item.id)}&export=download`;

      return {
        id: item.id,
        name: item.name,
        mimeType: item.mimeType,
        isFolder,
        size: item.size ? Number(item.size) : null,
        modifiedTime: item.modifiedTime || null,
        fileExtension: item.fileExtension || null,
        md5Checksum: item.md5Checksum || null,
        webContentLink: directLink,
        webViewLink: item.webViewLink || null,
      };
    })
    .sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return collator.compare(a.name, b.name);
    });

  return jsonResponse({
    ok: true,
    folder: {
      id: targetFolderId,
      name: folderName,
      isRoot: targetFolderId === rootFolderId,
    },
    items,
  });
}

/**
 * POST /api/auth
 * Memvalidasi ADMIN_PIN dan mengembalikan token sesi Editor Mode.
 */
async function handleAuth(request, env) {
  if (!env.ADMIN_PIN) {
    throw new HttpError(500, 'ADMIN_PIN belum diatur pada Environment Variables Cloudflare Pages.');
  }

  let body;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'Body request harus berupa JSON.');
  }

  const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';
  if (!pin) {
    throw new HttpError(400, 'PIN Admin wajib diisi.');
  }

  const isMatch = await verifyPinConstantTime(pin, String(env.ADMIN_PIN).trim());
  if (!isMatch) {
    throw new HttpError(401, 'PIN Admin yang Anda masukkan salah.');
  }

  const session = await createEditorToken(env);
  return jsonResponse({
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
  });
}

/**
 * POST /api/upload-init
 * Menginisiasi Google Drive Resumable Upload Session URI untuk upload file berukuran besar langsung dari browser.
 */
async function handleUploadInit(request, env) {
  await requireEditorAuth(request, env);

  let body;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'Body request harus berupa JSON.');
  }

  const fileName = typeof body?.fileName === 'string' ? body.fileName.trim() : '';
  const mimeType =
    typeof body?.mimeType === 'string' && body.mimeType.trim()
      ? body.mimeType.trim()
      : 'application/octet-stream';
  const fileSize = body?.fileSize !== undefined ? Number(body.fileSize) : undefined;
  const rootFolderId = getRootFolderId(env);
  const rawFolderId = typeof body?.folderId === 'string' ? body.folderId.trim() : '';
  const targetFolderId = !rawFolderId || rawFolderId === 'root' ? rootFolderId : rawFolderId;

  if (!fileName) {
    throw new HttpError(400, 'Nama file tidak boleh kosong.');
  }
  if (!isValidDriveId(targetFolderId)) {
    throw new HttpError(400, 'Target folderId tidak valid.');
  }
  if (fileSize !== undefined && (!Number.isFinite(fileSize) || fileSize < 0)) {
    throw new HttpError(400, 'Ukuran file (fileSize) tidak valid.');
  }

  const accessToken = await getGoogleAccessToken(env);

  // PENTING: Teruskan header `Origin` dari browser ke Google Drive API agar Google menyertakan
  // header `Access-Control-Allow-Origin` pada Resumable Session URI yang dikembalikan.
  const requestOrigin = request.headers.get('Origin') || new URL(request.url).origin;

  const initHeaders = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Upload-Content-Type': mimeType,
    Origin: requestOrigin,
  };

  if (fileSize !== undefined) {
    initHeaders['X-Upload-Content-Length'] = String(Math.floor(fileSize));
  }

  const uploadParams = new URLSearchParams({
    uploadType: 'resumable',
    supportsAllDrives: 'true',
    fields: 'id,name,mimeType,size,modifiedTime,webContentLink,webViewLink',
  });

  const initRes = await fetch(`${GOOGLE_DRIVE_UPLOAD_API}/files?${uploadParams.toString()}`, {
    method: 'POST',
    headers: initHeaders,
    body: JSON.stringify({
      name: fileName,
      parents: [targetFolderId],
    }),
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    const parsedErr = safeParseGoogleError(errText);
    if (initRes.status === 403 && parsedErr.toLowerCase().includes('storagequotaexceeded')) {
      throw new HttpError(
        403,
        'Kuota penyimpanan Service Account penuh atau dibatasi oleh Google (storageQuotaExceeded). Pastikan folder target berada di Shared Drive atau akun memiliki kuota Drive yang memadai.'
      );
    }
    throw new HttpError(
      initRes.status,
      `Gagal menginisiasi sesi Resumable Upload (${initRes.status}): ${parsedErr}`
    );
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) {
    throw new HttpError(502, 'Google Drive API tidak mengembalikan header Location untuk Resumable Upload.');
  }

  return jsonResponse({
    ok: true,
    uploadUrl,
    folderId: targetFolderId,
  });
}

/**
 * POST /api/folders
 * Membuat subfolder baru di Google Drive API v3.
 */
async function handleCreateFolder(request, env) {
  await requireEditorAuth(request, env);

  let body;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'Body request harus berupa JSON.');
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const rootFolderId = getRootFolderId(env);
  const rawParentId = typeof (body?.parentId ?? body?.folderId) === 'string'
    ? (body.parentId ?? body.folderId).trim()
    : '';
  const targetParentId = !rawParentId || rawParentId === 'root' ? rootFolderId : rawParentId;

  if (!name) {
    throw new HttpError(400, 'Nama folder tidak boleh kosong.');
  }
  if (name.length > 200) {
    throw new HttpError(400, 'Nama folder terlalu panjang (maksimal 200 karakter).');
  }
  if (!isValidDriveId(targetParentId)) {
    throw new HttpError(400, 'Parent folderId tidak valid.');
  }

  const accessToken = await getGoogleAccessToken(env);

  const params = new URLSearchParams({
    supportsAllDrives: 'true',
    fields: 'id,name,mimeType,modifiedTime',
  });

  const createRes = await fetch(`${GOOGLE_DRIVE_API}/files?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME_TYPE,
      parents: [targetParentId],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new HttpError(
      createRes.status,
      `Gagal membuat folder baru (${createRes.status}): ${safeParseGoogleError(errText)}`
    );
  }

  const created = await createRes.json();
  return jsonResponse(
    {
      ok: true,
      folder: {
        id: created.id,
        name: created.name,
        mimeType: created.mimeType,
        isFolder: true,
        size: null,
        modifiedTime: created.modifiedTime || new Date().toISOString(),
      },
    },
    201
  );
}

/**
 * DELETE /api/files/:id  (dan alias POST/DELETE /api/delete)
 * Memindahkan file atau folder ke Trash di Google Drive API v3.
 */
async function handleDeleteItem(request, env, routeId = null) {
  await requireEditorAuth(request, env);

  let targetId = routeId;
  if (!targetId) {
    const url = new URL(request.url);
    targetId = url.searchParams.get('id')?.trim() || null;
    if (!targetId && request.headers.get('Content-Type')?.includes('application/json')) {
      try {
        const body = await request.json();
        if (typeof body?.id === 'string') targetId = body.id.trim();
      } catch {
        // Abaikan jika body kosong
      }
    }
  }

  if (!targetId || !isValidDriveId(targetId)) {
    throw new HttpError(400, 'ID file atau folder yang akan dihapus tidak valid.');
  }

  const rootFolderId = getRootFolderId(env);
  if (targetId === rootFolderId) {
    throw new HttpError(400, 'Root folder utama repositori tidak boleh dihapus.');
  }

  const accessToken = await getGoogleAccessToken(env);
  const params = new URLSearchParams({ supportsAllDrives: 'true' });

  const trashRes = await fetch(
    `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(targetId)}?${params.toString()}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ trashed: true }),
    }
  );

  if (!trashRes.ok) {
    const errText = await trashRes.text();
    const parsedErr = safeParseGoogleError(errText);
    if (trashRes.status === 403) {
      throw new HttpError(
        403,
        `Izin ditolak oleh Google Drive: Service Account hanya dapat menghapus item yang diunggah melalui portal atau item di dalam Shared Drive (${parsedErr}).`
      );
    }
    throw new HttpError(trashRes.status, `Gagal menghapus item (${trashRes.status}): ${parsedErr}`);
  }

  return jsonResponse({
    ok: true,
    deletedId: targetId,
  });
}

/**
 * GET /api/health
 * Memeriksa kesiapan variabel environment tanpa membocorkan nilai rahasia.
 */
function handleHealth(env) {
  const hasOAuth =
    Boolean(env.GOOGLE_CLIENT_ID?.trim()) &&
    Boolean(env.GOOGLE_CLIENT_SECRET?.trim()) &&
    Boolean(env.GOOGLE_REFRESH_TOKEN?.trim());
  const hasServiceAccount =
    Boolean(env.GOOGLE_CLIENT_EMAIL?.trim()) &&
    Boolean(env.GOOGLE_PRIVATE_KEY?.includes('PRIVATE KEY'));

  const checks = {
    authMode: hasOAuth ? 'oauth_refresh_token' : hasServiceAccount ? 'service_account' : 'unconfigured',
    GOOGLE_AUTH_CONFIGURED: hasOAuth || hasServiceAccount,
    GOOGLE_ROOT_FOLDER_ID: isValidDriveId(env.GOOGLE_ROOT_FOLDER_ID?.trim()),
    ADMIN_PIN: Boolean(env.ADMIN_PIN && String(env.ADMIN_PIN).trim().length > 0),
  };
  const ready = checks.GOOGLE_AUTH_CONFIGURED && checks.GOOGLE_ROOT_FOLDER_ID && checks.ADMIN_PIN;
  return jsonResponse({ ok: ready, checks }, ready ? 200 : 503);
}

/* ==========================================================================
 * Entrypoint Cloudflare Pages Functions
 * ========================================================================== */

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();

  // Dukungan preflight CORS jika diperlukan
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const segments = Array.isArray(params.route)
    ? params.route.filter(Boolean)
    : typeof params.route === 'string'
      ? params.route.split('/').filter(Boolean)
      : [];

  try {
    // GET /api/health
    if (segments.length === 1 && segments[0] === 'health' && method === 'GET') {
      return handleHealth(env);
    }

    // GET /api/files
    if (segments.length === 1 && segments[0] === 'files' && method === 'GET') {
      return await handleListFiles(request, env);
    }

    // DELETE /api/files/:id
    if (segments.length === 2 && segments[0] === 'files' && method === 'DELETE') {
      return await handleDeleteItem(request, env, segments[1]);
    }

    // Alias: DELETE atau POST /api/delete
    if (segments.length === 1 && segments[0] === 'delete' && (method === 'DELETE' || method === 'POST')) {
      return await handleDeleteItem(request, env, null);
    }

    // POST /api/auth
    if (segments.length === 1 && segments[0] === 'auth' && method === 'POST') {
      return await handleAuth(request, env);
    }

    // POST /api/upload-init
    if (segments.length === 1 && segments[0] === 'upload-init' && method === 'POST') {
      return await handleUploadInit(request, env);
    }

    // POST /api/folders
    if (segments.length === 1 && segments[0] === 'folders' && method === 'POST') {
      return await handleCreateFolder(request, env);
    }

    return jsonResponse(
      {
        ok: false,
        error: `Endpoint tidak ditemukan: ${method} /api/${segments.join('/')}`,
      },
      404
    );
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ ok: false, error: err.message, details: err.details }, err.status);
    }
    console.error('[Abyakta API Unhandled Error]', err);
    return jsonResponse(
      {
        ok: false,
        error: err?.message || 'Terjadi kesalahan internal pada server.',
      },
      500
    );
  }
}

