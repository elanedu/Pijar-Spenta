/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Konstanta dan Skema Database Google Sheets
 * Nama Spreadsheet: EDULOG_DATABASE
 */

export interface SheetDefinition {
  name: string;
  headers: string[];
  description: string;
}

/**
 * Daftar sheet dan kolom yang wajib ada pada Google Sheets EDULOG_DATABASE
 * Baris 1 selalu berisi header kolom ini secara tepat.
 */
export const STRUKTUR_DATABASE: Record<string, SheetDefinition> = {
  USERS: {
    name: 'USERS',
    headers: ['id', 'username', 'password_hash', 'role', 'nama', 'email', 'aktif', 'timestamp'],
    description: 'Data akun login untuk Admin, Guru, dan Siswa',
  },
  GURU: {
    name: 'GURU',
    headers: ['id', 'user_id', 'nip', 'nama', 'mapel_utama', 'status'],
    description: 'Profil biodata guru dan pengampu mata pelajaran',
  },
  SISWA: {
    name: 'SISWA',
    headers: ['id', 'user_id', 'nis', 'nama', 'kelas', 'jenis_kelamin', 'aktif', 'email', 'foto'],
    description: 'Biodata siswa per kelas beserta NIS dan status',
  },
  KELAS: {
    name: 'KELAS',
    headers: ['id', 'nama_kelas', 'tingkat', 'wali_kelas', 'tahun_ajaran'],
    description: 'Daftar rombel kelas dan wali kelas',
  },
  MAPEL: {
    name: 'MAPEL',
    headers: ['id', 'kode', 'nama_mapel', 'guru_id', 'kelas_diampu'],
    description: 'Mata pelajaran, guru penanggung jawab, dan rombel yang diampu',
  },
  PENUGASAN: {
    name: 'PENUGASAN',
    headers: ['id', 'mapel_id', 'target_kelas', 'target_siswa', 'judul', 'deskripsi', 'deadline', 'guru_id', 'timestamp'],
    description: 'Tugas-tugas yang diberikan guru kepada kelas/siswa',
  },
  KEHADIRAN: {
    name: 'KEHADIRAN',
    headers: ['id', 'tanggal', 'nis', 'nama', 'kelas', 'mapel', 'topik', 'status', 'guru', 'timestamp'],
    description: 'Presensi harian siswa per pertemuan mapel (Hadir, Izin, Sakit, Alpa)',
  },
  NILAI: {
    name: 'NILAI',
    headers: ['id', 'tanggal', 'nis', 'nama', 'kelas', 'mapel', 'jenis_nilai', 'nilai', 'guru', 'timestamp'],
    description: 'Buku nilai formatif, sumatif, UTS, dan UAS siswa',
  },
  CATATAN: {
    name: 'CATATAN',
    headers: ['id', 'tanggal', 'nis', 'nama', 'kelas', 'mapel', 'jenis', 'keterangan', 'nilai_deskripsi', 'guru', 'timestamp'],
    description: 'Jurnal catatan perkembangan karakter siswa (Positif / Negatif)',
  },
  PENGATURAN: {
    name: 'PENGATURAN',
    headers: ['key', 'value'],
    description: 'Konfigurasi sekolah yang memengaruhi tampilan dan kop cetak semua panel',
  },
};

/**
 * Nilai default pengaturan sekolah yang disimpan di sheet PENGATURAN
 */
export const PENGATURAN_DEFAULT: Record<string, string> = {
  nama_sekolah: 'SMP NEGERI 1 SPENTA',
  alamat_sekolah: 'Jl. Ki Hajar Dewantara No. 12, Jawa Barat',
  telepon_sekolah: '(021) 8765-4321',
  email_sekolah: 'info@smpn1spenta.sch.id',
  website_sekolah: 'https://smpn1spenta.sch.id',
  kepala_sekolah: 'Drs. H. Mulyono, M.Pd.',
  nip_kepala_sekolah: '197005121996031002',
  logo_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&auto=format&fit=crop&q=80',
  warna_primary: '#1d4ed8', // Biru khas pendidikan
  warna_secondary: '#0f172a',
  tahun_ajaran: '2024/2025',
  semester: 'Ganjil',
  kkm_default: '75',
  kota_cetak: 'Kota Bandung',
  footer_cetak: 'Dokumen resmi PIJAR SPENTA - Dicetak secara elektronik dan sah tanpa cap basah tambahan.',
};

/**
 * Pilihan peran pengguna (User Roles)
 */
export const ROLES = {
  ADMIN: 'admin',
  GURU: 'guru',
  SISWA: 'siswa',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Status kehadiran yang valid
 */
export const STATUS_KEHADIRAN = {
  H: { kode: 'H', label: 'Hadir', warna: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  I: { kode: 'I', label: 'Izin', warna: 'bg-blue-100 text-blue-800 border-blue-300' },
  S: { kode: 'S', label: 'Sakit', warna: 'bg-amber-100 text-amber-800 border-amber-300' },
  A: { kode: 'A', label: 'Alpa', warna: 'bg-rose-100 text-rose-800 border-rose-300' },
} as const;

export type KodeKehadiran = keyof typeof STATUS_KEHADIRAN;
