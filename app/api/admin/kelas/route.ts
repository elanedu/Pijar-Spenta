/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API CRUD Kelas & Rombel
 * GET /api/admin/kelas
 * POST /api/admin/kelas (Create, Update)
 * DELETE /api/admin/kelas?id=...
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, appendRow, updateRow, deleteRow } from '@/lib/sheets.ts';
import { apiSuccess, apiError, generateId } from '@/lib/utils.ts';

// GET: Daftar Seluruh Kelas
export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['admin', 'guru', 'siswa']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const kelases = await readSheet<any>('KELAS');
    return new Response(JSON.stringify(apiSuccess(kelases, 'Daftar kelas berhasil dimuat.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat kelas: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Tambah atau Update Rombel Kelas
export async function POST(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const { id, nama_kelas, tingkat, wali_kelas, tahun_ajaran } = body;

    if (!nama_kelas || !tingkat) {
      return new Response(
        JSON.stringify(apiError('Nama kelas dan tingkat wajib diisi.')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Jika Update Kelas
    if (id) {
      const updateData = {
        nama_kelas: nama_kelas.trim(),
        tingkat: String(tingkat).trim(),
        wali_kelas: wali_kelas?.trim() || '-',
        tahun_ajaran: tahun_ajaran?.trim() || '2024/2025',
      };
      await updateRow('KELAS', id, updateData, 'id');
      return new Response(JSON.stringify(apiSuccess(null, 'Data kelas berhasil diperbarui.')), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tambah Kelas Baru
    const newKelasId = generateId('KLS');
    const newKelas = {
      id: newKelasId,
      nama_kelas: nama_kelas.trim(),
      tingkat: String(tingkat).trim(),
      wali_kelas: wali_kelas?.trim() || '-',
      tahun_ajaran: tahun_ajaran?.trim() || '2024/2025',
    };

    await appendRow('KELAS', newKelas);

    return new Response(
      JSON.stringify(apiSuccess({ id: newKelasId }, 'Rombel kelas baru berhasil ditambahkan.')),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memproses data kelas: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Hapus Rombel Kelas
export async function DELETE(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify(apiError('Parameter ID kelas diperlukan.')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteRow('KELAS', id, 'id');
    return new Response(JSON.stringify(apiSuccess(null, 'Rombel kelas berhasil dihapus.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menghapus data kelas: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
