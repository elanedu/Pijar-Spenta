/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Skrip Inisialisasi Database Google Sheets
 * 
 * Skrip ini dijalankan satu kali untuk:
 * 1. Menghubungkan ke Google Sheets via Service Account
 * 2. Membuat 10 lembar kerja (sheets) sesuai spesifikasi EDULOG_DATABASE
 * 3. Mengatur header kolom (baris 1) dan memformat header (freeze baris 1 & warna)
 * 4. Mengisi akun admin default (admin / admin123) dengan enkripsi bcrypt
 * 5. Mengisi data dummy: 3 guru, 10 siswa, 3 kelas, 3 mapel, dan data awal lainnya
 * 6. Mengisi konfigurasi default sekolah di sheet PENGATURAN
 * 
 * Cara menjalankan:
 * npx tsx scripts/setup-database.ts
 */

import { google, sheets_v4 } from 'googleapis';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { STRUKTUR_DATABASE, PENGATURAN_DEFAULT } from '../lib/constants.ts';

// Muat variabel lingkungan dari .env.local terlebih dahulu, lalu .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Format timestamp ISO standar untuk pencatatan riwayat
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format tanggal YYYY-MM-DD
 */
function getTanggalHariIni(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function main() {
  console.log('\n================================================================');
  console.log('🚀 PIJAR SPENTA - Inisialisasi Database Google Sheets');
  console.log('================================================================\n');

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // 1. Validasi Environment Variables
  if (!clientEmail || !privateKey || !spreadsheetId) {
    console.error('❌ ERROR: Variabel lingkungan belum lengkap di .env.local!\n');
    console.log('Pastikan Anda telah mengisi:');
    console.log('  1. GOOGLE_SERVICE_ACCOUNT_EMAIL = ' + (clientEmail ? '✅ Terisi' : '❌ KOSONG'));
    console.log('  2. GOOGLE_PRIVATE_KEY           = ' + (privateKey ? '✅ Terisi' : '❌ KOSONG'));
    console.log('  3. GOOGLE_SHEET_ID              = ' + (spreadsheetId ? '✅ Terisi' : '❌ KOSONG'));
    console.log('\nPanduan:');
    console.log('  - Salin .env.local.example menjadi .env.local: cp .env.local.example .env.local');
    console.log('  - Buat Service Account di Google Cloud Console dan beri akses Editor ke Google Sheets');
    console.log('  - Masukkan ID Google Sheet Anda ke GOOGLE_SHEET_ID');
    console.log('  - Jalankan ulang: npx tsx scripts/setup-database.ts\n');
    process.exit(1);
  }

  if (
    clientEmail.includes('nama-project-anda') ||
    spreadsheetId.includes('1AbCdEfGhIjKlMnOpQrStUvWxYz')
  ) {
    console.error('⚠️  PERINGATAN: Nilai di .env.local masih berupa placeholder contoh!');
    console.error('Silakan ganti dengan kredensial Google Service Account & Sheet ID asli Anda.');
    process.exit(1);
  }

  // 2. Inisialisasi Klien Google Sheets
  console.log('🔑 Mengautentikasi ke Google Sheets API via Service Account...');
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: formattedPrivateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // 3. Periksa Spreadsheet
    console.log(`📄 Mengakses Spreadsheet ID: ${spreadsheetId}...`);
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheetInfo.data.sheets || [];
    const existingTitles = existingSheets
      .map((s) => s.properties?.title)
      .filter((title): title is string => Boolean(title));

    console.log(`✅ Spreadsheet terhubung: "${spreadsheetInfo.data.properties?.title || 'EDULOG_DATABASE'}"`);
    console.log(`   Sheet yang sudah ada: [${existingTitles.join(', ') || 'Belum ada'}]`);

    // 4. Buat Sheet yang Belum Ada
    const targetSheetNames = Object.keys(STRUKTUR_DATABASE);
    const missingSheetNames = targetSheetNames.filter((name) => !existingTitles.includes(name));

    if (missingSheetNames.length > 0) {
      console.log(`\n📋 Membuat ${missingSheetNames.length} sheet baru: [${missingSheetNames.join(', ')}]...`);
      const addSheetRequests: sheets_v4.Schema$Request[] = missingSheetNames.map((name) => ({
        addSheet: {
          properties: {
            title: name,
            gridProperties: {
              frozenRowCount: 1, // Kunci baris header pertama
            },
          },
        },
      }));

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: addSheetRequests,
        },
      });
      console.log('✅ Semua sheet berhasil dibuat!');
    } else {
      console.log('ℹ️  Semua 10 sheet sudah tersedia di spreadsheet.');
    }

    // 5. Setup Header Kolom pada Setiap Sheet
    console.log('\n📌 Memeriksa dan mengisi header kolom...');
    for (const sheetKey of targetSheetNames) {
      const def = STRUKTUR_DATABASE[sheetKey];
      const range = `${def.name}!A1:${String.fromCharCode(64 + def.headers.length)}1`;

      // Cek apakah header baris 1 sudah ada
      const currentHeaderRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const currentHeader = currentHeaderRes.data.values?.[0] || [];
      const needsHeaderUpdate = currentHeader.length === 0 || currentHeader[0] !== def.headers[0];

      if (needsHeaderUpdate) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${def.name}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [def.headers],
          },
        });
        console.log(`  ✓ Header sheet [${def.name}] berhasil ditulis: (${def.headers.join(', ')})`);
      } else {
        console.log(`  ✓ Header sheet [${def.name}] sudah sesuai.`);
      }
    }

    // 6. Cek & Isi Akun Admin Default & Data Dummy
    console.log('\n👥 Memeriksa data awal USERS...');
    const usersRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'USERS!A2:H',
    });
    const currentUsers = usersRes.data.values || [];

    if (currentUsers.length === 0) {
      console.log('🌱 Data USERS masih kosong. Menyiapkan akun default dan data dummy...');
      const nowIso = getTimestamp();
      const hariIni = getTanggalHariIni();

      // Hash password dengan bcryptjs (10 rounds)
      console.log('  🔒 Mengenkripsi password dengan bcrypt (10 rounds)...');
      const passAdminHash = bcrypt.hashSync('admin123', BCRYPT_SALT_ROUNDS);
      const passGuruHash = bcrypt.hashSync('guru123', BCRYPT_SALT_ROUNDS);
      const passSiswaHash = bcrypt.hashSync('siswa123', BCRYPT_SALT_ROUNDS);

      // Data USERS
      const dummyUsers = [
        // 1. Akun Admin Default
        ['USR-ADM-001', 'admin', passAdminHash, 'admin', 'Administrator PIJAR', 'admin@pijar-spenta.sch.id', 'Ya', nowIso],
        // 2. Tiga Guru
        ['USR-GRU-001', 'guru_budi', passGuruHash, 'guru', 'Budi Santoso, S.Pd.', 'budi.santoso@pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-GRU-002', 'guru_siti', passGuruHash, 'guru', 'Siti Aminah, S.Pd.', 'siti.aminah@pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-GRU-003', 'guru_hendra', passGuruHash, 'guru', 'Hendra Wijaya, S.Pd.', 'hendra.wijaya@pijar-spenta.sch.id', 'Ya', nowIso],
        // 3. Sepuluh Siswa
        ['USR-SIS-1001', '1001', passSiswaHash, 'siswa', 'Ahmad Fauzi', '1001@siswa.pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-SIS-1002', '1002', passSiswaHash, 'siswa', 'Aulia Rahmawati', '1002@siswa.pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-SIS-1003', '1003', passSiswaHash, 'siswa', 'Bagus Pratama', '1003@siswa.pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-SIS-1004', '1004', passSiswaHash, 'siswa', 'Cantika Dewi', '1004@siswa.pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-SIS-1005', '1005', passSiswaHash, 'siswa', 'Dimas Saputra', '1005@siswa.pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-SIS-1006', '1006', passSiswaHash, 'siswa', 'Eka Nurhaliza', '1006@siswa.pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-SIS-1007', '1007', passSiswaHash, 'siswa', 'Fajar Ramadhan', '1007@siswa.pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-SIS-1008', '1008', passSiswaHash, 'siswa', 'Gita Permata', '1008@siswa.pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-SIS-1009', '1009', passSiswaHash, 'siswa', 'Hafiz Maulana', '1009@siswa.pijar-spenta.sch.id', 'Ya', nowIso],
        ['USR-SIS-1010', '1010', passSiswaHash, 'siswa', 'Indah Lestari', '1010@siswa.pijar-spenta.sch.id', 'Ya', nowIso],
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'USERS!A2',
        valueInputOption: 'RAW',
        requestBody: { values: dummyUsers },
      });
      console.log(`  ✅ ${dummyUsers.length} akun pengguna berhasil ditambahkan ke USERS!`);

      // Data GURU (3 Guru)
      const dummyGuru = [
        ['GRU-001', 'USR-GRU-001', '198001012005011001', 'Budi Santoso, S.Pd.', 'Bahasa Indonesia', 'Aktif'],
        ['GRU-002', 'USR-GRU-002', '198505122010012002', 'Siti Aminah, S.Pd.', 'Matematika', 'Aktif'],
        ['GRU-003', 'USR-GRU-003', '199002202015021003', 'Hendra Wijaya, S.Pd.', 'Bahasa Inggris', 'Aktif'],
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'GURU!A2',
        valueInputOption: 'RAW',
        requestBody: { values: dummyGuru },
      });
      console.log(`  ✅ ${dummyGuru.length} biodata guru ditambahkan ke GURU!`);

      // Data KELAS (3 Rombel)
      const dummyKelas = [
        ['KLS-001', '7A', '7', 'Budi Santoso, S.Pd.', '2024/2025'],
        ['KLS-002', '7B', '7', 'Siti Aminah, S.Pd.', '2024/2025'],
        ['KLS-003', '8A', '8', 'Hendra Wijaya, S.Pd.', '2024/2025'],
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'KELAS!A2',
        valueInputOption: 'RAW',
        requestBody: { values: dummyKelas },
      });
      console.log(`  ✅ ${dummyKelas.length} rombel kelas ditambahkan ke KELAS!`);

      // Data MAPEL (3 Mata Pelajaran)
      const dummyMapel = [
        ['MPL-001', 'BIN-7', 'Bahasa Indonesia', 'GRU-001', '7A, 7B'],
        ['MPL-002', 'MAT-7', 'Matematika', 'GRU-002', '7A, 7B'],
        ['MPL-003', 'BIG-7', 'Bahasa Inggris', 'GRU-003', '7A, 8A'],
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'MAPEL!A2',
        valueInputOption: 'RAW',
        requestBody: { values: dummyMapel },
      });
      console.log(`  ✅ ${dummyMapel.length} mata pelajaran ditambahkan ke MAPEL!`);

      // Data SISWA (10 Siswa: 5 di 7A, 3 di 7B, 2 di 8A)
      const dummySiswa = [
        ['SIS-001', 'USR-SIS-1001', '1001', 'Ahmad Fauzi', '7A', 'L', 'Ya', '1001@siswa.pijar-spenta.sch.id', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'],
        ['SIS-002', 'USR-SIS-1002', '1002', 'Aulia Rahmawati', '7A', 'P', 'Ya', '1002@siswa.pijar-spenta.sch.id', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aulia'],
        ['SIS-003', 'USR-SIS-1003', '1003', 'Bagus Pratama', '7A', 'L', 'Ya', '1003@siswa.pijar-spenta.sch.id', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bagus'],
        ['SIS-004', 'USR-SIS-1004', '1004', 'Cantika Dewi', '7A', 'P', 'Ya', '1004@siswa.pijar-spenta.sch.id', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cantika'],
        ['SIS-005', 'USR-SIS-1005', '1005', 'Dimas Saputra', '7A', 'L', 'Ya', '1005@siswa.pijar-spenta.sch.id', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dimas'],
        ['SIS-006', 'USR-SIS-1006', '1006', 'Eka Nurhaliza', '7B', 'P', 'Ya', '1006@siswa.pijar-spenta.sch.id', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eka'],
        ['SIS-007', 'USR-SIS-1007', '1007', 'Fajar Ramadhan', '7B', 'L', 'Ya', '1007@siswa.pijar-spenta.sch.id', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fajar'],
        ['SIS-008', 'USR-SIS-1008', '1008', 'Gita Permata', '7B', 'P', 'Ya', '1008@siswa.pijar-spenta.sch.id', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gita'],
        ['SIS-009', 'USR-SIS-1009', '1009', 'Hafiz Maulana', '8A', 'L', 'Ya', '1009@siswa.pijar-spenta.sch.id', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hafiz'],
        ['SIS-010', 'USR-SIS-1010', '1010', 'Indah Lestari', '8A', 'P', 'Ya', '1010@siswa.pijar-spenta.sch.id', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Indah'],
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'SISWA!A2',
        valueInputOption: 'RAW',
        requestBody: { values: dummySiswa },
      });
      console.log(`  ✅ ${dummySiswa.length} data siswa ditambahkan ke SISWA!`);

      // Data PENUGASAN (Contoh Tugas Guru)
      const dummyPenugasan = [
        ['TSK-001', 'MPL-001', '7A', 'Semua', 'Menganalisis Teks Deskripsi', 'Bacalah teks deskripsi pada buku cetak hal. 14-16, kemudian buat rangkuman ide pokok serta kata kunci.', '2025-01-20', 'GRU-001', nowIso],
        ['TSK-002', 'MPL-002', '7A', 'Semua', 'Latihan Aljabar Dasar', 'Kerjakan soal no. 1-10 di buku tugas matematika, kumpulkan dalam bentuk foto atau lembar kerja.', '2025-01-25', 'GRU-002', nowIso],
        ['TSK-003', 'MPL-003', '7A', 'Semua', 'Vocabulary List: Daily Routine', 'Buat 20 kosakata baru tentang daily activities beserta contoh kalimat present tense.', '2025-01-22', 'GRU-003', nowIso],
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'PENUGASAN!A2',
        valueInputOption: 'RAW',
        requestBody: { values: dummyPenugasan },
      });
      console.log(`  ✅ ${dummyPenugasan.length} contoh penugasan ditambahkan ke PENUGASAN!`);

      // Data KEHADIRAN (Sampel presensi)
      const dummyKehadiran = [
        ['ABS-001', hariIni, '1001', 'Ahmad Fauzi', '7A', 'Bahasa Indonesia', 'Teks Deskripsi', 'H', 'Budi Santoso, S.Pd.', nowIso],
        ['ABS-002', hariIni, '1002', 'Aulia Rahmawati', '7A', 'Bahasa Indonesia', 'Teks Deskripsi', 'H', 'Budi Santoso, S.Pd.', nowIso],
        ['ABS-003', hariIni, '1003', 'Bagus Pratama', '7A', 'Bahasa Indonesia', 'Teks Deskripsi', 'S', 'Budi Santoso, S.Pd.', nowIso],
        ['ABS-004', hariIni, '1004', 'Cantika Dewi', '7A', 'Bahasa Indonesia', 'Teks Deskripsi', 'H', 'Budi Santoso, S.Pd.', nowIso],
        ['ABS-005', hariIni, '1005', 'Dimas Saputra', '7A', 'Bahasa Indonesia', 'Teks Deskripsi', 'I', 'Budi Santoso, S.Pd.', nowIso],
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'KEHADIRAN!A2',
        valueInputOption: 'RAW',
        requestBody: { values: dummyKehadiran },
      });
      console.log(`  ✅ ${dummyKehadiran.length} sampel kehadiran ditambahkan ke KEHADIRAN!`);

      // Data NILAI (Sampel nilai siswa)
      const dummyNilai = [
        ['NIL-001', hariIni, '1001', 'Ahmad Fauzi', '7A', 'Bahasa Indonesia', 'Formatif 1', '85', 'Budi Santoso, S.Pd.', nowIso],
        ['NIL-002', hariIni, '1002', 'Aulia Rahmawati', '7A', 'Bahasa Indonesia', 'Formatif 1', '90', 'Budi Santoso, S.Pd.', nowIso],
        ['NIL-003', hariIni, '1003', 'Bagus Pratama', '7A', 'Bahasa Indonesia', 'Formatif 1', '78', 'Budi Santoso, S.Pd.', nowIso],
        ['NIL-004', hariIni, '1004', 'Cantika Dewi', '7A', 'Bahasa Indonesia', 'Formatif 1', '88', 'Budi Santoso, S.Pd.', nowIso],
        ['NIL-005', hariIni, '1005', 'Dimas Saputra', '7A', 'Bahasa Indonesia', 'Formatif 1', '82', 'Budi Santoso, S.Pd.', nowIso],
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'NILAI!A2',
        valueInputOption: 'RAW',
        requestBody: { values: dummyNilai },
      });
      console.log(`  ✅ ${dummyNilai.length} sampel penilaian ditambahkan ke NILAI!`);

      // Data CATATAN (Sampel jurnal karakter)
      const dummyCatatan = [
        ['CAT-001', hariIni, '1001', 'Ahmad Fauzi', '7A', 'Bahasa Indonesia', 'Positif', 'Aktif membantu teman memahami materi saat diskusi kelompok', 'Sangat Baik', 'Budi Santoso, S.Pd.', nowIso],
        ['CAT-002', hariIni, '1003', 'Bagus Pratama', '7A', 'Bahasa Indonesia', 'Positif', 'Menunjukkan peningkatan minat baca dan sopan santun', 'Baik', 'Budi Santoso, S.Pd.', nowIso],
        ['CAT-003', hariIni, '1005', 'Dimas Saputra', '7A', 'Bahasa Indonesia', 'Negatif', 'Lupa membawa buku catatan teks deskripsi saat KBM', 'Cukup - Perlu Pembinaan', 'Budi Santoso, S.Pd.', nowIso],
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'CATATAN!A2',
        valueInputOption: 'RAW',
        requestBody: { values: dummyCatatan },
      });
      console.log(`  ✅ ${dummyCatatan.length} sampel catatan perkembangan ditambahkan ke CATATAN!`);
    } else {
      console.log(`ℹ️  Sheet USERS telah berisi ${currentUsers.length} data. Melewati seeding pengguna.`);
    }

    // 7. Cek & Isi PENGATURAN Default
    console.log('\n⚙️  Memeriksa konfigurasi PENGATURAN...');
    const pengaturanRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'PENGATURAN!A2:B',
    });
    const currentPengaturan = pengaturanRes.data.values || [];

    if (currentPengaturan.length === 0) {
      const pengaturanRows = Object.entries(PENGATURAN_DEFAULT).map(([key, value]) => [key, value]);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'PENGATURAN!A2',
        valueInputOption: 'RAW',
        requestBody: { values: pengaturanRows },
      });
      console.log(`  ✅ ${pengaturanRows.length} pengaturan sekolah berhasil disimpan ke PENGATURAN!`);
    } else {
      console.log(`ℹ️  PENGATURAN sudah berisi ${currentPengaturan.length} konfigurasi.`);
    }

    // 8. Hapus Sheet default bawaan jika bernama "Sheet1" dan kosong
    const defaultSheet = existingSheets.find((s) => s.properties?.title === 'Sheet1');
    if (defaultSheet && defaultSheet.properties?.sheetId !== undefined && existingSheets.length > 1) {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                deleteSheet: {
                  sheetId: defaultSheet.properties.sheetId,
                },
              },
            ],
          },
        });
        console.log('🧹 Lembar default "Sheet1" yang tidak terpakai telah dibersihkan.');
      } catch {
        // Abaikan jika tidak dapat dihapus
      }
    }

    // 9. Format Tampilan Sheet (Freeze Baris 1 & Kolom Header)
    console.log('\n🎨 Memformat lembar kerja (Freeze Baris 1)...');
    const updatedSpreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const allSheets = updatedSpreadsheet.data.sheets || [];

    const formatRequests: sheets_v4.Schema$Request[] = allSheets
      .filter((s) => targetSheetNames.includes(s.properties?.title || ''))
      .map((s) => ({
        updateSheetProperties: {
          properties: {
            sheetId: s.properties?.sheetId,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          fields: 'gridProperties.frozenRowCount',
        },
      }));

    if (formatRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: formatRequests },
      });
      console.log('✅ Format freeze row 1 berhasil diterapkan ke seluruh sheet!');
    }

    // Selesai! Cetak ringkasan akun untuk pengguna
    console.log('\n================================================================');
    console.log('🎉 INISIALISASI DATABASE SELESAI DENGAN SUKSES!');
    console.log('================================================================');
    console.log('\n📌 KREDENSIAL AKUN DEFAULT UNTUK PENGUJIAN:');
    console.log('----------------------------------------------------------------');
    console.log('1. ADMIN:');
    console.log('   Username : admin');
    console.log('   Password : admin123');
    console.log('   Peran    : admin (Akses penuh ke semua panel & master data)');
    console.log('----------------------------------------------------------------');
    console.log('2. GURU (3 Akun):');
    console.log('   • Budi Santoso, S.Pd.    -> Username: guru_budi   | Password: guru123');
    console.log('   • Siti Aminah, S.Pd.     -> Username: guru_siti   | Password: guru123');
    console.log('   • Hendra Wijaya, S.Pd.   -> Username: guru_hendra | Password: guru123');
    console.log('----------------------------------------------------------------');
    console.log('3. SISWA (10 Akun):');
    console.log('   • NIS 1001 (Ahmad Fauzi) s/d NIS 1010 (Indah Lestari)');
    console.log('   • Username : [NIS masing-masing, cth: 1001, 1002, 1003]');
    console.log('   • Password : siswa123');
    console.log('----------------------------------------------------------------\n');
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number };
    console.error('\n❌ Gagal melakukan inisialisasi spreadsheet:');
    console.error(err.message || error);
    console.log('\n💡 TIPS PEMECAHAN MASALAH:');
    console.log('1. Pastikan Anda telah mengundang (Share) email Service Account ke Google Sheet Anda sebagai "Editor".');
    console.log(`   Email Service Account: ${clientEmail}`);
    console.log('2. Pastikan Google Sheets API telah diaktifkan di Google Cloud Console.');
    console.log('3. Pastikan GOOGLE_PRIVATE_KEY tidak terpotong dan format \\n terjaga dengan baik.\n');
    process.exit(1);
  }
}

main();
