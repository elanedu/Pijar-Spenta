/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Auth Logout
 * POST /api/auth/logout
 * Menghapus cookie pijar_spenta_token
 */

import { createClearCookieHeader } from '@/lib/session.ts';
import { apiSuccess } from '@/lib/utils.ts';

export async function POST() {
  const clearCookie = createClearCookieHeader();

  return new Response(
    JSON.stringify(apiSuccess(null, 'Anda telah berhasil logout.')),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearCookie,
      },
    }
  );
}
