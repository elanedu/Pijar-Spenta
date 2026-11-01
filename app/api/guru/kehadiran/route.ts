/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Kehadiran & Presensi Guru
 * GET /api/guru/kehadiran?kelas=...&mapel=...&tanggal=...
 * POST /api/guru/kehadiran (Simpan presensi harian H/I/S/A)
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, appendRow, updateRow } from '@/lib/sheets.ts';
import { apiSuccess, apiError, generateId, getTimestamp, getTanggalHariIni } from '@/lib/utils.ts';

// GET: Ambil riwayat presensi
export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin', 'siswa']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const kelas = searchParams.get('kelas');
    const mapel = searchParams.get('mapel');
    const tanggal = searchParams.get('tanggal');
    const nis = searchParams.get('nis');

    let records = await readSheet<any>('KEHADIRAN');

    if (kelas) records = records.filter((r) => r.kelas === kelas);
    if (mapel) records = records.filter((r) => r.mapel?.toLowerCase() === mapel.toLowerCase());
    if (tanggal) records = records.filter((r) => r.tanggal === tanggal);
    if (nis) records = records.filter((r) => r.nis === nis);

    // Hitung rekap statistik H/I/S/A
    const rekap = {
      total: records.length,
      hadir: records.filter((r) => r.status === 'H').length,
      izin: records.filter((r) => r.status === 'I').length,
      sakit: records.filter((r) => r.status === 'S').length,
      alpa: records.filter((r) => r.status === 'A').length,
    };

    return new Response(
      JSON.stringify(apiSuccess({ records, rekap }, 'Data kehadiran berhasil dimuat.')),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat kehadiran: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Simpan atau update presensi harian per siswa
export async function POST(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin']);
    if (!auth.authorized || !auth.session) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const { tanggal, topik, mapel, kelas, kehadiran } = body;

    if (!mapel || !kelas || !Array.isArray(kehadiran)) {
      return new Response(
        JSON.stringify(apiError('Parameter kelas, mapel, dan daftar kehadiran wajib diisi.')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tgl = tanggal || getTanggalHariIni();
    const guruNama = auth.session.nama;
    const nowIso = getTimestamp();

    const existingRecords = await readSheet<any>('KEHADIRAN');

    // Proses penyimpanan setiap siswa
    for (const item of kehadiran) {
      const { nis, nama, status } = item;
      if (!nis) continue;

      // Cek apakah siswa ini sudah diabsen pada tanggal & mapel yang sama
      const existing = existingRecords.find(
        (r) => r.tanggal === tgl && r.nis === String(nis) && r.mapel?.toLowerCase() === mapel.toLowerCase()
      );

      if (existing) {
        // Update baris yang sudah ada
        await updateRow(
          'KEHADIRAN',
          existing.id,
          {
            topik: topik || existing.topik || 'KBM Reguler',
            status: status || 'H',
            guru: guruNama,
            timestamp: nowIso,
          },
          'id'
        );
      } else {
        // Tambahkan baris baru
        const newId = generateId('ABS');
        await appendRow('KEHADIRAN', {
          id: newId,
          tanggal: tgl,
          nis: String(nis),
          nama: nama || '',
          kelas,
          mapel,
          topik: topik || 'KBM Reguler',
          status: status || 'H',
          guru: guruNama,
          timestamp: nowIso,
        });
      }
    }

    return new Response(
      JSON.stringify(apiSuccess(null, `Presensi untuk ${kehadiran.length} siswa berhasil disimpan.`)),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menyimpan kehadiran: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
