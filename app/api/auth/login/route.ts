/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Auth Login
 * POST /api/auth/login
 * Body: { username, password }
 * Response: { success: boolean, message: string, data: { user, token } }
 * Cookie: pijar_spenta_token (httpOnly, secure, 8 jam)
 */

import { verifyLogin, signToken } from '@/lib/auth.ts';
import { createSetCookieHeader } from '@/lib/session.ts';
import { apiSuccess, apiError } from '@/lib/utils.ts';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify(apiError('Username dan password wajib diisi.')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 1. Verifikasi Kredensial via Database Google Sheets
    const result = await verifyLogin(username, password);

    if (!result.success || !result.user) {
      return new Response(
        JSON.stringify(apiError(result.message || 'Kredensial tidak valid.')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Buat JWT Token (Berlaku 8 Jam)
    const token = signToken({
      id: result.user.id,
      username: result.user.username,
      role: result.user.role,
      nama: result.user.nama,
      email: result.user.email,
      extraId: result.user.extraId,
      kelas: result.user.kelas,
      mapel: result.user.mapel,
      foto: result.user.foto,
    });

    // 3. Pasang Set-Cookie httpOnly
    const cookieHeader = createSetCookieHeader(token);

    return new Response(
      JSON.stringify(
        apiSuccess(
          {
            user: result.user,
            token,
          },
          'Login berhasil! Mengalihkan ke dashboard...'
        )
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (error: any) {
    console.error('Error pada /api/auth/login:', error);
    return new Response(
      JSON.stringify(apiError('Terjadi kesalahan pada server saat proses login.')),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
