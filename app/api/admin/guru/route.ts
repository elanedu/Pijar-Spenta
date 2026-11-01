/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API CRUD Guru
 * GET /api/admin/guru
 * POST /api/admin/guru (Create, Update)
 * DELETE /api/admin/guru?id=...
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, appendRow, updateRow, deleteRow } from '@/lib/sheets.ts';
import { hashPassword } from '@/lib/auth.ts';
import { apiSuccess, apiError, generateId, getTimestamp } from '@/lib/utils.ts';

// GET: Daftar Seluruh Guru
export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['admin', 'guru']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const gurus = await readSheet<any>('GURU');
    return new Response(JSON.stringify(apiSuccess(gurus, 'Daftar guru berhasil dimuat.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat guru: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Tambah atau Update Guru
export async function POST(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const { id, user_id, nip, nama, mapel_utama, status, username, password } = body;

    if (!nama || !nip || !mapel_utama) {
      return new Response(
        JSON.stringify(apiError('Nama guru, NIP, dan mata pelajaran utama wajib diisi.')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Jika Update Guru yang sudah ada
    if (id) {
      const updateData = {
        nip: nip.trim(),
        nama: nama.trim(),
        mapel_utama: mapel_utama.trim(),
        status: status || 'Aktif',
      };
      await updateRow('GURU', id, updateData, 'id');

      // Jika user_id ada, update juga nama di sheet USERS
      if (user_id) {
        await updateRow('USERS', user_id, { nama: nama.trim() }, 'id');
      }

      return new Response(JSON.stringify(apiSuccess(null, 'Data guru berhasil diperbarui.')), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tambah Guru Baru:
    // Buat akun USERS otomatis jika username & password disediakan
    let finalUserId = user_id;
    if (!finalUserId && username && password) {
      const newUserId = generateId('USR');
      await appendRow('USERS', {
        id: newUserId,
        username: username.trim().toLowerCase(),
        password_hash: hashPassword(password),
        role: 'guru',
        nama: nama.trim(),
        email: `${username.trim().toLowerCase()}@pijar-spenta.sch.id`,
        aktif: 'Ya',
        timestamp: getTimestamp(),
      });
      finalUserId = newUserId;
    }

    const newGuruId = generateId('GRU');
    const newGuru = {
      id: newGuruId,
      user_id: finalUserId || `USR-${newGuruId}`,
      nip: nip.trim(),
      nama: nama.trim(),
      mapel_utama: mapel_utama.trim(),
      status: status || 'Aktif',
    };

    await appendRow('GURU', newGuru);

    return new Response(
      JSON.stringify(apiSuccess({ id: newGuruId }, 'Data guru berhasil ditambahkan.')),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memproses data guru: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Hapus Guru
export async function DELETE(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify(apiError('Parameter ID guru diperlukan.')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteRow('GURU', id, 'id');
    return new Response(JSON.stringify(apiSuccess(null, 'Data guru berhasil dihapus.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menghapus data guru: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
