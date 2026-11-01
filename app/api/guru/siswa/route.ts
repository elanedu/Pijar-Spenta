/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Daftar Siswa per Kelas untuk Guru
 * GET /api/guru/siswa?kelas=...
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet } from '@/lib/sheets.ts';
import { apiSuccess, apiError } from '@/lib/utils.ts';

export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');

    let siswas = await readSheet<any>('SISWA');

    if (kelas) {
      siswas = siswas.filter((s) => s.kelas === kelas);
    }

    // Urutkan berdasarkan nama siswa
    siswas.sort((a, b) => a.nama.localeCompare(b.nama));

    return new Response(JSON.stringify(apiSuccess(siswas, 'Daftar siswa kelas berhasil dimuat.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat siswa: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
