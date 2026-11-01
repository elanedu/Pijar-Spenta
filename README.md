# 🏫 PIJAR SPENTA — Sistem Manajemen Pembelajaran Terpadu Sekolah

**PIJAR SPENTA** adalah aplikasi sistem manajemen akademik dan pembelajaran terpadu untuk sekolah menengah (SMP/MTs/SMA) yang mendukung 3 peran pengguna: **Admin**, **Guru**, dan **Siswa**.

Aplikasi ini dirancang untuk dapat berjalan **100% gratis tanpa biaya server** menggunakan **Google Sheets sebagai Database** (via Google Sheets API & Service Account) dan siap dideploy langsung ke **Vercel**.

---

## 📑 Daftar Isi
1. [Fitur Utama per Peran](#-fitur-utama-per-peran)
2. [Kredensial Akun Demo](#-kredensial-akun-demo)
3. [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
4. [Struktur Database Google Sheets (10 Sheet)](#-struktur-database-google-sheets-10-sheet)
5. [Panduan Integrasi Google Sheets API](#-panduan-integrasi-google-sheets-api)
6. [Fitur Cetak Dokumen Resmi (@media print A4 Ready)](#-fitur-cetak-dokumen-resmi-media-print-a4-ready)
7. [Panduan Deployment ke Vercel (Gratis)](#-panduan-deployment-ke-vercel-gratis)
8. [Menjalankan di Lokal](#-menjalankan-di-lokal)

---

## 🌟 Fitur Utama per Peran

### 1. 🛡️ Panel Administrator
- **Dashboard Statistik Eksekutif**:
  - Jumlah total Pendidik, Peserta Didik, Rombel (Kelas), dan Mata Pelajaran.
  - Persentase dan rekapitulasi kehadiran hari ini (Hadir, Izin, Sakit, Alpa).
  - Rata-rata nilai akademik global sekolah dan persentase ketuntasan KKM.
  - **Cetak Rekap Global**: Ekspor laporan eksekutif resmi A4 dengan kop sekolah dan tanda tangan Kepala Sekolah.
- **Manajemen Pengguna (CRUD Users)**:
  - Kelola akun Admin, Guru, dan Siswa.
  - Reset kata sandi (password hashing dengan bcrypt).
  - Aktivasi / Nonaktifkan status akun.
- **Manajemen Data Pokok Pendidikan**:
  - **Data Guru**: NIP, Nama Lengkap, Mata Pelajaran Utama, Status Kepegawaian.
  - **Data Siswa**: NIS, Nama Lengkap, Rombel, Jenis Kelamin (L/P), Email.
  - **Data Kelas / Rombel**: Tingkat (7, 8, 9), Nama Rombel, Wali Kelas, dan **Cetak Rekap Daftar Siswa per Kelas**.
  - **Data Mata Pelajaran**: Kode Mapel, Nama Mata Pelajaran, Guru Pengampu, Alokasi Jam Belajar.
- **Pengaturan Satuan Pendidikan**:
  - Nama Sekolah, Alamat Resmi, Nomor Telepon, Pos-el, Laman Web Resmi.
  - Nama Kepala Sekolah & NIP, Kota Titimangsa Cetak.
  - Standar KKM Acuan (Default: 75), Tahun Ajaran, Semester Aktif.
  - Pengaturan langsung memengaruhi kop surat cetak dan seluruh kalkulasi nilai.
- **Backup & Pemulihan Data**:
  - Ekspor seluruh tabel ke format JSON/CSV.
  - Cadangan instan untuk arsip sekolah.

### 2. 👨‍🏫 Panel Guru (Pendidik)
- **Dashboard Kelas Binaan**:
  - Kartu mata pelajaran dan rombel yang diampu (misal: "Bahasa Indonesia 7A", "Matematika 8B").
  - Shortcut ke 4 modul utama kelas.
- **4 Tab Pengelolaan Pembelajaran**:
  1. **Presensi Kehadiran**: Input tanggal & materi KBM, toggle H/I/S/A per siswa, tombol 'Semua Hadir', rekap otomatis, dan **Cetak Rekap Presensi KBM**.
  2. **Buku Penilaian KKM**: Tambah kolom jenis nilai dinamis (Formatif 1, Sumatif 1, UTS, UAS, Portofolio), input nilai inline, rata-rata otomatis, analisis ketuntasan KKM (Tuntas/Remedial), dan **Cetak Ledger Nilai KKM**.
  3. **Jurnal Catatan Sikap**: Form catatan tanggal, pilihan siswa, kategori (Positif/Negatif), uraian perilaku, dan **Cetak Jurnal Karakter**.
  4. **Penugasan Belajar**: Penerbitan tugas terstruktur dengan judul, instruksi, deadline, dan target kelas. Tugas langsung muncul di portal siswa.

### 3. 🎓 Panel Siswa (Peserta Didik)
- **Dashboard Ringkasan Akademik**:
  - Kartu metrik Rata-rata Nilai, Persentase Kehadiran, Status Absensi (I/S/A), dan Jumlah Tugas.
- **5 Tab Portofolio Siswa**:
  1. **Buku Nilai & KKM**: Transkrip lengkap seluruh mata pelajaran, status ketuntasan, predikat huruf (A/B/C/D), dan cetak transkrip.
  2. **Rekap Kehadiran**: Log presensi per pertemuan, topik KBM, guru pengajar, dan filter status (H/I/S/A).
  3. **Jurnal Karakter**: Catatan apresiasi kemajuan belajar dan pembinaan dari wali kelas.
  4. **Tugas Belajar**: Daftar tugas aktif, instruksi pengerjaan, dan hitung mundur batas pengumpulan.
  5. **Lembar Raport Resmi Siap Cetak A4**: Format raport lengkap menggabungkan nilai mata pelajaran, presensi semester, catatan wali kelas, serta lembar tanda tangan 3 pihak (Orang Tua, Wali Kelas, Kepala Sekolah).

---

## 🔑 Kredensial Akun Demo

Aplikasi dilengkapi akun demo bawaan untuk memudahkan pengujian semua fitur:

| Peran | Username | Password | Deskripsi |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Administrator Utama Sekolah (Akses Penuh) |
| **Guru** | `guru_budi` | `guru123` | Budi Santoso, S.Pd. (Bahasa Indonesia 7A & 8B) |
| **Guru** | `guru_siti` | `guru123` | Siti Rahayu, M.Pd. (Matematika 7A & 7B) |
| **Siswa** | `1001` | `siswa123` | Ahmad Fauzi (Siswa Kelas 7A) |
| **Siswa** | `1002` | `siswa123` | Siti Nurhaliza (Siswa Kelas 7A) |

*(Di halaman login tersedia tombol **Akses Instan** untuk mengisi kredensial dengan satu klik)*.

---

## 🛠️ Arsitektur & Tech Stack

- **Framework Frontend**: React 19 + TypeScript (Vite & Next.js App Router Architecture)
- **Framework Backend / API**: Node.js Express server (`server.ts`) dengan routing RESTful `/api/*`
- **Styling**: Tailwind CSS v4 + Lucide React Icons
- **Autentikasi**: JWT (JSON Web Token via library `jose`), cookie `httpOnly`, password di-hash dengan `bcryptjs`
- **Database Backend**: Google Sheets API v4 via `googleapis` (Service Account) + Local Mock State Fallback
- **Cetak Dokumen**: Pure CSS `@media print` disesuaikan standar kertas **A4 Portrait & Landscape**

---

## 📊 Struktur Database Google Sheets (10 Sheet)

Nama Spreadsheet: **`EDULOG_DATABASE`**

Setiap sheet memiliki header baris ke-1 sebagai berikut:

| No | Nama Sheet | Kolom (Baris 1 Header) |
|---|---|---|
| 1 | `USERS` | `id`, `username`, `password_hash`, `role`, `nama`, `email`, `aktif`, `timestamp` |
| 2 | `GURU` | `id`, `user_id`, `nip`, `nama`, `mapel_utama`, `status` |
| 3 | `SISWA` | `id`, `user_id`, `nis`, `nama`, `kelas`, `jenis_kelamin`, `aktif`, `email`, `foto` |
| 4 | `KELAS` | `id`, `nama_kelas`, `tingkat`, `wali_kelas`, `tahun_ajaran` |
| 5 | `MAPEL` | `id`, `kode`, `nama_mapel`, `guru_id`, `kelas_diampu` |
| 6 | `PENUGASAN` | `id`, `mapel_id`, `target_kelas`, `target_siswa`, `judul`, `deskripsi`, `deadline`, `guru_id`, `timestamp` |
| 7 | `KEHADIRAN` | `id`, `tanggal`, `nis`, `nama`, `kelas`, `mapel`, `topik`, `status`, `guru`, `timestamp` |
| 8 | `NILAI` | `id`, `tanggal`, `nis`, `nama`, `kelas`, `mapel`, `jenis_nilai`, `nilai`, `guru`, `timestamp` |
| 9 | `CATATAN` | `id`, `tanggal`, `nis`, `nama`, `kelas`, `mapel`, `jenis`, `keterangan`, `nilai_deskripsi`, `guru`, `timestamp` |
| 10 | `PENGATURAN` | `key`, `value` |

---

## 🔌 Panduan Integrasi Google Sheets API

Agar aplikasi dapat membaca dan menulis data langsung ke Google Sheets Anda secara gratis:

### Langkah 1: Buat Proyek di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru dengan nama misalnya **`Pijar Spenta Database`**.
3. Buka menu **APIs & Services > Library**, cari **Google Sheets API**, lalu klik **Enable**.

### Langkah 2: Buat Service Account & Unduh Key JSON
1. Buka **APIs & Services > Credentials**.
2. Klik **Create Credentials > Service Account**.
3. Beri nama akun layanan (misal: `pijar-sheets-sa`), lalu klik **Done**.
4. Klik akun layanan yang baru dibuat, masuk ke tab **Keys**.
5. Klik **Add Key > Create new key**, pilih format **JSON**, lalu klik **Create**. File JSON akan terunduh otomatis ke komputer Anda.

### Langkah 3: Siapkan Google Spreadsheet
1. Buka [Google Sheets](https://sheets.google.com/) dan buat spreadsheet kosong baru.
2. Beri nama spreadsheet: **`EDULOG_DATABASE`**.
3. Salin **Spreadsheet ID** dari URL browser:
   `https://docs.google.com/spreadsheets/d/`**`<ID_SPREADSHEET_ANDA>`**`/edit`
4. Bagikan akses spreadsheet: Klik tombol **Share (Bagikan)** di Google Sheets, lalu masukkan alamat email service account Anda (tertera di file JSON, berakhiran `@...iam.gserviceaccount.com`) dengan hak akses **Editor**.

### Langkah 4: Jalankan Skrip Inisialisasi Database
Di folder proyek, atur variabel lingkungan lalu jalankan:
```bash
npm run setup-db
```
Skrip ini akan secara otomatis membuat ke-10 sheet beserta baris header dan akun awal administrator.

---

## 🖨️ Fitur Cetak Dokumen Resmi (@media print A4 Ready)

Seluruh modul dilengkapi tata cetak resmi kedinasan sekolah:
- **Kop Surat Kedinasan**: Memuat logo sekolah, nama dinas pendidikan, alamat lengkap, kontak telepon, website, dan email resmi.
- **CSS @media print Presisi**:
  - Ukuran `@page { size: A4 portrait; margin: 1.2cm 1.5cm; }`.
  - `-webkit-print-color-adjust: exact;` untuk ketajaman warna tabel dan lencana predikat.
  - `break-inside: avoid;` untuk mencegah baris tabel atau kotak tanda tangan terpotong di batas halaman.
  - Sembunyi otomatis untuk sidebar, navbar, dan tombol aksi (`.no-print`).
- **Lembar Tanda Tangan Resmi**:
  - Format 2 Pihak: Wali Kelas / Guru Mapel & Kepala Sekolah.
  - Format 3 Pihak: Orang Tua / Wali Siswa, Wali Kelas, dan Kepala Sekolah (khusus Buku Raport).

---

## 🚀 Panduan Deployment ke Vercel (Gratis)

Aplikasi PIJAR SPENTA dapat dihosting secara gratis di **Vercel**:

### 1. Push Kode ke GitHub
Pastikan repositori Anda sudah ter-push ke akun GitHub Anda:
```bash
git init
git add .
git commit -m "feat: inisialisasi aplikasi PIJAR SPENTA"
git branch -M main
git remote add origin https://github.com/USERNAME/pijar-spenta.git
git push -u origin main
```

### 2. Import Proyek di Vercel
1. Masuk ke [Vercel Dashboard](https://vercel.com/) dan klik **Add New > Project**.
2. Pilih repositori **`pijar-spenta`** dari daftar GitHub Anda.
3. Vercel akan otomatis mendeteksi konfigurasi build.

### 3. Konfigurasi Environment Variables di Vercel
Tambahkan variabel berikut pada panel **Settings > Environment Variables**:

| Variable Name | Contoh Nilai | Deskripsi |
|---|---|---|
| `JWT_SECRET` | `rahasia_kunci_jwt_pijar_spenta_2024` | Kunci rahasia penandatanganan token JWT |
| `GOOGLE_SHEET_ID` | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE` | ID Google Spreadsheet database Anda |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `pijar-sa@proyek.iam.gserviceaccount.com` | Email service account dari Google Cloud |
| `GOOGLE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"` | Kunci privat dari file JSON service account |

### 4. Deploy
Klik **Deploy**. Dalam waktu sekitar 1-2 menit, aplikasi PIJAR SPENTA Anda sudah live dengan URL publik (misal: `https://pijar-spenta.vercel.app`) dan siap digunakan oleh sekolah!

---

## 💻 Menjalankan di Lokal

1. Salin file lingkungan contoh:
   ```bash
   cp .env.example .env
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Buka peramban di `http://localhost:3000`.

---

## 📄 Lisensi & Hak Cipta
Hak Cipta © 2024 **SMP Negeri 1 Spenta / Tim Pengembang PIJAR SPENTA**.
Didistribusikan di bawah lisensi Apache-2.0.
