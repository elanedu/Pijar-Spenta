/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Pengaturan Sekolah (Sheet: PENGATURAN)
 * GET /api/admin/pengaturan
 * POST /api/admin/pengaturan
 */

import { checkRole } from '@/lib/session.ts';
import { getAllSettings, updateSetting } from '@/lib/sheets.ts';
import { apiSuccess, apiError } from '@/lib/utils.ts';

// GET: Ambil seluruh konfigurasi sekolah
export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['admin', 'guru', 'siswa']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const settings = await getAllSettings();
    return new Response(JSON.stringify(apiSuccess(settings, 'Pengaturan sekolah berhasil dimuat.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat pengaturan: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Simpan dan perbarui nilai pengaturan sekolah
export async function POST(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));

    // Simpan setiap pasangan key-value yang dikirimkan
    const entries = Object.entries(body);
    for (const [key, value] of entries) {
      if (typeof key === 'string' && value !== undefined) {
        await updateSetting(key, String(value));
      }
    }

    const updatedSettings = await getAllSettings();

    return new Response(
      JSON.stringify(apiSuccess(updatedSettings, 'Pengaturan sekolah berhasil diperbarui.')),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menyimpan pengaturan: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
