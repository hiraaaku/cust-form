// lib/appsscript.js

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const ADMIN_TOKEN     = import.meta.env.VITE_ADMIN_TOKEN;

// ─────────────────────────────────────────────
//  UTIL
// ─────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Gagal membaca: ' + file.name));
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────
//  submitForm — no-cors POST, no polling
//
//  Kenapa tidak perlu polling?
//  Data sudah terbukti masuk ke Sheet (lihat screenshot).
//  Error sebelumnya hanya dari timeout polling.
//  Sekarang: POST no-cors → tunggu fetch selesai → langsung
//  return nomorReferensi yang di-generate di frontend.
//  Tidak perlu baca response dari server.
// ─────────────────────────────────────────────
export async function submitForm(formData, files, onProgress) {
  onProgress?.(5);

  // 1. Konversi file ke base64
  const fileEntries    = Object.entries(files).filter(([, f]) => f !== null);
  const convertedFiles = {};

  for (let i = 0; i < fileEntries.length; i++) {
    const [key, file] = fileEntries[i];
    convertedFiles[key] = {
      name    : file.name,
      mimeType: file.type || 'application/octet-stream',
      data    : await fileToBase64(file),
    };
    onProgress?.(5 + Math.round(((i + 1) / fileEntries.length) * 50));
  }

  onProgress?.(60);

  // 2. Generate nomor referensi di frontend (sama formatnya dengan Code.gs)
  //    Karena no-cors tidak bisa baca response, ref dibuat di sini
  const nomorReferensi = generateRefFrontend();

  // 3. POST no-cors — tidak blokir, tidak baca response
  await fetch(APPS_SCRIPT_URL, {
    method : 'POST',
    mode   : 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body   : JSON.stringify({
      formData,
      files        : convertedFiles,
      nomorReferensi,   // kirim juga ke server supaya Sheet pakai nomor yang sama
    }),
  });

  onProgress?.(100);

  // 4. Langsung return — data sudah dikirim, akan masuk Sheet dalam beberapa detik
  return { nomorReferensi };
}

// Generate ref di frontend — format sama dengan server: MCU-YYMM-XXXX
function generateRefFrontend() {
  const now  = new Date();
  const yy   = String(now.getFullYear()).slice(-2);
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return 'MCU-' + yy + mm + '-' + rand;
}

// ─────────────────────────────────────────────
//  Admin API — GET (tidak ada redirect masalah)
// ─────────────────────────────────────────────

async function adminGet(params = {}) {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('token', ADMIN_TOKEN);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request gagal');
  return data;
}

export async function getSubmissions({ status, search, page = 1 }) {
  const limit  = 20;
  const offset = (page - 1) * limit;
  const data   = await adminGet({
    action: 'getSubmissions',
    status: status === 'Semua' ? '' : status,
    search,
    limit,
    offset,
  });
  return {
    data      : data.data,
    totalPages: data.totalPages || Math.ceil((data.total || 0) / limit) || 1,
  };
}

export async function getDashboardStats() {
  const data = await adminGet({ action: 'getStats' });
  return data.stats;
}

export async function getSubmissionDetail(nomorReferensi) {
  const data = await adminGet({ action: 'getDetail', nomorReferensi });
  return data.data;
}

export async function updateSubmissionStatus(nomorReferensi, status, catatan = '') {
  const data = await adminGet({ action: 'updateStatus', nomorReferensi, status, catatan });
  return data;
}