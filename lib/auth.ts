/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Otentikasi & Keamanan Pengguna
 * Mengelola enkripsi password dengan bcrypt (10 rounds) dan JWT (JSON Web Token)
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readSheet } from './sheets.ts';
import { UserRole } from './constants.ts';

const BCRYPT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'pijar_spenta_default_jwt_secret_key_2024_akademik';
const TOKEN_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 Jam sesuai spesifikasi

export interface UserSessionPayload {
  id: string;
  username: string;
  role: UserRole;
  nama: string;
  email: string;
  extraId?: string; // NIP untuk Guru, NIS untuk Siswa
  kelas?: string;   // Untuk Siswa atau Wali Kelas
  mapel?: string;   // Mapel utama guru
  foto?: string;    // Foto avatar
}

export interface SanitizedUser {
  id: string;
  username: string;
  role: UserRole;
  nama: string;
  email: string;
  aktif: string;
  extraId?: string;
  kelas?: string;
  mapel?: string;
  foto?: string;
}

/**
 * Enkripsi password biasa menggunakan bcryptjs (10 salt rounds)
 */
export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, BCRYPT_ROUNDS);
}

/**
 * Verifikasi kecocokan password teks biasa dengan hash tersimpan
 */
export function comparePassword(plainText: string, hash: string): boolean {
  if (!hash) return false;
  // Dukung kecocokan langsung jika data mentah belum ter-hash (fallback aman saat testing)
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
    return plainText === hash;
  }
  return bcrypt.compareSync(plainText, hash);
}

/**
 * Menandatangani token JWT sesi pengguna dengan masa berlaku 8 jam
 */
export function signToken(payload: UserSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_MAX_AGE_SECONDS,
  });
}

/**
 * Verifikasi keabsahan token JWT dan mengembalikan payload sesi
 */
export function verifyToken(token: string): UserSessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verifikasi login pengguna berdasarkan username & password
 * Mengambil profil dari USERS dan menggabungkan data GURU atau SISWA
 * PENTING: Jangan pernah menyertakan password_hash pada hasil kembalian
 */
export async function verifyLogin(
  username: string,
  passwordPlain: string
): Promise<{ success: boolean; message: string; user: SanitizedUser | null }> {
  if (!username || !passwordPlain) {
    return {
      success: false,
      message: 'Username dan password wajib diisi.',
      user: null,
    };
  }

  const cleanUsername = username.trim().toLowerCase();

  // 1. Ambil data dari sheet USERS
  const users = await readSheet<{
    id: string;
    username: string;
    password_hash: string;
    role: string;
    nama: string;
    email: string;
    aktif: string;
  }>('USERS');

  const userFound = users.find(
    (u) => u.username && u.username.trim().toLowerCase() === cleanUsername
  );

  if (!userFound) {
    return {
      success: false,
      message: 'Username tidak ditemukan.',
      user: null,
    };
  }

  // 2. Cek status keaktifan akun
  const isAktif = userFound.aktif === 'Ya' || userFound.aktif === 'true' || userFound.aktif === '1';
  if (!isAktif) {
    return {
      success: false,
      message: 'Akun Anda dinonaktifkan. Silakan hubungi Administrator sekolah.',
      user: null,
    };
  }

  // 3. Verifikasi Password dengan bcrypt
  const isMatch = comparePassword(passwordPlain, userFound.password_hash);
  if (!isMatch) {
    return {
      success: false,
      message: 'Password yang Anda masukkan salah.',
      user: null,
    };
  }

  // 4. Bangun profil pengguna higienis (tanpa password_hash)
  const role = (userFound.role || 'siswa') as UserRole;
  const sanitizedUser: SanitizedUser = {
    id: userFound.id,
    username: userFound.username,
    role,
    nama: userFound.nama,
    email: userFound.email || '',
    aktif: userFound.aktif || 'Ya',
  };

  // 5. Tambahkan info pelengkap berdasarkan peran
  if (role === 'guru') {
    const gurus = await readSheet<{
      id: string;
      user_id: string;
      nip: string;
      nama: string;
      mapel_utama: string;
    }>('GURU');
    const guruData = gurus.find((g) => g.user_id === userFound.id || g.nama === userFound.nama);
    if (guruData) {
      sanitizedUser.extraId = guruData.nip;
      sanitizedUser.mapel = guruData.mapel_utama;
    }
  } else if (role === 'siswa') {
    const siswas = await readSheet<{
      id: string;
      user_id: string;
      nis: string;
      nama: string;
      kelas: string;
      foto: string;
    }>('SISWA');
    const siswaData = siswas.find(
      (s) => s.user_id === userFound.id || s.nis === userFound.username || s.nama === userFound.nama
    );
    if (siswaData) {
      sanitizedUser.extraId = siswaData.nis;
      sanitizedUser.kelas = siswaData.kelas;
      sanitizedUser.foto = siswaData.foto;
    }
  }

  return {
    success: true,
    message: 'Login berhasil.',
    user: sanitizedUser,
  };
}
