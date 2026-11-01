/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Admin Dashboard
 * GET /api/admin/dashboard
 * Mengembalikan statistik agregat: jumlah guru, siswa, kelas, mapel, kehadiran hari ini, rata-rata nilai
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, getAllSettings } from '@/lib/sheets.ts';
import { apiSuccess, apiError, getTanggalHariIni, hitungRataRata } from '@/lib/utils.ts';

export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['admin']);
    if (!auth.authorized) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const hariIni = getTanggalHariIni();

    // Baca data secara paralel dari Google Sheets
    const [gurus, siswas, kelases, mapels, kehadirans, nilais, settings] = await Promise.all([
      readSheet<any>('GURU'),
      readSheet<any>('SISWA'),
      readSheet<any>('KELAS'),
      readSheet<any>('MAPEL'),
      readSheet<any>('KEHADIRAN'),
      readSheet<any>('NILAI'),
      getAllSettings(),
    ]);

    // Filter kehadiran hari ini
    const kehadiranHariIni = kehadirans.filter((k) => k.tanggal === hariIni);
    const countHadir = kehadiranHariIni.filter((k) => k.status === 'H').length;
    const countIzin = kehadiranHariIni.filter((k) => k.status === 'I').length;
    const countSakit = kehadiranHariIni.filter((k) => k.status === 'S').length;
    const countAlpa = kehadiranHariIni.filter((k) => k.status === 'A').length;

    const persentaseHadir =
      kehadiranHariIni.length > 0
        ? Math.round((countHadir / kehadiranHariIni.length) * 100)
        : 100;

    // Rata-rata nilai keseluruhan
    const semuaNilai = nilais.map((n) => n.nilai).filter(Boolean);
    const rataRataNilai = hitungRataRata(semuaNilai);

    // KKM dari pengaturan
    const kkm = parseFloat(settings.kkm_default || '75') || 75;
    const nilaiTuntas = nilais.filter((n) => parseFloat(n.nilai) >= kkm).length;
    const persentaseTuntas =
      nilais.length > 0 ? Math.round((nilaiTuntas / nilais.length) * 100) : 0;

    return new Response(
      JSON.stringify(
        apiSuccess({
          stats: {
            totalGuru: gurus.length,
            totalSiswa: siswas.length,
            totalKelas: kelases.length,
            totalMapel: mapels.length,
            kehadiranHariIni: {
              total: kehadiranHariIni.length,
              hadir: countHadir,
              izin: countIzin,
              sakit: countSakit,
              alpa: countAlpa,
              persentaseHadir,
            },
            nilai: {
              totalEntri: nilais.length,
              rataRata: rataRataNilai,
              kkm,
              tuntas: nilaiTuntas,
              persentaseTuntas,
            },
          },
          sekolah: settings,
        })
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error dashboard admin:', error);
    return new Response(JSON.stringify(apiError('Gagal memuat statistik dashboard.')), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
