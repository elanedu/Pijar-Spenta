'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Admin Dashboard Statistik
 * app/admin/page.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarCheck,
  Award,
  ArrowUpRight,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { TabelCetak } from '@/components/TabelCetak.tsx';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = data?.stats;
  const sekolah = data?.sekolah;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Statistik Sekolah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ringkasan data guru, siswa, kelas, persentase kehadiran, dan capaian nilai akademik
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchDashboardData}
          >
            Segarkan
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => setIsPrintModalOpen(true)}
          >
            Cetak Rekap Global
          </Button>
        </div>
      </div>

      {/* 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Tenaga Pendidik</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {loading ? '...' : `${stats?.totalGuru || 0} Guru`}
            </h3>
            <p className="text-[11px] text-indigo-600 font-medium">Status Aktif</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Peserta Didik</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {loading ? '...' : `${stats?.totalSiswa || 0} Siswa`}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium">Terdaftar di Sistem</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <School className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Rombongan Belajar</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {loading ? '...' : `${stats?.totalKelas || 0} Kelas`}
            </h3>
            <p className="text-[11px] text-blue-600 font-medium">Tingkat 7 & 8</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Mata Pelajaran</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {loading ? '...' : `${stats?.totalMapel || 0} Mapel`}
            </h3>
            <p className="text-[11px] text-amber-600 font-medium">Kurikulum Merdeka</p>
          </div>
        </div>
      </div>

      {/* 2 Card Analisis: Kehadiran Hari Ini & Capaian Nilai KKM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rekap Kehadiran */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Presensi & Kehadiran Hari Ini
              </h3>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
              {stats?.kehadiranHariIni?.persentaseHadir || 0}% Hadir
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-xs text-emerald-800 font-medium">Hadir</p>
              <h4 className="text-xl font-black text-emerald-900 mt-1">
                {stats?.kehadiranHariIni?.hadir || 0}
              </h4>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800 font-medium">Izin</p>
              <h4 className="text-xl font-black text-blue-900 mt-1">
                {stats?.kehadiranHariIni?.izin || 0}
              </h4>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800 font-medium">Sakit</p>
              <h4 className="text-xl font-black text-amber-900 mt-1">
                {stats?.kehadiranHariIni?.sakit || 0}
              </h4>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="text-xs text-rose-800 font-medium">Alpa</p>
              <h4 className="text-xl font-black text-rose-900 mt-1">
                {stats?.kehadiranHariIni?.alpa || 0}
              </h4>
            </div>
          </div>
        </div>

        {/* Rekap Nilai & KKM */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Capaian Nilai & Analisis KKM
              </h3>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
              KKM Acuan: {stats?.nilai?.kkm || 75}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Rata-rata Nilai Sekolah</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  {stats?.nilai?.rataRata || 0}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                {stats?.nilai?.rataRata >= (stats?.nilai?.kkm || 75) ? 'A' : 'B'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Catatan Penilaian</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  {stats?.nilai?.totalEntri || 0}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                Entri
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cetak Rekap Global Statistik Sekolah */}
      {isPrintModalOpen && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Pratinjau Rekapitulasi Global Satuan Pendidikan"
          description="Laporan ringkasan eksekutif statistik operasional & akademik sekolah format A4"
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="no-print flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">
              <span className="text-blue-900 font-semibold">
                Format Siap Cetak A4 Portrait • Disertai Pengesahan Kepala Sekolah
              </span>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Cetak Dokumen A4
              </Button>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 bg-white max-h-[70vh] overflow-y-auto">
              <TabelCetak
                judulDokumen="LAPORAN REKAPITULASI STATISTIK DAN KINERJA AKADEMIK"
                subJudul="Ringkasan Eksekutif Pendidik, Peserta Didik, Presensi, dan Capaian KKM"
                pengaturan={sekolah}
                tipeTandaTangan="kepala_saja"
              >
                {/* 1. Tabel Master Data Sekolah */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                    1. Data Pokok Pendidikan & Rombongan Belajar
                  </h4>
                  <table className="w-full text-left text-xs border border-black border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-black font-bold">
                        <th className="py-2 px-3 border-r border-black">Komponen Satuan Pendidikan</th>
                        <th className="py-2 px-3 border-r border-black text-center w-32">Kuantitas</th>
                        <th className="py-2 px-3">Keterangan / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/30">
                      <tr>
                        <td className="py-2 px-3 border-r border-black/30 font-medium">Tenaga Pendidik (Guru)</td>
                        <td className="py-2 px-3 border-r border-black/30 text-center font-bold">
                          {stats?.totalGuru || 0} Orang
                        </td>
                        <td className="py-2 px-3 text-slate-700">Aktif Mengajar Semester Berjalan</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 border-r border-black/30 font-medium">Peserta Didik (Siswa)</td>
                        <td className="py-2 px-3 border-r border-black/30 text-center font-bold">
                          {stats?.totalSiswa || 0} Siswa
                        </td>
                        <td className="py-2 px-3 text-slate-700">Terdaftar di Buku Induk Sekolah</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 border-r border-black/30 font-medium">Rombongan Belajar (Rombel)</td>
                        <td className="py-2 px-3 border-r border-black/30 text-center font-bold">
                          {stats?.totalKelas || 0} Rombel
                        </td>
                        <td className="py-2 px-3 text-slate-700">Tingkat 7 & Tingkat 8</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 border-r border-black/30 font-medium">Mata Pelajaran Diampu</td>
                        <td className="py-2 px-3 border-r border-black/30 text-center font-bold">
                          {stats?.totalMapel || 0} Mapel
                        </td>
                        <td className="py-2 px-3 text-slate-700">Struktur Kurikulum Merdeka</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Rekapitulasi Presensi & Kehadiran Hari Ini */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                    2. Rekapitulasi Presensi & Kedisiplinan Peserta Didik
                  </h4>
                  <table className="w-full text-left text-xs border border-black border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-black font-bold">
                        <th className="py-2 px-3 border-r border-black text-center">Hadir (H)</th>
                        <th className="py-2 px-3 border-r border-black text-center">Izin (I)</th>
                        <th className="py-2 px-3 border-r border-black text-center">Sakit (S)</th>
                        <th className="py-2 px-3 border-r border-black text-center">Alpa (A)</th>
                        <th className="py-2 px-3 text-center bg-blue-50 font-black">Persentase Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2.5 px-3 border-r border-black/30 text-center font-bold text-emerald-800">
                          {stats?.kehadiranHariIni?.hadir || 0}
                        </td>
                        <td className="py-2.5 px-3 border-r border-black/30 text-center font-bold text-blue-800">
                          {stats?.kehadiranHariIni?.izin || 0}
                        </td>
                        <td className="py-2.5 px-3 border-r border-black/30 text-center font-bold text-amber-800">
                          {stats?.kehadiranHariIni?.sakit || 0}
                        </td>
                        <td className="py-2.5 px-3 border-r border-black/30 text-center font-bold text-rose-800">
                          {stats?.kehadiranHariIni?.alpa || 0}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-blue-900 bg-blue-50/50">
                          {stats?.kehadiranHariIni?.persentaseHadir || 0}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. Capaian Asesmen Akademik & KKM */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                    3. Capaian Ketuntasan Belajar & Standar KKM
                  </h4>
                  <table className="w-full text-left text-xs border border-black border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-black font-bold">
                        <th className="py-2 px-3 border-r border-black">Indikator Mutu Akademik</th>
                        <th className="py-2 px-3 border-r border-black text-center w-32">Nilai Capaian</th>
                        <th className="py-2 px-3">Status Ketuntasan Satuan Pendidikan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/30">
                      <tr>
                        <td className="py-2 px-3 border-r border-black/30 font-medium">Rata-rata Nilai Global</td>
                        <td className="py-2 px-3 border-r border-black/30 text-center font-black text-blue-900">
                          {stats?.nilai?.rataRata || 0}
                        </td>
                        <td className="py-2 px-3 font-semibold text-emerald-800">
                          {stats?.nilai?.rataRata >= (stats?.nilai?.kkm || 75)
                            ? 'Memenuhi Standar KKM Sekolah'
                            : 'Perlu Penguatan Asesmen Formatif'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 border-r border-black/30 font-medium">KKM Acuan Sekolah</td>
                        <td className="py-2 px-3 border-r border-black/30 text-center font-bold">
                          {stats?.nilai?.kkm || 75}
                        </td>
                        <td className="py-2 px-3 text-slate-700">Berdasarkan Ketetapan Kurikulum Satuan Pendidikan</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 border-r border-black/30 font-medium">Tingkat Ketuntasan Siswa</td>
                        <td className="py-2 px-3 border-r border-black/30 text-center font-bold">
                          {stats?.nilai?.persentaseTuntas || 0}%
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {stats?.nilai?.tuntas || 0} dari {stats?.nilai?.totalEntri || 0} asesmen tuntas KKM
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabelCetak>
            </div>

            <div className="no-print pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
