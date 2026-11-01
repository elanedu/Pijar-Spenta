/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Manajemen Sesi Pengguna & Role Guard
 * Mengambil dan memvalidasi sesi JWT dari Cookie httpOnly atau Header Authorization
 */

import { verifyToken, UserSessionPayload } from './auth.ts';
import { UserRole } from './constants.ts';
import { apiError } from './utils.ts';

export const AUTH_COOKIE_NAME = 'pijar_spenta_token';
export const TOKEN_MAX_AGE = 8 * 60 * 60; // 8 Jam (dalam detik)

/**
 * Parsing string header cookie menjadi object key-value
 */
export function parseCookies(cookieHeader?: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const list: Record<string, string> = {};

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });

  return list;
}

/**
 * Mengekstrak token JWT dari header Authorization (Bearer <token>) atau Cookie httpOnly
 */
export function extractToken(
  cookieHeader?: string | null,
  authHeader?: string | null
): string | null {
  // 1. Cek header Authorization: Bearer <token>
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Cek Cookie pijar_spenta_token
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    if (cookies[AUTH_COOKIE_NAME]) {
      return cookies[AUTH_COOKIE_NAME];
    }
  }

  return null;
}

/**
 * Mengambil sesi pengguna aktif dari Request (Next.js Request atau Express Request)
 */
export async function getSession(
  req?: Request | { headers?: any; cookies?: any }
): Promise<UserSessionPayload | null> {
  let token: string | null = null;

  // Jika parameter Request web standar diteruskan (Next.js App Router)
  if (req && 'headers' in req) {
    let authHeader: string | null = null;
    let cookieHeader: string | null = null;

    if (typeof (req.headers as any).get === 'function') {
      authHeader = (req.headers as any).get('authorization');
      cookieHeader = (req.headers as any).get('cookie');
    } else {
      authHeader = req.headers['authorization'] || req.headers['Authorization'] || null;
      cookieHeader = req.headers['cookie'] || null;
    }

    // Jika req memiliki properti cookies langsung (Express dengan cookie-parser)
    if (!token && (req as any).cookies && (req as any).cookies[AUTH_COOKIE_NAME]) {
      token = (req as any).cookies[AUTH_COOKIE_NAME];
    }

    if (!token) {
      token = extractToken(cookieHeader, authHeader);
    }
  }

  // Jika dijalankan di Next.js App Router tanpa passing req
  if (!token) {
    try {
      // Panggil cookies secara dinamis jika tersedia pada global runtime Next.js
      const reqHeaders = (globalThis as any)?.__next_headers__;
      if (reqHeaders && typeof reqHeaders.get === 'function') {
        const authCookie = reqHeaders.get(AUTH_COOKIE_NAME);
        if (authCookie) token = authCookie;
      }
    } catch {
      // Abaikan jika tidak di runtime Next.js
    }
  }

  if (!token) return null;

  return verifyToken(token);
}

/**
 * Role Guard: Memastikan sesi ada dan memiliki peran yang diizinkan
 * Mengembalikan { authorized: true, session } jika sah,
 * atau { authorized: false, session: null, errorResponse } jika gagal (401 atau 403)
 */
export async function checkRole(
  req: Request | any,
  allowedRoles?: UserRole[]
): Promise<{
  authorized: boolean;
  session: UserSessionPayload | null;
  status: number;
  message: string;
}> {
  const session = await getSession(req);

  if (!session) {
    return {
      authorized: false,
      session: null,
      status: 401,
      message: 'Sesi Anda telah berakhir atau belum login. Silakan login kembali.',
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.role)) {
      return {
        authorized: false,
        session,
        status: 403,
        message: `Akses ditolak. Fitur ini hanya untuk peran: ${allowedRoles.join(', ')}.`,
      };
    }
  }

  return {
    authorized: true,
    session,
    status: 200,
    message: 'Akses sah.',
  };
}

/**
 * Konfigurasi opsi cookie HTTP-Only sesuai spesifikasi:
 * httpOnly: true, secure: true di production, sameSite: lax, maxAge: 8 jam
 */
export function getAuthCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  };
}

/**
 * Format string Set-Cookie untuk header HTTP mentah
 */
export function createSetCookieHeader(token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${AUTH_COOKIE_NAME}=${token}; Path=/; Max-Age=${TOKEN_MAX_AGE}; HttpOnly; SameSite=Lax${
    isProd ? '; Secure' : ''
  }`;
}

/**
 * Format string Set-Cookie untuk menghapus cookie saat logout
 */
export function createClearCookieHeader(): string {
  return `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}
