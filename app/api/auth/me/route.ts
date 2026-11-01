/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Auth Me
 * GET /api/auth/me
 * Mengembalikan data profil pengguna aktif dari cookie/token
 */

import { getSession } from '@/lib/session.ts';
import { apiSuccess, apiError } from '@/lib/utils.ts';

export async function GET(request: Request) {
  try {
    const session = await getSession(request);

    if (!session) {
      return new Response(
        JSON.stringify(apiError('Tidak ada sesi login aktif.')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify(apiSuccess(session, 'Sesi pengguna valid.')),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error pada /api/auth/me:', error);
    return new Response(
      JSON.stringify(apiError('Gagal memverifikasi sesi pengguna.')),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
