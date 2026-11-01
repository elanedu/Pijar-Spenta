/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API CRUD Siswa
 * GET /api/admin/siswa
 * POST /api/admin/siswa (Create, Update)
 * DELETE /api/admin/siswa?id=...
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, appendRow, updateRow, deleteRow } from '@/lib/sheets.ts';
import { hashPassword } from '@/lib/auth.ts';
import { apiSuccess, apiError, generateId, getTimestamp } from '@/lib/utils.ts';

// GET: Daftar Seluruh Siswa
export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['admin', 'guru']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const kelasFilter = searchParams.get('kelas');

    let siswas = await readSheet<any>('SISWA');

    if (kelasFilter) {
      siswas = siswas.filter((s) => s.kelas === kelasFilter);
    }

    return new Response(JSON.stringify(apiSuccess(siswas, 'Daftar siswa berhasil dimuat.')), {
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

// POST: Tambah atau Update Siswa
export async function POST(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const { id, user_id, nis, nama, kelas, jenis_kelamin, aktif, email, foto, password } = body;

    if (!nis || !nama || !kelas) {
      return new Response(
        JSON.stringify(apiError('NIS, nama siswa, dan kelas rombel wajib diisi.')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Jika Update Siswa
    if (id) {
      const updateData = {
        nis: String(nis).trim(),
        nama: nama.trim(),
        kelas: kelas.trim(),
        jenis_kelamin: jenis_kelamin || 'L',
        aktif: aktif || 'Ya',
        email: email?.trim() || `${nis}@siswa.pijar-spenta.sch.id`,
        foto: foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nama)}`,
      };
      await updateRow('SISWA', id, updateData, 'id');

      if (user_id) {
        await updateRow('USERS', user_id, { nama: nama.trim(), aktif: aktif || 'Ya' }, 'id');
      }

      return new Response(JSON.stringify(apiSuccess(null, 'Data siswa berhasil diperbarui.')), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tambah Siswa Baru:
    // Buat akun USERS otomatis dengan username = NIS dan password default = siswa123 (atau custom)
    const newUserId = generateId('USR');
    const defaultPassword = password || 'siswa123';
    const cleanNis = String(nis).trim();

    await appendRow('USERS', {
      id: newUserId,
      username: cleanNis,
      password_hash: hashPassword(defaultPassword),
      role: 'siswa',
      nama: nama.trim(),
      email: email?.trim() || `${cleanNis}@siswa.pijar-spenta.sch.id`,
      aktif: aktif || 'Ya',
      timestamp: getTimestamp(),
    });

    const newSiswaId = generateId('SIS');
    const newSiswa = {
      id: newSiswaId,
      user_id: newUserId,
      nis: cleanNis,
      nama: nama.trim(),
      kelas: kelas.trim(),
      jenis_kelamin: jenis_kelamin || 'L',
      aktif: aktif || 'Ya',
      email: email?.trim() || `${cleanNis}@siswa.pijar-spenta.sch.id`,
      foto: foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nama)}`,
    };

    await appendRow('SISWA', newSiswa);

    return new Response(
      JSON.stringify(apiSuccess({ id: newSiswaId }, 'Data siswa baru berhasil disimpan.')),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memproses data siswa: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Hapus Siswa
export async function DELETE(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify(apiError('Parameter ID siswa diperlukan.')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteRow('SISWA', id, 'id');
    return new Response(JSON.stringify(apiSuccess(null, 'Data siswa berhasil dihapus.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menghapus data siswa: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
