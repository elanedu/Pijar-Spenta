/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API CRUD Mata Pelajaran & Assignment Guru/Kelas
 * GET /api/admin/mapel
 * POST /api/admin/mapel (Create, Update, Assign)
 * DELETE /api/admin/mapel?id=...
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, appendRow, updateRow, deleteRow } from '@/lib/sheets.ts';
import { apiSuccess, apiError, generateId } from '@/lib/utils.ts';

// GET: Daftar Seluruh Mapel dengan informasi Guru
export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['admin', 'guru', 'siswa']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const [mapels, gurus] = await Promise.all([
      readSheet<any>('MAPEL'),
      readSheet<any>('GURU'),
    ]);

    // Tambahkan nama guru untuk kenyamanan tampilan
    const mapelsWithGuru = mapels.map((m) => {
      const guru = gurus.find((g) => g.id === m.guru_id || g.user_id === m.guru_id);
      return {
        ...m,
        nama_guru: guru ? guru.nama : '-',
      };
    });

    return new Response(JSON.stringify(apiSuccess(mapelsWithGuru, 'Daftar mapel berhasil dimuat.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat mapel: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Tambah, Update Mapel & Penugasan Guru/Kelas
export async function POST(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const { id, kode, nama_mapel, guru_id, kelas_diampu } = body;

    if (!kode || !nama_mapel) {
      return new Response(
        JSON.stringify(apiError('Kode mapel dan nama mata pelajaran wajib diisi.')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Jika Update Mapel
    if (id) {
      const updateData = {
        kode: kode.trim().toUpperCase(),
        nama_mapel: nama_mapel.trim(),
        guru_id: guru_id?.trim() || '-',
        kelas_diampu: kelas_diampu?.trim() || '-',
      };
      await updateRow('MAPEL', id, updateData, 'id');
      return new Response(JSON.stringify(apiSuccess(null, 'Data mata pelajaran berhasil diperbarui.')), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tambah Mapel Baru
    const newMapelId = generateId('MPL');
    const newMapel = {
      id: newMapelId,
      kode: kode.trim().toUpperCase(),
      nama_mapel: nama_mapel.trim(),
      guru_id: guru_id?.trim() || '-',
      kelas_diampu: kelas_diampu?.trim() || '-',
    };

    await appendRow('MAPEL', newMapel);

    return new Response(
      JSON.stringify(apiSuccess({ id: newMapelId }, 'Mata pelajaran berhasil ditambahkan.')),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memproses mapel: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Hapus Mapel
export async function DELETE(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify(apiError('Parameter ID mapel diperlukan.')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteRow('MAPEL', id, 'id');
    return new Response(JSON.stringify(apiSuccess(null, 'Mata pelajaran berhasil dihapus.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menghapus mapel: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
