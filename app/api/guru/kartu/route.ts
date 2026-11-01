/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Kartu Kelas Guru
 * GET /api/guru/kartu
 * Mengembalikan daftar rombel/kelas yang diampu oleh guru yang sedang login
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet } from '@/lib/sheets.ts';
import { apiSuccess, apiError } from '@/lib/utils.ts';

export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['guru', 'admin']);
    if (!auth.authorized || !auth.session) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const session = auth.session;

    const [gurus, mapels, kelases, siswas] = await Promise.all([
      readSheet<any>('GURU'),
      readSheet<any>('MAPEL'),
      readSheet<any>('KELAS'),
      readSheet<any>('SISWA'),
    ]);

    // Cari profil guru berdasarkan session
    const currentGuru = gurus.find(
      (g) =>
        g.user_id === session.id ||
        g.nip === session.extraId ||
        g.nama?.toLowerCase() === session.nama?.toLowerCase()
    );

    const guruNama = currentGuru ? currentGuru.nama : session.nama;
    const guruId = currentGuru ? currentGuru.id : 'GRU-001';

    // Cari mapel yang diajar oleh guru ini
    let guruMapels = mapels.filter(
      (m) =>
        m.guru_id === guruId ||
        m.guru_id === session.id ||
        m.nama_mapel?.toLowerCase() === session.mapel?.toLowerCase()
    );

    // Fallback jika admin login atau guru belum di-assign spesifik
    if (guruMapels.length === 0 && mapels.length > 0) {
      guruMapels = mapels;
    }

    // Ekstrak rombel per mapel menjadi daftar card kelas
    const cards: any[] = [];

    guruMapels.forEach((m) => {
      const kelasList = String(m.kelas_diampu || '7A')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      kelasList.forEach((kls) => {
        const countSiswa = siswas.filter((s) => s.kelas === kls).length;
        const kelasInfo = kelases.find((k) => k.nama_kelas === kls);

        cards.push({
          id: `${m.kode || m.id}_${kls}`,
          mapelId: m.id,
          kodeMapel: m.kode || 'MAPEL',
          namaMapel: m.nama_mapel,
          kelas: kls,
          tingkat: kelasInfo?.tingkat || kls.charAt(0) || '7',
          waliKelas: kelasInfo?.wali_kelas || '-',
          tahunAjaran: kelasInfo?.tahun_ajaran || '2024/2025',
          jumlahSiswa: countSiswa,
          guruNama,
        });
      });
    });

    return new Response(
      JSON.stringify(
        apiSuccess(
          {
            guru: {
              nama: guruNama,
              nip: currentGuru?.nip || session.extraId || '-',
              mapelUtama: currentGuru?.mapel_utama || session.mapel || '-',
            },
            cards,
          },
          'Daftar kartu kelas berhasil dimuat.'
        )
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify(apiError('Gagal memuat kartu kelas: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
