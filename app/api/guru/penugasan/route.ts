/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Penugasan Belajar Siswa
 * GET /api/guru/penugasan?kelas=...&mapel=...
 * POST /api/guru/penugasan
 * DELETE /api/guru/penugasan?id=...
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, appendRow, deleteRow } from '@/lib/sheets.ts';
import { apiSuccess, apiError, generateId, getTimestamp } from '@/lib/utils.ts';

// GET: Ambil daftar penugasan kelas
export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin', 'siswa']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');
    const mapelId = searchParams.get('mapelId');

    let records = await readSheet<any>('PENUGASAN');

    if (kelas) {
      records = records.filter(
        (r) => r.target_kelas === kelas || r.target_kelas === 'Semua' || r.target_kelas?.includes(kelas)
      );
    }

    if (mapelId) {
      records = records.filter((r) => r.mapel_id === mapelId);
    }

    // Urutkan deadline
    records.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    return new Response(JSON.stringify(apiSuccess(records, 'Daftar penugasan berhasil dimuat.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat tugas: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Buat Tugas Baru
export async function POST(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin']);
    if (!auth.authorized || !auth.session) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const { mapel_id, target_kelas, target_siswa, judul, deskripsi, deadline } = body;

    if (!judul || !target_kelas || !deadline) {
      return new Response(
        JSON.stringify(apiError('Judul tugas, target kelas, dan batas waktu pengumpulan (deadline) wajib diisi.')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newId = generateId('TSK');
    const newRecord = {
      id: newId,
      mapel_id: mapel_id || 'MPL-001',
      target_kelas: target_kelas.trim(),
      target_siswa: target_siswa || 'Semua',
      judul: judul.trim(),
      deskripsi: deskripsi?.trim() || '',
      deadline: deadline.trim(),
      guru_id: auth.session.id,
      timestamp: getTimestamp(),
    };

    await appendRow('PENUGASAN', newRecord);

    return new Response(
      JSON.stringify(apiSuccess({ id: newId }, 'Tugas belajar baru berhasil diterbitkan.')),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menerbitkan tugas: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Hapus Tugas
export async function DELETE(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify(apiError('Parameter ID tugas diperlukan.')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteRow('PENUGASAN', id, 'id');
    return new Response(JSON.stringify(apiSuccess(null, 'Tugas berhasil dihapus.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menghapus tugas: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
