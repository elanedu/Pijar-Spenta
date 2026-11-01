/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Utility Functions
 * Kumpulan fungsi pembantu format tanggal, angka, kalkulasi KKM, sanitasi, dan respons API
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan class Tailwind dengan aman tanpa konflik (clsx + tailwind-merge)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format tanggal ke format Bahasa Indonesia
 * Contoh: "Senin, 20 Januari 2025" atau "20 Jan 2025"
 */
export function formatTanggal(
  dateInput?: string | Date | null,
  opsi: 'lengkap' | 'standar' | 'singkat' | 'waktu' = 'standar'
): string {
  if (!dateInput) return '-';

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    if (opsi === 'lengkap') {
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    if (opsi === 'singkat') {
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }

    if (opsi === 'waktu') {
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // Default standar: "20 Januari 2025"
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Menghasilkan tanggal hari ini dalam format string YYYY-MM-DD
 */
export function getTanggalHariIni(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Menghasilkan timestamp ISO lengkap
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Sanitasi string HTML untuk mencegah XSS
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Membuat ID unik dengan prefix (contoh: "USR-1700000000", "NIL-123456")
 */
export function generateId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timePart = Date.now().toString().slice(-4);
  return `${prefix}-${timePart}${randomPart}`;
}

/**
 * Format angka nilai siswa (contoh: 85.50 -> 85.5)
 */
export function formatNilai(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '-';
  return Number.isInteger(num) ? num.toString() : num.toFixed(1);
}

/**
 * Menghitung nilai rata-rata dari sekumpulan nilai
 */
export function hitungRataRata(nilaiList: (number | string)[]): number {
  const validNumbers = nilaiList
    .map((n) => (typeof n === 'string' ? parseFloat(n) : n))
    .filter((n): n is number => typeof n === 'number' && !isNaN(n));

  if (validNumbers.length === 0) return 0;
  const sum = validNumbers.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / validNumbers.length) * 10) / 10;
}

/**
 * Evaluasi ketuntasan berdasarkan KKM sekolah
 */
export function cekStatusKKM(
  nilai: number | string,
  kkm: number | string = 75
): {
  tuntas: boolean;
  predikat: 'A' | 'B' | 'C' | 'D';
  keterangan: string;
} {
  const numNilai = typeof nilai === 'string' ? parseFloat(nilai) || 0 : nilai;
  const numKKM = typeof kkm === 'string' ? parseFloat(kkm) || 75 : kkm;

  const tuntas = numNilai >= numKKM;

  let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
  let keterangan = 'Perlu Remedial / Belum Tuntas';

  if (numNilai >= 90) {
    predikat = 'A';
    keterangan = 'Sangat Baik (Tuntas)';
  } else if (numNilai >= 80) {
    predikat = 'B';
    keterangan = 'Baik (Tuntas)';
  } else if (numNilai >= numKKM) {
    predikat = 'C';
    keterangan = 'Cukup (Tuntas)';
  }

  return { tuntas, predikat, keterangan };
}

/**
 * Format standar respons API sukses
 * { success: true, message: string, data: any }
 */
export function apiSuccess<T>(data: T, message: string = 'Operasi berhasil') {
  return {
    success: true as const,
    message,
    data,
  };
}

/**
 * Format standar respons API gagal
 * { success: false, message: string, data: null }
 */
export function apiError(message: string = 'Terjadi kesalahan sistem') {
  return {
    success: false as const,
    message,
    data: null,
  };
}
