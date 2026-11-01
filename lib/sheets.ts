/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Google Sheets API Wrapper
 * 
 * Modul ini menangani operasi CRUD ke Google Sheets (Nama Sheet: EDULOG_DATABASE).
 * Menggunakan googleapis dengan otentikasi Google Service Account.
 * Menyediakan fallback penyimpanan memori cerdas jika kredensial .env.local belum diisi.
 */

import { google, sheets_v4 } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { STRUKTUR_DATABASE, PENGATURAN_DEFAULT } from './constants.ts';
import { getTanggalHariIni, getTimestamp } from './utils.ts';

// Pastikan environment termuat
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

let cachedSheetsClient: sheets_v4.Sheets | null = null;
let isConfiguredCheck: boolean | null = null;

/**
 * Memeriksa apakah kredensial Google Sheets telah dikonfigurasi dengan benar di environment
 */
export function isGoogleSheetsConfigured(): boolean {
  if (isConfiguredCheck !== null) return isConfiguredCheck;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  const isValid = Boolean(
    email &&
    privateKey &&
    sheetId &&
    !email.includes('nama-project-anda') &&
    !sheetId.includes('1AbCdEfGhIjKlMnOpQrStUvWxYz')
  );

  isConfiguredCheck = isValid;
  return isValid;
}

/**
 * Inisialisasi klien Google Sheets v4 via Service Account
 */
function getSheetsClient(): { client: sheets_v4.Sheets | null; sheetId: string | null } {
  const sheetId = process.env.GOOGLE_SHEET_ID || null;

  if (!isGoogleSheetsConfigured() || !sheetId) {
    return { client: null, sheetId: null };
  }

  if (cachedSheetsClient) {
    return { client: cachedSheetsClient, sheetId };
  }

  try {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    cachedSheetsClient = google.sheets({ version: 'v4', auth });
    return { client: cachedSheetsClient, sheetId };
  } catch (err) {
    console.warn('⚠️ Gagal menginisialisasi Google Sheets client:', err);
    return { client: null, sheetId: null };
  }
}

// =============================================================================
// REPOSITORI DATA LOKAL (FALLBACK JIKA SERVICE ACCOUNT BELUM DIHUBUNGKAN)
// Memastikan aplikasi dapat diuji coba seketika di lingkungan preview
// =============================================================================

function createInitialFallbackStore(): Record<string, Record<string, string>[]> {
  const now = getTimestamp();
  const hariIni = getTanggalHariIni();
  const passAdmin = bcrypt.hashSync('admin123', 10);
  const passGuru = bcrypt.hashSync('guru123', 10);
  const passSiswa = bcrypt.hashSync('siswa123', 10);

  return {
    USERS: [
      { id: 'USR-ADM-001', username: 'admin', password_hash: passAdmin, role: 'admin', nama: 'Administrator PIJAR', email: 'admin@pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-GRU-001', username: 'guru_budi', password_hash: passGuru, role: 'guru', nama: 'Budi Santoso, S.Pd.', email: 'budi.santoso@pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-GRU-002', username: 'guru_siti', password_hash: passGuru, role: 'guru', nama: 'Siti Aminah, S.Pd.', email: 'siti.aminah@pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-GRU-003', username: 'guru_hendra', password_hash: passGuru, role: 'guru', nama: 'Hendra Wijaya, S.Pd.', email: 'hendra.wijaya@pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-SIS-1001', username: '1001', password_hash: passSiswa, role: 'siswa', nama: 'Ahmad Fauzi', email: '1001@siswa.pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-SIS-1002', username: '1002', password_hash: passSiswa, role: 'siswa', nama: 'Aulia Rahmawati', email: '1002@siswa.pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-SIS-1003', username: '1003', password_hash: passSiswa, role: 'siswa', nama: 'Bagus Pratama', email: '1003@siswa.pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-SIS-1004', username: '1004', password_hash: passSiswa, role: 'siswa', nama: 'Cantika Dewi', email: '1004@siswa.pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-SIS-1005', username: '1005', password_hash: passSiswa, role: 'siswa', nama: 'Dimas Saputra', email: '1005@siswa.pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-SIS-1006', username: '1006', password_hash: passSiswa, role: 'siswa', nama: 'Eka Nurhaliza', email: '1006@siswa.pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-SIS-1007', username: '1007', password_hash: passSiswa, role: 'siswa', nama: 'Fajar Ramadhan', email: '1007@siswa.pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-SIS-1008', username: '1008', password_hash: passSiswa, role: 'siswa', nama: 'Gita Permata', email: '1008@siswa.pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-SIS-1009', username: '1009', password_hash: passSiswa, role: 'siswa', nama: 'Hafiz Maulana', email: '1009@siswa.pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
      { id: 'USR-SIS-1010', username: '1010', password_hash: passSiswa, role: 'siswa', nama: 'Indah Lestari', email: '1010@siswa.pijar-spenta.sch.id', aktif: 'Ya', timestamp: now },
    ],
    GURU: [
      { id: 'GRU-001', user_id: 'USR-GRU-001', nip: '198001012005011001', nama: 'Budi Santoso, S.Pd.', mapel_utama: 'Bahasa Indonesia', status: 'Aktif' },
      { id: 'GRU-002', user_id: 'USR-GRU-002', nip: '198505122010012002', nama: 'Siti Aminah, S.Pd.', mapel_utama: 'Matematika', status: 'Aktif' },
      { id: 'GRU-003', user_id: 'USR-GRU-003', nip: '199002202015021003', nama: 'Hendra Wijaya, S.Pd.', mapel_utama: 'Bahasa Inggris', status: 'Aktif' },
    ],
    SISWA: [
      { id: 'SIS-001', user_id: 'USR-SIS-1001', nis: '1001', nama: 'Ahmad Fauzi', kelas: '7A', jenis_kelamin: 'L', aktif: 'Ya', email: '1001@siswa.pijar-spenta.sch.id', foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad' },
      { id: 'SIS-002', user_id: 'USR-SIS-1002', nis: '1002', nama: 'Aulia Rahmawati', kelas: '7A', jenis_kelamin: 'P', aktif: 'Ya', email: '1002@siswa.pijar-spenta.sch.id', foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aulia' },
      { id: 'SIS-003', user_id: 'USR-SIS-1003', nis: '1003', nama: 'Bagus Pratama', kelas: '7A', jenis_kelamin: 'L', aktif: 'Ya', email: '1003@siswa.pijar-spenta.sch.id', foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bagus' },
      { id: 'SIS-004', user_id: 'USR-SIS-1004', nis: '1004', nama: 'Cantika Dewi', kelas: '7A', jenis_kelamin: 'P', aktif: 'Ya', email: '1004@siswa.pijar-spenta.sch.id', foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cantika' },
      { id: 'SIS-005', user_id: 'USR-SIS-1005', nis: '1005', nama: 'Dimas Saputra', kelas: '7A', jenis_kelamin: 'L', aktif: 'Ya', email: '1005@siswa.pijar-spenta.sch.id', foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dimas' },
      { id: 'SIS-006', user_id: 'USR-SIS-1006', nis: '1006', nama: 'Eka Nurhaliza', kelas: '7B', jenis_kelamin: 'P', aktif: 'Ya', email: '1006@siswa.pijar-spenta.sch.id', foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eka' },
      { id: 'SIS-007', user_id: 'USR-SIS-1007', nis: '1007', nama: 'Fajar Ramadhan', kelas: '7B', jenis_kelamin: 'L', aktif: 'Ya', email: '1007@siswa.pijar-spenta.sch.id', foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fajar' },
      { id: 'SIS-008', user_id: 'USR-SIS-1008', nis: '1008', nama: 'Gita Permata', kelas: '7B', jenis_kelamin: 'P', aktif: 'Ya', email: '1008@siswa.pijar-spenta.sch.id', foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gita' },
      { id: 'SIS-009', user_id: 'USR-SIS-1009', nis: '1009', nama: 'Hafiz Maulana', kelas: '8A', jenis_kelamin: 'L', aktif: 'Ya', email: '1009@siswa.pijar-spenta.sch.id', foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hafiz' },
      { id: 'SIS-010', user_id: 'USR-SIS-1010', nis: '1010', nama: 'Indah Lestari', kelas: '8A', jenis_kelamin: 'P', aktif: 'Ya', email: '1010@siswa.pijar-spenta.sch.id', foto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Indah' },
    ],
    KELAS: [
      { id: 'KLS-001', nama_kelas: '7A', tingkat: '7', wali_kelas: 'Budi Santoso, S.Pd.', tahun_ajaran: '2024/2025' },
      { id: 'KLS-002', nama_kelas: '7B', tingkat: '7', wali_kelas: 'Siti Aminah, S.Pd.', tahun_ajaran: '2024/2025' },
      { id: 'KLS-003', nama_kelas: '8A', tingkat: '8', wali_kelas: 'Hendra Wijaya, S.Pd.', tahun_ajaran: '2024/2025' },
    ],
    MAPEL: [
      { id: 'MPL-001', kode: 'BIN-7', nama_mapel: 'Bahasa Indonesia', guru_id: 'GRU-001', kelas_diampu: '7A, 7B' },
      { id: 'MPL-002', kode: 'MAT-7', nama_mapel: 'Matematika', guru_id: 'GRU-002', kelas_diampu: '7A, 7B' },
      { id: 'MPL-003', kode: 'BIG-7', nama_mapel: 'Bahasa Inggris', guru_id: 'GRU-003', kelas_diampu: '7A, 8A' },
    ],
    PENUGASAN: [
      { id: 'TSK-001', mapel_id: 'MPL-001', target_kelas: '7A', target_siswa: 'Semua', judul: 'Menganalisis Teks Deskripsi', deskripsi: 'Bacalah teks deskripsi hal 14-16, kemudian buat rangkuman ide pokok serta kata kunci.', deadline: '2025-01-20', guru_id: 'GRU-001', timestamp: now },
      { id: 'TSK-002', mapel_id: 'MPL-002', target_kelas: '7A', target_siswa: 'Semua', judul: 'Latihan Aljabar Dasar', deskripsi: 'Kerjakan soal no. 1-10 di buku tugas matematika, kumpulkan dalam bentuk lembar kerja.', deadline: '2025-01-25', guru_id: 'GRU-002', timestamp: now },
      { id: 'TSK-003', mapel_id: 'MPL-003', target_kelas: '7A', target_siswa: 'Semua', judul: 'Vocabulary List: Daily Routine', deskripsi: 'Buat 20 kosakata baru tentang daily activities beserta contoh kalimat present tense.', deadline: '2025-01-22', guru_id: 'GRU-003', timestamp: now },
    ],
    KEHADIRAN: [
      { id: 'ABS-001', tanggal: hariIni, nis: '1001', nama: 'Ahmad Fauzi', kelas: '7A', mapel: 'Bahasa Indonesia', topik: 'Teks Deskripsi', status: 'H', guru: 'Budi Santoso, S.Pd.', timestamp: now },
      { id: 'ABS-002', tanggal: hariIni, nis: '1002', nama: 'Aulia Rahmawati', kelas: '7A', mapel: 'Bahasa Indonesia', topik: 'Teks Deskripsi', status: 'H', guru: 'Budi Santoso, S.Pd.', timestamp: now },
      { id: 'ABS-003', tanggal: hariIni, nis: '1003', nama: 'Bagus Pratama', kelas: '7A', mapel: 'Bahasa Indonesia', topik: 'Teks Deskripsi', status: 'S', guru: 'Budi Santoso, S.Pd.', timestamp: now },
      { id: 'ABS-004', tanggal: hariIni, nis: '1004', nama: 'Cantika Dewi', kelas: '7A', mapel: 'Bahasa Indonesia', topik: 'Teks Deskripsi', status: 'H', guru: 'Budi Santoso, S.Pd.', timestamp: now },
      { id: 'ABS-005', tanggal: hariIni, nis: '1005', nama: 'Dimas Saputra', kelas: '7A', mapel: 'Bahasa Indonesia', topik: 'Teks Deskripsi', status: 'I', guru: 'Budi Santoso, S.Pd.', timestamp: now },
    ],
    NILAI: [
      { id: 'NIL-001', tanggal: hariIni, nis: '1001', nama: 'Ahmad Fauzi', kelas: '7A', mapel: 'Bahasa Indonesia', jenis_nilai: 'Formatif 1', nilai: '85', guru: 'Budi Santoso, S.Pd.', timestamp: now },
      { id: 'NIL-002', tanggal: hariIni, nis: '1002', nama: 'Aulia Rahmawati', kelas: '7A', mapel: 'Bahasa Indonesia', jenis_nilai: 'Formatif 1', nilai: '90', guru: 'Budi Santoso, S.Pd.', timestamp: now },
      { id: 'NIL-003', tanggal: hariIni, nis: '1003', nama: 'Bagus Pratama', kelas: '7A', mapel: 'Bahasa Indonesia', jenis_nilai: 'Formatif 1', nilai: '78', guru: 'Budi Santoso, S.Pd.', timestamp: now },
      { id: 'NIL-004', tanggal: hariIni, nis: '1004', nama: 'Cantika Dewi', kelas: '7A', mapel: 'Bahasa Indonesia', jenis_nilai: 'Formatif 1', nilai: '88', guru: 'Budi Santoso, S.Pd.', timestamp: now },
      { id: 'NIL-005', tanggal: hariIni, nis: '1005', nama: 'Dimas Saputra', kelas: '7A', mapel: 'Bahasa Indonesia', jenis_nilai: 'Formatif 1', nilai: '82', guru: 'Budi Santoso, S.Pd.', timestamp: now },
    ],
    CATATAN: [
      { id: 'CAT-001', tanggal: hariIni, nis: '1001', nama: 'Ahmad Fauzi', kelas: '7A', mapel: 'Bahasa Indonesia', jenis: 'Positif', keterangan: 'Aktif membantu teman memahami materi saat diskusi kelompok', nilai_deskripsi: 'Sangat Baik', guru: 'Budi Santoso, S.Pd.', timestamp: now },
      { id: 'CAT-002', tanggal: hariIni, nis: '1003', nama: 'Bagus Pratama', kelas: '7A', mapel: 'Bahasa Indonesia', jenis: 'Positif', keterangan: 'Menunjukkan peningkatan minat baca dan ketertiban', nilai_deskripsi: 'Baik', guru: 'Budi Santoso, S.Pd.', timestamp: now },
      { id: 'CAT-003', tanggal: hariIni, nis: '1005', nama: 'Dimas Saputra', kelas: '7A', mapel: 'Bahasa Indonesia', jenis: 'Negatif', keterangan: 'Lupa membawa buku catatan saat KBM berlangsung', nilai_deskripsi: 'Cukup - Perlu Pembinaan', guru: 'Budi Santoso, S.Pd.', timestamp: now },
    ],
    PENGATURAN: Object.entries(PENGATURAN_DEFAULT).map(([key, value]) => ({ key, value })),
  };
}

// Global fallback in-memory store
const globalStore = (globalThis as any).__PIJAR_STORE__ || createInitialFallbackStore();
(globalThis as any).__PIJAR_STORE__ = globalStore;

// =============================================================================
// FUNGSI CRUD GOOGLE SHEETS UTAMA
// =============================================================================

/**
 * Membaca semua baris data dari sebuah sheet sebagai array object key-value
 * Baris 1 di Google Sheet digunakan sebagai nama properti object
 */
export async function readSheet<T = Record<string, string>>(sheetName: string): Promise<T[]> {
  const { client, sheetId } = getSheetsClient();

  if (!client || !sheetId) {
    // Mode offline / fallback
    const rows = (globalStore[sheetName] || []) as T[];
    return JSON.parse(JSON.stringify(rows));
  }

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:Z`,
    });

    const values = response.data.values;
    if (!values || values.length <= 1) {
      return [];
    }

    const headers = values[0] as string[];
    const dataRows = values.slice(1);

    const result = dataRows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined && row[index] !== null ? String(row[index]) : '';
      });
      return obj as unknown as T;
    });

    return result;
  } catch (error) {
    console.error(`Gagal membaca sheet [${sheetName}]:`, error);
    // Fallback jika terjadi kendala jaringan
    const rows = (globalStore[sheetName] || []) as T[];
    return JSON.parse(JSON.stringify(rows));
  }
}

/**
 * Menambahkan satu baris baru ke akhir sheet
 */
export async function appendRow(
  sheetName: string,
  rowData: Record<string, any>
): Promise<boolean> {
  const { client, sheetId } = getSheetsClient();

  // Dapatkan urutan header kolom sesuai STRUKTUR_DATABASE
  const def = STRUKTUR_DATABASE[sheetName];
  const headers = def ? def.headers : Object.keys(rowData);

  // Bentuk array baris sesuai urutan header
  const rowValues = headers.map((header) => {
    const val = rowData[header];
    return val !== undefined && val !== null ? String(val) : '';
  });

  // Selalu simpan juga ke fallback store agar sinkron
  if (!globalStore[sheetName]) globalStore[sheetName] = [];
  globalStore[sheetName].push({ ...rowData });

  if (!client || !sheetId) {
    return true;
  }

  try {
    await client.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowValues],
      },
    });
    return true;
  } catch (error) {
    console.error(`Gagal appendRow ke sheet [${sheetName}]:`, error);
    return false;
  }
}

/**
 * Memperbarui data pada baris yang memiliki id tertentu
 */
export async function updateRow(
  sheetName: string,
  idOrKey: string,
  updatedData: Record<string, any>,
  keyColumn: string = 'id'
): Promise<boolean> {
  const { client, sheetId } = getSheetsClient();

  // Update di local fallback store
  if (globalStore[sheetName]) {
    const index = globalStore[sheetName].findIndex((r: any) => String(r[keyColumn]) === String(idOrKey));
    if (index !== -1) {
      globalStore[sheetName][index] = { ...globalStore[sheetName][index], ...updatedData };
    }
  }

  if (!client || !sheetId) {
    return true;
  }

  try {
    // Ambil seluruh data untuk mengetahui nomor baris
    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:Z`,
    });

    const values = response.data.values;
    if (!values || values.length <= 1) return false;

    const headers = values[0] as string[];
    const keyColIndex = headers.indexOf(keyColumn);
    if (keyColIndex === -1) return false;

    let targetRowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][keyColIndex]) === String(idOrKey)) {
        targetRowIndex = i + 1; // 1-based index di Google Sheets
        break;
      }
    }

    if (targetRowIndex === -1) {
      console.warn(`Data dengan ${keyColumn}='${idOrKey}' tidak ditemukan di [${sheetName}]`);
      return false;
    }

    // Ambil baris yang ada dan gabungkan dengan nilai baru
    const currentRow = values[targetRowIndex - 1] || [];
    const newRow = headers.map((header, idx) => {
      if (updatedData[header] !== undefined) {
        return String(updatedData[header]);
      }
      return currentRow[idx] !== undefined ? String(currentRow[idx]) : '';
    });

    const endColLetter = String.fromCharCode(64 + headers.length);
    const range = `${sheetName}!A${targetRowIndex}:${endColLetter}${targetRowIndex}`;

    await client.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    return true;
  } catch (error) {
    console.error(`Gagal updateRow di sheet [${sheetName}]:`, error);
    return false;
  }
}

/**
 * Menghapus baris berdasarkan ID atau Key
 */
export async function deleteRow(
  sheetName: string,
  idOrKey: string,
  keyColumn: string = 'id'
): Promise<boolean> {
  const { client, sheetId } = getSheetsClient();

  // Hapus dari local fallback store
  if (globalStore[sheetName]) {
    globalStore[sheetName] = globalStore[sheetName].filter(
      (r: any) => String(r[keyColumn]) !== String(idOrKey)
    );
  }

  if (!client || !sheetId) {
    return true;
  }

  try {
    // Cari index baris pada Google Sheets
    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:Z`,
    });

    const values = response.data.values;
    if (!values || values.length <= 1) return false;

    const headers = values[0] as string[];
    const keyColIndex = headers.indexOf(keyColumn);
    if (keyColIndex === -1) return false;

    let targetRowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][keyColIndex]) === String(idOrKey)) {
        targetRowIndex = i; // 0-based index baris data (baris 1 = 0, baris 2 = 1, dst)
        break;
      }
    }

    if (targetRowIndex === -1) return false;

    // Dapatkan sheetId numerik dari spreadsheet metadata
    const spreadsheetInfo = await client.spreadsheets.get({ spreadsheetId: sheetId });
    const targetSheet = spreadsheetInfo.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    );

    const numericSheetId = targetSheet?.properties?.sheetId;
    if (numericSheetId === undefined) return false;

    // Hapus baris secara atomik menggunakan batchUpdate deleteDimension
    await client.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: numericSheetId,
                dimension: 'ROWS',
                startIndex: targetRowIndex,
                endIndex: targetRowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return true;
  } catch (error) {
    console.error(`Gagal deleteRow di sheet [${sheetName}]:`, error);
    return false;
  }
}

// =============================================================================
// FUNGSI PENGATURAN SEKOLAH (SHEET: PENGATURAN)
// =============================================================================

/**
 * Mendapatkan seluruh konfigurasi sekolah sebagai object key-value
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await readSheet<{ key: string; value: string }>('PENGATURAN');
  const result: Record<string, string> = { ...PENGATURAN_DEFAULT };

  rows.forEach((row) => {
    if (row.key) {
      result[row.key] = row.value || '';
    }
  });

  return result;
}

/**
 * Mendapatkan nilai pengaturan tertentu
 */
export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  const all = await getAllSettings();
  return all[key] !== undefined ? all[key] : defaultValue;
}

/**
 * Memperbarui nilai sebuah kunci pengaturan
 */
export async function updateSetting(key: string, value: string): Promise<boolean> {
  const rows = await readSheet<{ key: string; value: string }>('PENGATURAN');
  const existing = rows.find((r) => r.key === key);

  if (existing) {
    return await updateRow('PENGATURAN', key, { key, value }, 'key');
  } else {
    return await appendRow('PENGATURAN', { key, value });
  }
}
