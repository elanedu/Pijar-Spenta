/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API CRUD Users
 * GET /api/admin/users
 * POST /api/admin/users (Create, Update, Reset Password)
 * DELETE /api/admin/users?id=...
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, appendRow, updateRow, deleteRow } from '@/lib/sheets.ts';
import { hashPassword } from '@/lib/auth.ts';
import { apiSuccess, apiError, generateId, getTimestamp } from '@/lib/utils.ts';

// GET: Ambil daftar seluruh user (tanpa password_hash)
export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const users = await readSheet<any>('USERS');
    // Hilangkan password_hash sebelum dikirim ke client
    const sanitized = users.map((u) => {
      const { password_hash, ...rest } = u;
      return rest;
    });

    return new Response(JSON.stringify(apiSuccess(sanitized, 'Daftar pengguna berhasil dimuat.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat pengguna: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Tambah, Update, atau Reset Password User
export async function POST(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const { id, username, password, role, nama, email, aktif, action } = body;

    // Aksi 1: Reset Password saja
    if (action === 'reset_password') {
      if (!id || !password) {
        return new Response(JSON.stringify(apiError('ID User dan password baru wajib diisi.')), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const newHash = hashPassword(password);
      await updateRow('USERS', id, { password_hash: newHash }, 'id');
      return new Response(JSON.stringify(apiSuccess(null, 'Password pengguna berhasil direset.')), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Aksi 2: Edit User yang Sudah Ada
    if (id) {
      const updatePayload: Record<string, any> = {
        username: username?.trim().toLowerCase(),
        role: role || 'siswa',
        nama: nama?.trim(),
        email: email?.trim() || '',
        aktif: aktif || 'Ya',
      };

      if (password && password.trim().length > 0) {
        updatePayload.password_hash = hashPassword(password);
      }

      await updateRow('USERS', id, updatePayload, 'id');
      return new Response(JSON.stringify(apiSuccess(null, 'Data pengguna berhasil diperbarui.')), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Aksi 3: Tambah User Baru
    if (!username || !password || !nama) {
      return new Response(
        JSON.stringify(apiError('Username, password, dan nama lengkap wajib diisi.')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validasi keunikan username
    const existingUsers = await readSheet<any>('USERS');
    const cleanUsername = username.trim().toLowerCase();
    if (existingUsers.some((u) => u.username && u.username.toLowerCase() === cleanUsername)) {
      return new Response(
        JSON.stringify(apiError(`Username '${username}' sudah digunakan oleh pengguna lain.`)),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newId = generateId('USR');
    const newUser = {
      id: newId,
      username: cleanUsername,
      password_hash: hashPassword(password),
      role: role || 'siswa',
      nama: nama.trim(),
      email: email?.trim() || '',
      aktif: aktif || 'Ya',
      timestamp: getTimestamp(),
    };

    await appendRow('USERS', newUser);

    return new Response(
      JSON.stringify(apiSuccess({ id: newId }, 'Pengguna baru berhasil ditambahkan.')),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memproses pengguna: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Hapus Pengguna berdasarkan ID
export async function DELETE(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify(apiError('Parameter ID pengguna diperlukan.')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteRow('USERS', id, 'id');
    return new Response(JSON.stringify(apiSuccess(null, 'Pengguna berhasil dihapus.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menghapus pengguna: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
