/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Penilaian & Analisis KKM Guru
 * GET /api/guru/nilai?kelas=...&mapel=...
 * POST /api/guru/nilai (Simpan atau perbarui nilai siswa)
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, appendRow, updateRow } from '@/lib/sheets.ts';
import { apiSuccess, apiError, generateId, getTimestamp, getTanggalHariIni } from '@/lib/utils.ts';

// GET: Ambil daftar nilai per kelas dan mapel
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

    let records = await readSheet<any>('NILAI');

    if (kelas) records = records.filter((r) => r.kelas === kelas);
    if (mapel) records = records.filter((r) => r.mapel?.toLowerCase() === mapel.toLowerCase());
    if (nis) records = records.filter((r) => r.nis === nis);

    // Ambil daftar unik jenis penilaian yang pernah diinput
    const jenisNilaiSet = new Set<string>();
    records.forEach((r) => {
      if (r.jenis_nilai) jenisNilaiSet.add(r.jenis_nilai);
    });

    return new Response(
      JSON.stringify(
        apiSuccess(
          {
            records,
            kolomPenilaian: Array.from(jenisNilaiSet),
          },
          'Data penilaian berhasil dimuat.'
        )
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat nilai: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Simpan atau perbarui nilai siswa (batch atau per baris)
export async function POST(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin']);
    if (!auth.authorized || !auth.session) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const { tanggal, nis, nama, kelas, mapel, jenis_nilai, nilai, batchList } = body;

    const tgl = tanggal || getTanggalHariIni();
    const guruNama = auth.session.nama;
    const nowIso = getTimestamp();

    const existingRecords = await readSheet<any>('NILAI');

    // Skenario 1: Input batch nilai satu kolom (misal: "Sumatif 1" untuk satu kelas)
    if (Array.isArray(batchList) && batchList.length > 0 && jenis_nilai && kelas && mapel) {
      for (const item of batchList) {
        if (!item.nis || item.nilai === undefined || item.nilai === null || item.nilai === '') continue;

        const existing = existingRecords.find(
          (r) =>
            r.nis === String(item.nis) &&
            r.kelas === kelas &&
            r.mapel?.toLowerCase() === mapel.toLowerCase() &&
            r.jenis_nilai === jenis_nilai
        );

        if (existing) {
          await updateRow(
            'NILAI',
            existing.id,
            {
              nilai: String(item.nilai),
              tanggal: tgl,
              guru: guruNama,
              timestamp: nowIso,
            },
            'id'
          );
        } else {
          const newId = generateId('NIL');
          await appendRow('NILAI', {
            id: newId,
            tanggal: tgl,
            nis: String(item.nis),
            nama: item.nama || '',
            kelas,
            mapel,
            jenis_nilai,
            nilai: String(item.nilai),
            guru: guruNama,
            timestamp: nowIso,
          });
        }
      }

      return new Response(
        JSON.stringify(apiSuccess(null, `Nilai '${jenis_nilai}' berhasil disimpan untuk kelas ${kelas}.`)),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Skenario 2: Edit nilai satu siswa inline
    if (!nis || !kelas || !mapel || !jenis_nilai) {
      return new Response(
        JSON.stringify(apiError('Parameter nis, kelas, mapel, jenis_nilai wajib diisi.')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const existing = existingRecords.find(
      (r) =>
        r.nis === String(nis) &&
        r.kelas === kelas &&
        r.mapel?.toLowerCase() === mapel.toLowerCase() &&
        r.jenis_nilai === jenis_nilai
    );

    if (existing) {
      await updateRow(
        'NILAI',
        existing.id,
        {
          nilai: String(nilai),
          tanggal: tgl,
          guru: guruNama,
          timestamp: nowIso,
        },
        'id'
      );
    } else {
      const newId = generateId('NIL');
      await appendRow('NILAI', {
        id: newId,
        tanggal: tgl,
        nis: String(nis),
        nama: nama || '',
        kelas,
        mapel,
        jenis_nilai,
        nilai: String(nilai),
        guru: guruNama,
        timestamp: nowIso,
      });
    }

    return new Response(JSON.stringify(apiSuccess(null, 'Nilai berhasil disimpan.')), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal menyimpan nilai: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
