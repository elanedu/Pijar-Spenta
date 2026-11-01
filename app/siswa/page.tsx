'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Halaman Utama Portal Siswa
 * app/siswa/page.tsx
 * Menampilkan Dashboard, 5 Tab (Nilai, Kehadiran, Catatan, Penugasan, Raport), dan Fitur Cetak Raport Resmi
 */

import React, { useEffect, useState } from 'react';
import {
  Award,
  CalendarCheck,
  ClipboardList,
  FileText,
  Printer,
  TrendingUp,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  School,
  Sparkles,
  Calendar,
  Search,
  Filter,
  Check,
  ArrowRight
} from 'lucide-react';
import { TabelCetak } from '@/components/TabelCetak.tsx';
import { formatTanggal, getTanggalHariIni } from '@/lib/utils.ts';

export interface SiswaDashboardPageProps {
  initialTab?: 'nilai' | 'kehadiran' | 'catatan' | 'penugasan' | 'raport';
}

export default function SiswaDashboardPage({ initialTab = 'nilai' }: SiswaDashboardPageProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'nilai' | 'kehadiran' | 'catatan' | 'penugasan' | 'raport'>(initialTab);
  const [filterKehadiran, setFilterKehadiran] = useState<string>('semua');
  const [filterMapelNilai, setFilterMapelNilai] = useState<string>('semua');

  // Sinkronkan tab bila prop berubah dari navigasi luar
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Ambil data dashboard siswa dari API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/siswa/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data siswa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Memuat data portal siswa PIJAR SPENTA...</p>
      </div>
    );
  }

  if (!data || !data.siswa) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center max-w-lg mx-auto mt-12 shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Data Siswa Tidak Ditemukan</h3>
        <p className="text-sm text-slate-600 mb-6">
          Akun Anda belum terhubung dengan data pokok siswa di rombel aktif.
        </p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  const { siswa, waliKelas, tahunAjaran, semester, sekolah, kehadiran, nilai, catatan, penugasan } = data;

  // Filter Kehadiran
  const filteredKehadiran = kehadiran.records.filter((k: any) => {
    if (filterKehadiran === 'semua') return true;
    return k.status === filterKehadiran;
  });

  // Filter Nilai
  const filteredNilai = nilai.perMapel.filter((m: any) => {
    if (filterMapelNilai === 'semua') return true;
    return m.namaMapel === filterMapelNilai;
  });

  // Handler cetak
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. KARTU PROFIL & RINGKASAN ATAS (Disembunyikan saat mencetak dokumen) */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={siswa.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(siswa.nama)}`}
                alt={siswa.nama}
                className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border-2 border-white shadow-md ring-1 ring-slate-200"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{siswa.nama}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  NIS: {siswa.nis}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Kelas {siswa.kelas}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>Wali Kelas: <strong className="text-slate-700">{waliKelas}</strong></span>
                <span>•</span>
                <span>Tahun Ajaran: <strong className="text-slate-700">{tahunAjaran} ({semester})</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('raport');
                setTimeout(() => window.print(), 300);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Cetak Raport Lengkap
            </button>
          </div>
        </div>

        {/* 4 KARTU STATISTIK METRIK */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">Rata-rata Nilai</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{nilai.rataRataGlobal || 0}</span>
                <span className="text-xs font-medium text-slate-500">/ 100</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600">
                Predikat {nilai.statusGlobal?.predikat || 'B'} • {nilai.statusGlobal?.tuntas ? 'Tuntas KKM' : 'Remedial'}
              </span>
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Kehadiran</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{kehadiran.persentaseHadir}%</span>
              </div>
              <span className="text-xs text-slate-500">
                {kehadiran.hadir} Hadir dari {kehadiran.total} pertemuan
              </span>
            </div>
          </div>

          <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Absensi (I/S/A)</span>
              <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-700">
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">I: {kehadiran.izin}</span>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">S: {kehadiran.sakit}</span>
                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded">A: {kehadiran.alpa}</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Total Izin & Sakit</span>
            </div>
          </div>

          <div className="bg-purple-50/60 rounded-xl p-4 border border-purple-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider block">Tugas Belajar</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-slate-900">{penugasan.length}</span>
                <span className="text-xs font-medium text-slate-500">Tugas</span>
              </div>
              <span className="text-xs text-purple-700 font-medium">
                {catatan.length} Catatan Karakter
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGASI */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('nilai')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'nilai'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Buku Nilai & KKM
        </button>

        <button
          onClick={() => setActiveTab('kehadiran')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'kehadiran'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Rekap Kehadiran
        </button>

        <button
          onClick={() => setActiveTab('catatan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'catatan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Jurnal Karakter ({catatan.length})
        </button>

        <button
          onClick={() => setActiveTab('penugasan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'penugasan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Tugas Belajar ({penugasan.length})
        </button>

        <button
          onClick={() => setActiveTab('raport')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ml-auto ${
            activeTab === 'raport'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          Lembar Raport Resmi
        </button>
      </div>

      {/* 3. KONTEN TAB 1: BUKU NILAI & KKM */}
      {activeTab === 'nilai' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Transkrip Nilai Akademik Siswa</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standar Ketuntasan Minimal (KKM): <strong>{nilai.kkm}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filterMapelNilai}
                  onChange={(e) => setFilterMapelNilai(e.target.value)}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="semua">Semua Mata Pelajaran</option>
                  {nilai.perMapel.map((m: any) => (
                    <option key={m.mapelId} value={m.namaMapel}>
                      {m.namaMapel}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Transkrip
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4 text-center">KKM</th>
                    <th className="py-3 px-4">Rincian Penilaian (Formatif / Sumatif)</th>
                    <th className="py-3 px-4 text-center">Rata-rata</th>
                    <th className="py-3 px-4 text-center">Predikat</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredNilai.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada data nilai mata pelajaran yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredNilai.map((m: any, idx: number) => (
                      <tr key={m.mapelId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{m.namaMapel}</span>
                          <span className="text-[11px] text-slate-400">Kode: {m.kode}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-600">{m.kkm}</td>
                        <td className="py-3.5 px-4">
                          {m.records.length === 0 ? (
                            <span className="text-slate-400 italic">Belum ada asesmen</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {m.records.map((r: any) => (
                                <span
                                  key={r.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px]"
                                >
                                  <span className="text-slate-500">{r.jenis_nilai}:</span>
                                  <strong className={Number(r.nilai) >= m.kkm ? 'text-emerald-700' : 'text-rose-600'}>
                                    {r.nilai}
                                  </strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`text-sm font-black ${
                              m.rataRata >= m.kkm ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {m.rataRata > 0 ? m.rataRata : '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-800">
                            {m.predikat}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {m.rataRata === 0 ? (
                            <span className="text-slate-400">-</span>
                          ) : m.tuntas ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              Tuntas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              Remedial
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. KONTEN TAB 2: REKAP KEHADIRAN */}
      {activeTab === 'kehadiran' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Riwayat Presensi Harian Siswa</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan absensi per kegiatan belajar mengajar (KBM) dan topik materi
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  {[
                    { id: 'semua', label: 'Semua' },
                    { id: 'H', label: 'Hadir (H)' },
                    { id: 'I', label: 'Izin (I)' },
                    { id: 'S', label: 'Sakit (S)' },
                    { id: 'A', label: 'Alpa (A)' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterKehadiran(f.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        filterKehadiran === f.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Rekap
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Tanggal KBM</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4">Materi / Topik Pembelajaran</th>
                    <th className="py-3 px-4">Guru Pengajar</th>
                    <th className="py-3 px-4 text-center">Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredKehadiran.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada catatan kehadiran dengan filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredKehadiran.map((k: any, idx: number) => {
                      const statusBadges: Record<string, { bg: string; text: string; label: string }> = {
                        H: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'Hadir', label: 'H' },
                        I: { bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Izin', label: 'I' },
                        S: { bg: 'bg-amber-100 text-amber-800 border-amber-200', text: 'Sakit', label: 'S' },
                        A: { bg: 'bg-rose-100 text-rose-800 border-rose-200', text: 'Alpa / Tanpa Keterangan', label: 'A' },
                      };
                      const b = statusBadges[k.status] || {
                        bg: 'bg-slate-100 text-slate-800',
                        text: k.status,
                        label: k.status,
                      };

                      return (
                        <tr key={k.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {formatTanggal(k.tanggal)}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">{k.mapel}</td>
                          <td className="py-3 px-4 text-slate-600">{k.topik || '-'}</td>
                          <td className="py-3 px-4 text-slate-600">{k.guru || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${b.bg}`}
                            >
                              <span>{b.label}</span> • <span>{b.text}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. KONTEN TAB 3: JURNAL KARAKTER */}
      {activeTab === 'catatan' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Jurnal Sikap & Karakter Siswa</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catatan pembinaan, apresiasi prestasi, dan perkembangan perilaku dari bapak/ibu dewan guru
                </p>
              </div>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Jurnal
              </button>
            </div>

            <div className="p-5">
              {catatan.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Belum ada catatan sikap dan karakter untuk semester ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catatan.map((c: any) => {
                    const isPositif = c.jenis?.toLowerCase() === 'positif';
                    return (
                      <div
                        key={c.id}
                        className={`rounded-xl border p-4.5 transition-all ${
                          isPositif
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50/50 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              isPositif
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {isPositif ? 'Apresiasi / Positif' : 'Perlu Pembinaan'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {formatTanggal(c.tanggal)}
                          </span>
                        </div>

                        <p className="text-xs font-medium leading-relaxed my-2">"{c.keterangan}"</p>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                          <span>Mapel: <strong>{c.mapel || 'Umum'}</strong></span>
                          <span>Guru: <strong>{c.guru || 'Wali Kelas'}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. KONTEN TAB 4: TUGAS BELAJAR */}
      {activeTab === 'penugasan' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daftar Tugas & Asesmen Pembelajaran</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instruksi tugas mandiri dan kelompok untuk Kelas {siswa.kelas}
                </p>
              </div>
            </div>

            <div className="p-5">
              {penugasan.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Belum ada tugas aktif untuk kelas Anda saat ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {penugasan.map((t: any) => {
                    const deadlineDate = t.deadline ? new Date(t.deadline) : null;
                    const isPassed = deadlineDate ? deadlineDate < new Date() : false;

                    return (
                      <div
                        key={t.id}
                        className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 transition-all bg-white"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                          <h4 className="text-sm font-bold text-slate-900">{t.judul}</h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isPassed
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            Batas Waktu: {formatTanggal(t.deadline)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                          {t.deskripsi || 'Silakan kerjakan tugas sesuai arahan guru pengajar di kelas.'}
                        </p>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                          <span>Target Rombel: <strong className="text-slate-700">{t.target_kelas}</strong></span>
                          <span>Tanggal Dibuat: {formatTanggal(t.timestamp)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. KONTEN TAB 5: LEMBAR RAPORT RESMI (SIAP CETAK A4) */}
      {activeTab === 'raport' && (
        <div className="space-y-6">
          <div className="no-print bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-blue-700" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">Pratinjau Raport Siap Cetak</h4>
                <p className="text-xs text-blue-700">
                  Dokumen ini telah disesuaikan dengan format resmi kedinasan dan siap dicetak menggunakan kertas A4.
                </p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen Raport
            </button>
          </div>

          {/* DOKUMEN RAPORT CETAK RESMI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md print:shadow-none print:border-none print:p-0 print:m-0">
            <TabelCetak
              judulDokumen="LAPORAN CAPAIAN HASIL BELAJAR SISWA"
              subJudul="RAPORT AKADEMIK SEMESTER"
              kelas={siswa.kelas}
              semester={semester}
              tahunAjaran={tahunAjaran}
              pengaturan={sekolah}
              showTandaTangan={false}
            >
              {/* BIODATA SISWA DI KOP RAPORT */}
              <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="grid grid-cols-2 gap-y-2 gap-x-8">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Nama Peserta Didik</span>
                    <strong className="text-slate-900">{siswa.nama}</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Nomor Induk Siswa (NIS)</span>
                    <strong className="text-slate-900">{siswa.nis}</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Kelas / Rombel</span>
                    <strong className="text-slate-900">{siswa.kelas}</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-500">Semester / Tahun Ajaran</span>
                    <strong className="text-slate-900">{semester} / {tahunAjaran}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Wali Kelas</span>
                    <strong className="text-slate-900">{waliKelas}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status Kelulusan/Kenaikan</span>
                    <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                      {nilai.statusGlobal?.tuntas ? 'Tuntas & Memenuhi KKM' : 'Perlu Remedial'}
                    </span>
                  </div>
                </div>
              </div>

              {/* A. TABEL CAPAIAN NILAI MATA PELAJARAN */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  A. Capaian Kompetensi Mata Pelajaran
                </h4>
                <table className="w-full text-left text-xs border border-slate-400 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800">
                      <th className="py-2 px-3 border-r border-slate-400 text-center w-10">No</th>
                      <th className="py-2 px-3 border-r border-slate-400">Mata Pelajaran</th>
                      <th className="py-2 px-3 border-r border-slate-400 text-center w-16">KKM</th>
                      <th className="py-2 px-3 border-r border-slate-400 text-center w-20">Nilai Akhir</th>
                      <th className="py-2 px-3 border-r border-slate-400 text-center w-16">Predikat</th>
                      <th className="py-2 px-3">Deskripsi Capaian Kompetensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {nilai.perMapel.map((m: any, idx: number) => (
                      <tr key={m.mapelId}>
                        <td className="py-2 px-3 border-r border-slate-300 text-center">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-300 font-bold">{m.namaMapel}</td>
                        <td className="py-2 px-3 border-r border-slate-300 text-center font-semibold">{m.kkm}</td>
                        <td className="py-2 px-3 border-r border-slate-300 text-center font-bold">
                          {m.rataRata > 0 ? m.rataRata : '-'}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 text-center font-bold">{m.predikat}</td>
                        <td className="py-2 px-3 text-[11px] leading-tight text-slate-700">
                          {m.tuntas
                            ? `Menunjukkan penguasaan materi yang ${m.keterangan?.toLowerCase() || 'baik'} dalam mencapai seluruh kompetensi dasar.`
                            : `Perlu peningkatan dan pendampingan remedial pada pemahaman konsep dasar.`}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-400">
                      <td colSpan={3} className="py-2 px-3 text-right border-r border-slate-400">
                        Rata-Rata Nilai Akademik Global :
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-400 text-blue-700">
                        {nilai.rataRataGlobal || 0}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-400">
                        {nilai.statusGlobal?.predikat || 'B'}
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        Status Ketuntasan : <strong>{nilai.statusGlobal?.tuntas ? 'TUNTAS' : 'REMEDIAL'}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* B. REKAPITULASI KEHADIRAN & CATATAN WALI KELAS */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                    B. Rekapitulasi Presensi Semester
                  </h4>
                  <table className="w-full text-xs border border-slate-400 border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <td className="py-1.5 px-3 border-r border-slate-300 bg-slate-50 font-medium">Hadir (H)</td>
                        <td className="py-1.5 px-3 font-bold text-center">{kehadiran.hadir} Hari</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="py-1.5 px-3 border-r border-slate-300 bg-slate-50 font-medium">Izin (I)</td>
                        <td className="py-1.5 px-3 font-bold text-center">{kehadiran.izin} Hari</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="py-1.5 px-3 border-r border-slate-300 bg-slate-50 font-medium">Sakit (S)</td>
                        <td className="py-1.5 px-3 font-bold text-center">{kehadiran.sakit} Hari</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="py-1.5 px-3 border-r border-slate-300 bg-slate-50 font-medium">Tanpa Keterangan (A)</td>
                        <td className="py-1.5 px-3 font-bold text-center text-rose-600">{kehadiran.alpa} Hari</td>
                      </tr>
                      <tr className="bg-slate-100 font-bold">
                        <td className="py-1.5 px-3 border-r border-slate-300">Persentase Kehadiran</td>
                        <td className="py-1.5 px-3 text-center text-emerald-700">{kehadiran.persentaseHadir}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                    C. Catatan Pengembangan Karakter
                  </h4>
                  <div className="border border-slate-400 rounded p-3 text-xs bg-white min-h-[120px] flex flex-col justify-between">
                    <p className="italic text-slate-700 leading-relaxed">
                      {catatan.length > 0
                        ? `"${catatan[0].keterangan}"`
                        : '"Peserta didik berakhlak baik, aktif dalam kegiatan belajar mengajar, serta menunjukkan sikap santun dan kooperatif dengan guru dan teman sebaya."'}
                    </p>
                    <p className="text-[11px] text-right text-slate-500 font-medium mt-2">
                      — Wali Kelas: {waliKelas}
                    </p>
                  </div>
                </div>
              </div>

              {/* TANDA TANGAN RESMI 3 PIHAK: ORANG TUA, WALI KELAS, KEPALA SEKOLAH */}
              <div className="mt-8 pt-4 border-t border-slate-300 text-xs">
                <div className="text-right text-slate-600 mb-4 font-medium">
                  {sekolah?.kota_cetak || 'Bandung'}, {formatTanggal(getTanggalHariIni(), 'lengkap')}
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-slate-600">Mengetahui,</p>
                    <p className="font-bold text-slate-800">Orang Tua / Wali Siswa</p>
                    <div className="h-20"></div>
                    <p className="font-bold text-slate-900 border-b border-slate-700 inline-block px-4">
                      ...........................................
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-600">Wali Kelas {siswa.kelas}</p>
                    <div className="h-20"></div>
                    <p className="font-bold text-slate-900 border-b border-slate-700 inline-block px-4">
                      {waliKelas}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">NIP. 19800101 200501 1 001</p>
                  </div>

                  <div>
                    <p className="text-slate-600">Kepala Sekolah</p>
                    <p className="font-bold text-slate-800">{sekolah?.nama_sekolah || 'SMP NEGERI 1 SPENTA'}</p>
                    <div className="h-20"></div>
                    <p className="font-bold text-slate-900 border-b border-slate-700 inline-block px-4">
                      {sekolah?.kepala_sekolah || 'Drs. H. Mulyono, M.Pd.'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      NIP. {sekolah?.nip_kepala_sekolah || '19700512 199603 1 002'}
                    </p>
                  </div>
                </div>
              </div>
            </TabelCetak>
          </div>
        </div>
      )}
    </div>
  );
}
