/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - API Portal Siswa
 * GET /api/siswa/dashboard
 * Mengumpulkan seluruh data siswa yang sedang login:
 * Biodata, Rekap Kehadiran (H/I/S/A), Buku Nilai per Mapel & KKM, Jurnal Catatan, Tugas Belajar, dan Data Raport
 */

import { checkRole } from '@/lib/session.ts';
import { readSheet, getAllSettings } from '@/lib/sheets.ts';
import { apiSuccess, apiError, hitungRataRata, cekStatusKKM } from '@/lib/utils.ts';

export async function GET(request: Request) {
  try {
    const auth = await checkRole(request, ['siswa', 'admin', 'guru']);
    if (!auth.authorized || !auth.session) {
      return new Response(JSON.stringify(apiError(auth.message)), { status: auth.status });
    }

    const session = auth.session;
    const studentNis = session.extraId || session.username;

    // Baca data secara paralel dari Google Sheets
    const [siswas, kelases, mapels, kehadirans, nilais, catatans, penugasans, settings] =
      await Promise.all([
        readSheet<any>('SISWA'),
        readSheet<any>('KELAS'),
        readSheet<any>('MAPEL'),
        readSheet<any>('KEHADIRAN'),
        readSheet<any>('NILAI'),
        readSheet<any>('CATATAN'),
        readSheet<any>('PENUGASAN'),
        getAllSettings(),
      ]);

    // Cari profil siswa
    let student = siswas.find(
      (s) => s.nis === studentNis || s.user_id === session.id || s.nama === session.nama
    );

    // Fallback jika admin/guru sedang menguji coba portal siswa
    if (!student && siswas.length > 0) {
      student = siswas[0];
    }

    if (!student) {
      return new Response(JSON.stringify(apiError('Data siswa tidak ditemukan.')), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const kelas = student.kelas;
    const kelasInfo = kelases.find((k) => k.nama_kelas === kelas);
    const kkmDefault = parseFloat(settings.kkm_default || '75') || 75;

    // 1. Filter Kehadiran Siswa
    const studentKehadiran = kehadirans.filter((k) => k.nis === student.nis);
    studentKehadiran.sort(
      (a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime()
    );

    const countHadir = studentKehadiran.filter((k) => k.status === 'H').length;
    const countIzin = studentKehadiran.filter((k) => k.status === 'I').length;
    const countSakit = studentKehadiran.filter((k) => k.status === 'S').length;
    const countAlpa = studentKehadiran.filter((k) => k.status === 'A').length;

    const persentaseHadir =
      studentKehadiran.length > 0
        ? Math.round((countHadir / studentKehadiran.length) * 100)
        : 100;

    // 2. Filter Nilai Siswa & Kelompokkan per Mapel
    const studentNilai = nilais.filter((n) => n.nis === student.nis);

    // Dapatkan semua mapel yang relevan untuk rombel ini
    const relevantMapels = mapels.filter((m) =>
      String(m.kelas_diampu || '').includes(kelas)
    );

    const targetMapels = relevantMapels.length > 0 ? relevantMapels : mapels;

    const nilaiPerMapel = targetMapels.map((m) => {
      const records = studentNilai.filter(
        (n) => n.mapel?.toLowerCase() === m.nama_mapel?.toLowerCase()
      );
      const scoreNums = records.map((r) => parseFloat(r.nilai)).filter((v) => !isNaN(v));
      const rataRata = hitungRataRata(scoreNums);
      const { tuntas, predikat, keterangan } = cekStatusKKM(rataRata, kkmDefault);

      return {
        mapelId: m.id,
        kode: m.kode,
        namaMapel: m.nama_mapel,
        guruId: m.guru_id,
        records,
        rataRata,
        kkm: kkmDefault,
        tuntas,
        predikat,
        keterangan,
      };
    });

    const semuaNilaiAngka = nilaiPerMapel
      .map((m) => m.rataRata)
      .filter((n) => n > 0);

    const rataRataAkademikGlobal = hitungRataRata(semuaNilaiAngka);

    // 3. Filter Catatan Sikap Siswa
    const studentCatatan = catatans.filter((c) => c.nis === student.nis);
    studentCatatan.sort(
      (a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime()
    );

    // 4. Filter Penugasan Kelas Siswa
    const studentTugas = penugasans.filter(
      (t) =>
        t.target_kelas === kelas ||
        t.target_kelas === 'Semua' ||
        String(t.target_kelas || '').includes(kelas)
    );
    studentTugas.sort(
      (a, b) => new Date(b.deadline || 0).getTime() - new Date(a.deadline || 0).getTime()
    );

    return new Response(
      JSON.stringify(
        apiSuccess(
          {
            siswa: student,
            waliKelas: kelasInfo?.wali_kelas || 'Budi Santoso, S.Pd.',
            tahunAjaran: kelasInfo?.tahun_ajaran || settings.tahun_ajaran || '2024/2025',
            semester: settings.semester || 'Ganjil',
            sekolah: settings,
            kehadiran: {
              records: studentKehadiran,
              total: studentKehadiran.length,
              hadir: countHadir,
              izin: countIzin,
              sakit: countSakit,
              alpa: countAlpa,
              persentaseHadir,
            },
            nilai: {
              perMapel: nilaiPerMapel,
              rataRataGlobal: rataRataAkademikGlobal,
              kkm: kkmDefault,
              statusGlobal: cekStatusKKM(rataRataAkademikGlobal, kkmDefault),
            },
            catatan: studentCatatan,
            penugasan: studentTugas,
          },
          'Data akademik siswa berhasil dimuat.'
        )
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error pada /api/siswa/dashboard:', error);
    return new Response(JSON.stringify(apiError('Gagal memuat data siswa: ' + error.message)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
