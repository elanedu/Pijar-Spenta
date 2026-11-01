/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Catatan Perkembangan Karakter Siswa
 * GET /api/guru/catatan?kelas=...&mapel=...
 * POST /api/guru/catatan
 * DELETE /api/guru/catatan?id=...
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, appendRow, deleteRow } from '@/lib/sheets.ts';
import { apiSuccess, apiError, generateId, getTimestamp, getTanggalHariIni } from '@/lib/utils.ts';

// GET: Ambil jurnal catatan siswa
export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin', 'siswa']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');
    const mapel = searchParams.get('mapel');
    const nis = searchParams.get('nis');

    let records = await readSheet<any>('CATATAN');

    if (kelas) records = records.filter((r) => r.kelas === kelas);
    if (mapel) records = records.filter((r) => r.mapel?.toLowerCase() === mapel.toLowerCase());
    if (nis) records = records.filter((r) => r.nis === nis);

    // Urutkan catatan dari yang terbaru
    records.sort((a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime());

    return new Response(JSON.stringify(apiSuccess(records, 'Catatan perkembangan berhasil dimuat.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat catatan: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Tambah Catatan Baru
export async function POST(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin']);
    if (!auth.authorized || !auth.session) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const { tanggal, nis, nama, kelas, mapel, jenis, keterangan, nilai_deskripsi } = body;

    if (!nis || !kelas || !mapel || !keterangan) {
      return new Response(
        JSON.stringify(apiError('Siswa, kelas, mapel, dan keterangan catatan wajib diisi.')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newId = generateId('CAT');
    const newRecord = {
      id: newId,
      tanggal: tanggal || getTanggalHariIni(),
      nis: String(nis),
      nama: nama || '',
      kelas,
      mapel,
      jenis: jenis || 'Positif',
      keterangan: keterangan.trim(),
      nilai_deskripsi: nilai_deskripsi || (jenis === 'Positif' ? 'Sangat Baik' : 'Perlu Pembinaan'),
      guru: auth.session.nama,
      timestamp: getTimestamp(),
    };

    await appendRow('CATATAN', newRecord);

    return new Response(
      JSON.stringify(apiSuccess({ id: newId }, 'Catatan perkembangan berhasil disimpan.')),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menyimpan catatan: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Hapus Catatan
export async function DELETE(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify(apiError('Parameter ID catatan diperlukan.')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteRow('CATATAN', id, 'id');
    return new Response(JSON.stringify(apiSuccess(null, 'Catatan berhasil dihapus.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menghapus catatan: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
