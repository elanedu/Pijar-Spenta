'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Halaman Pengelolaan Kelas Guru (4 Tab Lengkap)
 * app/guru/kelas/[mapel]/[kelas]/page.tsx
 * Tab: 1) Kehadiran (H/I/S/A), 2) Penilaian KKM & Rata-rata, 3) Catatan Karakter, 4) Penugasan Belajar
 * Dilengkapi cetak resmi kop surat untuk setiap modul
 */

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Award,
  FileText,
  ClipboardList,
  Printer,
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  RefreshCw,
  School,
  Users,
  AlertCircle,
  CheckCircle2,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { Toast } from '@/components/ui/Toast.tsx';
import { TabelCetak } from '@/components/TabelCetak.tsx';
import { formatTanggal, getTanggalHariIni, hitungRataRata, cekStatusKKM } from '@/lib/utils.ts';
import { STATUS_KEHADIRAN, PENGATURAN_DEFAULT } from '@/lib/constants.ts';

export interface GuruClassDetailProps {
  mapel?: string;
  kelas?: string;
  onBack?: () => void;
}

export default function GuruClassDetailPage({
  mapel = 'Bahasa Indonesia',
  kelas = '7A',
  onBack,
}: GuruClassDetailProps) {
  const [activeTab, setActiveTab] = useState<'kehadiran' | 'penilaian' | 'catatan' | 'penugasan'>('kehadiran');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data master
  const [siswas, setSiswas] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(PENGATURAN_DEFAULT);

  // ---------------------------------------------------------------------------
  // STATE TAB 1: KEHADIRAN
  // ---------------------------------------------------------------------------
  const [tglKehadiran, setTglKehadiran] = useState(getTanggalHariIni());
  const [topikKehadiran, setTopikKehadiran] = useState('Pembahasan Materi KBM');
  const [kehadiranMap, setKehadiranMap] = useState<Record<string, 'H' | 'I' | 'S' | 'A'>>({});

  // ---------------------------------------------------------------------------
  // STATE TAB 2: PENILAIAN
  // ---------------------------------------------------------------------------
  const [kolomNilai, setKolomNilai] = useState<string[]>(['Formatif 1', 'Sumatif 1']);
  const [nilaiMap, setNilaiMap] = useState<Record<string, Record<string, string>>>({});
  const [isTambahKolomOpen, setIsTambahKolomOpen] = useState(false);
  const [namaKolomBaru, setNamaKolomBaru] = useState('');

  // ---------------------------------------------------------------------------
  // STATE TAB 3: CATATAN
  // ---------------------------------------------------------------------------
  const [catatanList, setCatatanList] = useState<any[]>([]);
  const [isCatatanModalOpen, setIsCatatanModalOpen] = useState(false);
  const [catatanSiswaNis, setCatatanSiswaNis] = useState('');
  const [catatanJenis, setCatatanJenis] = useState<'Positif' | 'Negatif'>('Positif');
  const [catatanKet, setCatatanKet] = useState('');

  // ---------------------------------------------------------------------------
  // STATE TAB 4: PENUGASAN
  // ---------------------------------------------------------------------------
  const [tugasList, setTugasList] = useState<any[]>([]);
  const [isTugasModalOpen, setIsTugasModalOpen] = useState(false);
  const [tugasJudul, setTugasJudul] = useState('');
  const [tugasDeskripsi, setTugasDeskripsi] = useState('');
  const [tugasDeadline, setTugasDeadline] = useState('');

  useEffect(() => {
    loadClassData();
  }, [kelas, mapel]);

  const loadClassData = async () => {
    setLoading(true);
    try {
      const [resS, resAbs, resN, resCat, resTsk, resSet] = await Promise.all([
        fetch(`/api/guru/siswa?kelas=${encodeURIComponent(kelas)}`),
        fetch(`/api/guru/kehadiran?kelas=${encodeURIComponent(kelas)}&mapel=${encodeURIComponent(mapel)}`),
        fetch(`/api/guru/nilai?kelas=${encodeURIComponent(kelas)}&mapel=${encodeURIComponent(mapel)}`),
        fetch(`/api/guru/catatan?kelas=${encodeURIComponent(kelas)}&mapel=${encodeURIComponent(mapel)}`),
        fetch(`/api/guru/penugasan?kelas=${encodeURIComponent(kelas)}`),
        fetch('/api/admin/pengaturan'),
      ]);

      const [jsonS, jsonAbs, jsonN, jsonCat, jsonTsk, jsonSet] = await Promise.all([
        resS.json(),
        resAbs.json(),
        resN.json(),
        resCat.json(),
        resTsk.json(),
        resSet.json(),
      ]);

      if (jsonSet.success && jsonSet.data) setSettings(jsonSet.data);

      const studentList = jsonS.success ? jsonS.data || [] : [];
      setSiswas(studentList);

      // Inisialisasi peta kehadiran awal
      const initialAbs: Record<string, 'H' | 'I' | 'S' | 'A'> = {};
      const todayRecords = jsonAbs.success && jsonAbs.data?.records ? jsonAbs.data.records : [];
      studentList.forEach((s: any) => {
        const found = todayRecords.find((r: any) => r.nis === s.nis);
        initialAbs[s.nis] = found ? found.status : 'H';
      });
      setKehadiranMap(initialAbs);

      // Inisialisasi peta nilai
      const nRecords = jsonN.success && jsonN.data?.records ? jsonN.data.records : [];
      const cols = jsonN.success && jsonN.data?.kolomPenilaian?.length > 0
        ? jsonN.data.kolomPenilaian
        : ['Formatif 1', 'Sumatif 1'];
      setKolomNilai(cols);

      const nMap: Record<string, Record<string, string>> = {};
      studentList.forEach((s: any) => {
        nMap[s.nis] = {};
        cols.forEach((col: string) => {
          const match = nRecords.find((r: any) => r.nis === s.nis && r.jenis_nilai === col);
          nMap[s.nis][col] = match ? match.nilai : '';
        });
      });
      setNilaiMap(nMap);

      if (jsonCat.success) setCatatanList(jsonCat.data || []);
      if (jsonTsk.success) setTugasList(jsonTsk.data || []);
      if (studentList.length > 0) setCatatanSiswaNis(studentList[0].nis);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS TAB 1: KEHADIRAN
  // ---------------------------------------------------------------------------
  const handleToggleStatus = (nis: string, status: 'H' | 'I' | 'S' | 'A') => {
    setKehadiranMap((prev) => ({ ...prev, [nis]: status }));
  };

  const handleSetAllHadir = () => {
    const updated: Record<string, 'H' | 'I' | 'S' | 'A'> = {};
    siswas.forEach((s) => {
      updated[s.nis] = 'H';
    });
    setKehadiranMap(updated);
    setToastMessage('Semua siswa ditandai Hadir.');
  };

  const handleSaveKehadiran = async () => {
    setSubmitting(true);
    try {
      const payload = {
        tanggal: tglKehadiran,
        topik: topikKehadiran,
        kelas,
        mapel,
        kehadiran: siswas.map((s) => ({
          nis: s.nis,
          nama: s.nama,
          status: kehadiranMap[s.nis] || 'H',
        })),
      };

      const res = await fetch('/api/guru/kehadiran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage(`Presensi ${siswas.length} siswa berhasil disimpan ke Google Sheets!`);
      } else {
        alert(json.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS TAB 2: PENILAIAN
  // ---------------------------------------------------------------------------
  const handleScoreChange = (nis: string, col: string, val: string) => {
    setNilaiMap((prev) => ({
      ...prev,
      [nis]: {
        ...(prev[nis] || {}),
        [col]: val,
      },
    }));
  };

  const handleTambahKolom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKolomBaru.trim()) return;
    const colName = namaKolomBaru.trim();
    if (!kolomNilai.includes(colName)) {
      setKolomNilai((prev) => [...prev, colName]);
      setToastMessage(`Kolom penilaian '${colName}' ditambahkan.`);
    }
    setNamaKolomBaru('');
    setIsTambahKolomOpen(false);
  };

  const handleSaveNilai = async () => {
    setSubmitting(true);
    try {
      // Simpan per kolom
      for (const col of kolomNilai) {
        const batchList = siswas.map((s) => ({
          nis: s.nis,
          nama: s.nama,
          nilai: nilaiMap[s.nis]?.[col] || '',
        }));

        await fetch('/api/guru/nilai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kelas,
            mapel,
            jenis_nilai: col,
            tanggal: getTanggalHariIni(),
            batchList,
          }),
        });
      }
      setToastMessage('Seluruh buku nilai berhasil disimpan ke Google Sheets!');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS TAB 3: CATATAN
  // ---------------------------------------------------------------------------
  const handleSaveCatatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catatanKet.trim()) return;
    setSubmitting(true);
    try {
      const student = siswas.find((s) => s.nis === catatanSiswaNis);
      const res = await fetch('/api/guru/catatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: getTanggalHariIni(),
          nis: catatanSiswaNis,
          nama: student?.nama || '',
          kelas,
          mapel,
          jenis: catatanJenis,
          keterangan: catatanKet,
          nilai_deskripsi: catatanJenis === 'Positif' ? 'Sangat Baik' : 'Perlu Pembinaan',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage('Catatan karakter siswa berhasil disimpan.');
        setCatatanKet('');
        setIsCatatanModalOpen(false);
        loadClassData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCatatan = async (id: string) => {
    if (!confirm('Hapus catatan ini?')) return;
    await fetch(`/api/guru/catatan?id=${id}`, { method: 'DELETE' });
    setToastMessage('Catatan dihapus.');
    loadClassData();
  };

  // ---------------------------------------------------------------------------
  // HANDLERS TAB 4: PENUGASAN
  // ---------------------------------------------------------------------------
  const handleSaveTugas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tugasJudul.trim() || !tugasDeadline) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/guru/penugasan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_kelas: kelas,
          judul: tugasJudul,
          deskripsi: tugasDeskripsi,
          deadline: tugasDeadline,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage('Tugas belajar berhasil diterbitkan!');
        setTugasJudul('');
        setTugasDeskripsi('');
        setTugasDeadline('');
        setIsTugasModalOpen(false);
        loadClassData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTugas = async (id: string) => {
    if (!confirm('Hapus tugas ini?')) return;
    await fetch(`/api/guru/penugasan?id=${id}`, { method: 'DELETE' });
    setToastMessage('Tugas dihapus.');
    loadClassData();
  };

  // Statistik Kehadiran Aktif
  const countH = Object.values(kehadiranMap).filter((v) => v === 'H').length;
  const countI = Object.values(kehadiranMap).filter((v) => v === 'I').length;
  const countS = Object.values(kehadiranMap).filter((v) => v === 'S').length;
  const countA = Object.values(kehadiranMap).filter((v) => v === 'A').length;
  const kkmVal = parseFloat(settings.kkm_default || '75') || 75;

  return (
    <div className="space-y-6">
      <Toast
        isOpen={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="success"
        onClose={() => setToastMessage(null)}
      />

      {/* Header Bar Kelas & Navigasi Kembali */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Kembali ke Daftar Card Kelas"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                KELAS {kelas}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">{mapel}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {siswas.length} Siswa Terdaftar • KKM Standar: {kkmVal}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Cetak Tab Ini
          </Button>
        </div>
      </div>

      {/* 4 Tab Selector */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex gap-1 overflow-x-auto">
        {[
          { id: 'kehadiran', label: '1. Presensi Kehadiran', icon: CalendarCheck },
          { id: 'penilaian', label: '2. Buku Penilaian KKM', icon: Award },
          { id: 'catatan', label: '3. Jurnal Catatan Siswa', icon: FileText },
          { id: 'penugasan', label: '4. Tugas Belajar', icon: ClipboardList },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =======================================================================
          TAB 1: KEHADIRAN (H/I/S/A)
          ======================================================================= */}
      {activeTab === 'kehadiran' && (
        <div className="space-y-6">
          {/* Bar Kontrol Presensi */}
          <div className="no-print bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                <Input
                  label="Tanggal KBM"
                  type="date"
                  value={tglKehadiran}
                  onChange={(e) => setTglKehadiran(e.target.value)}
                />
                <Input
                  label="Materi / Topik Pertemuan"
                  placeholder="Contoh: Struktur Teks Deskripsi"
                  value={topikKehadiran}
                  onChange={(e) => setTopikKehadiran(e.target.value)}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button variant="outline" size="md" onClick={handleSetAllHadir}>
                  Semua Hadir
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={submitting}
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveKehadiran}
                >
                  Simpan Presensi
                </Button>
              </div>
            </div>

            {/* Rekap Kehadiran Real-time */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-800 font-medium">Hadir</span>
                <p className="text-xl font-black text-emerald-900 mt-0.5">{countH}</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-blue-800 font-medium">Izin</span>
                <p className="text-xl font-black text-blue-900 mt-0.5">{countI}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-amber-800 font-medium">Sakit</span>
                <p className="text-xl font-black text-amber-900 mt-0.5">{countS}</p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-rose-800 font-medium">Alpa</span>
                <p className="text-xl font-black text-rose-900 mt-0.5">{countA}</p>
              </div>
            </div>
          </div>

          {/* Tabel Presensi (Interaktif di Layar + Format Cetak) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <TabelCetak
              judulDokumen={`REKAPITULASI PRESENSI KEHADIRAN SISWA`}
              subJudul={`Topik KBM: ${topikKehadiran} • Tanggal: ${formatTanggal(tglKehadiran, 'lengkap')}`}
              kelas={kelas}
              mapel={mapel}
              pengaturan={settings}
            >
              <table className="w-full text-left text-xs sm:text-sm border-collapse border border-black/40">
                <thead>
                  <tr className="bg-slate-100 border-b border-black/40 text-slate-800">
                    <th className="py-2.5 px-3 border-r border-black/40 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 border-r border-black/40 w-24">NIS</th>
                    <th className="py-2.5 px-3 border-r border-black/40">Nama Peserta Didik</th>
                    <th className="py-2.5 px-3 text-center">Status Presensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20">
                  {siswas.map((s, idx) => {
                    const currentStatus = kehadiranMap[s.nis] || 'H';
                    return (
                      <tr key={s.nis} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 border-r border-black/40 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-black/40 font-mono font-bold text-slate-700">
                          {s.nis}
                        </td>
                        <td className="py-2.5 px-3 border-r border-black/40 font-semibold text-slate-900">
                          {s.nama}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {/* Toggle Button H/I/S/A untuk Mode Interaktif di Browser */}
                          <div className="no-print inline-flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                            {(['H', 'I', 'S', 'A'] as const).map((st) => {
                              const isSelected = currentStatus === st;
                              const cfg = STATUS_KEHADIRAN[st];
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleToggleStatus(s.nis, st)}
                                  className={`w-8 h-7 rounded text-xs font-black transition ${
                                    isSelected
                                      ? `${cfg.warna} ring-2 ring-slate-900/20 font-black`
                                      : 'text-slate-400 hover:text-slate-700'
                                  }`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                          {/* Label Resmi untuk Hasil Cetak Fisik */}
                          <div className="hidden print:block font-bold">
                            {currentStatus === 'H' ? 'HADIR' : currentStatus === 'I' ? 'IZIN' : currentStatus === 'S' ? 'SAKIT' : 'ALPA'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TabelCetak>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: PENILAIAN & ANALISIS KKM
          ======================================================================= */}
      {activeTab === 'penilaian' && (
        <div className="space-y-6">
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">
                Standar KKM: <span className="text-blue-700 font-black">{kkmVal}</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500">Edit nilai langsung pada kotak tabel di bawah ini</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsTambahKolomOpen(true)}
              >
                Tambah Kolom Nilai
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={submitting}
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveNilai}
              >
                Simpan Buku Nilai
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <TabelCetak
              judulDokumen="DAFTAR KUMPULAN NILAI HASIL BELAJAR PESERTA DIDIK"
              subJudul={`Kriteria Ketuntasan Minimal (KKM): ${kkmVal}`}
              kelas={kelas}
              mapel={mapel}
              pengaturan={settings}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-black/40">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black/40 text-slate-800">
                      <th className="py-2.5 px-3 border-r border-black/40 w-10 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-black/40 w-20">NIS</th>
                      <th className="py-2.5 px-3 border-r border-black/40 min-w-36">Nama Siswa</th>
                      {kolomNilai.map((col) => (
                        <th key={col} className="py-2.5 px-3 border-r border-black/40 text-center w-24">
                          {col}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 border-r border-black/40 text-center w-20 bg-blue-50 font-black">
                        Rata-rata
                      </th>
                      <th className="py-2.5 px-3 text-center w-28">Status KKM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/20">
                    {siswas.map((s, idx) => {
                      const studentScores = kolomNilai.map((c) => nilaiMap[s.nis]?.[c] || '');
                      const rataRata = hitungRataRata(studentScores);
                      const { tuntas, predikat } = cekStatusKKM(rataRata, kkmVal);

                      return (
                        <tr key={s.nis} className="hover:bg-slate-50">
                          <td className="py-2 px-3 border-r border-black/40 text-center font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-black/40 font-mono font-bold text-slate-700">
                            {s.nis}
                          </td>
                          <td className="py-2 px-3 border-r border-black/40 font-semibold text-slate-900">
                            {s.nama}
                          </td>
                          {kolomNilai.map((col) => (
                            <td key={col} className="py-2 px-2 border-r border-black/40 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={nilaiMap[s.nis]?.[col] ?? ''}
                                onChange={(e) => handleScoreChange(s.nis, col, e.target.value)}
                                className="w-16 px-1.5 py-1 text-center font-bold text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:ring-1 focus:ring-blue-500 print:border-none print:bg-transparent"
                                placeholder="-"
                              />
                            </td>
                          ))}
                          <td className="py-2 px-3 border-r border-black/40 text-center font-black bg-blue-50/50 text-blue-900">
                            {rataRata > 0 ? rataRata : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {rataRata > 0 ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  tuntas
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {tuntas ? `Tuntas (${predikat})` : `Remedial (${predikat})`}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabelCetak>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 3: JURNAL CATATAN KARAKTER
          ======================================================================= */}
      {activeTab === 'catatan' && (
        <div className="space-y-6">
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Jurnal Perkembangan Sikap & Karakter</h3>
              <p className="text-xs text-slate-500">Catat perilaku positif atau catatan pembinaan siswa</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCatatanModalOpen(true)}
            >
              Tambah Catatan
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <TabelCetak
              judulDokumen="JURNAL CATATAN PERKEMBANGAN SIKAP & KARAKTER SISWA"
              subJudul="Catatan Sikap Spiritual dan Sosial Peserta Didik Selama KBM"
              kelas={kelas}
              mapel={mapel}
              pengaturan={settings}
            >
              <table className="w-full text-left text-xs border-collapse border border-black/40">
                <thead>
                  <tr className="bg-slate-100 border-b border-black/40 text-slate-800">
                    <th className="py-2.5 px-3 border-r border-black/40 w-24">Tanggal</th>
                    <th className="py-2.5 px-3 border-r border-black/40 w-36">Siswa</th>
                    <th className="py-2.5 px-3 border-r border-black/40 w-24 text-center">Jenis</th>
                    <th className="py-2.5 px-3 border-r border-black/40">Uraian / Keterangan</th>
                    <th className="py-2.5 px-3 border-r border-black/40 w-32">Predikat</th>
                    <th className="no-print py-2.5 px-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20">
                  {catatanList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Belum ada catatan sikap yang direkam untuk rombel ini.
                      </td>
                    </tr>
                  ) : (
                    catatanList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 border-r border-black/40 font-mono text-slate-600">
                          {c.tanggal}
                        </td>
                        <td className="py-2.5 px-3 border-r border-black/40 font-bold text-slate-900">
                          {c.nama} <span className="text-[10px] text-slate-400 font-mono">({c.nis})</span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-black/40 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              c.jenis === 'Positif'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {c.jenis}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-black/40 text-slate-700">
                          {c.keterangan}
                        </td>
                        <td className="py-2.5 px-3 border-r border-black/40 font-semibold text-slate-800">
                          {c.nilai_deskripsi || '-'}
                        </td>
                        <td className="no-print py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleDeleteCatatan(c.id)}
                            className="p-1 text-rose-600 hover:text-rose-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TabelCetak>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 4: PENUGASAN BELAJAR
          ======================================================================= */}
      {activeTab === 'penugasan' && (
        <div className="space-y-6">
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Daftar Penugasan Peserta Didik</h3>
              <p className="text-xs text-slate-500">Tugas yang dibuat di sini akan langsung tampil pada portal siswa</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsTugasModalOpen(true)}
            >
              Buat Tugas Baru
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <TabelCetak
              judulDokumen="LEMBAR REKAPITULASI PENUGASAN PESERTA DIDIK"
              subJudul="Daftar Tugas Mandiri dan Terstruktur Semester Berjalan"
              kelas={kelas}
              mapel={mapel}
              pengaturan={settings}
            >
              <div className="divide-y divide-slate-100">
                {tugasList.length === 0 ? (
                  <p className="py-8 text-center text-slate-500 text-xs">Belum ada tugas yang diberikan.</p>
                ) : (
                  tugasList.map((t) => (
                    <div key={t.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{t.judul}</h4>
                          <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                            Target: Kelas {t.target_kelas}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{t.deskripsi || 'Tidak ada deskripsi rinci.'}</p>
                        <p className="text-[11px] text-rose-600 font-bold font-mono">
                          Batas Deadline: {formatTanggal(t.deadline, 'lengkap')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTugas(t.id)}
                        className="no-print p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </TabelCetak>
          </div>
        </div>
      )}

      {/* Modal Tambah Kolom Nilai */}
      <Modal
        isOpen={isTambahKolomOpen}
        onClose={() => setIsTambahKolomOpen(false)}
        title="Tambah Kolom Penilaian Baru"
        description="Contoh: Formatif 2, Sumatif Bab 2, UTS, Portofolio"
      >
        <form onSubmit={handleTambahKolom} className="space-y-4">
          <Input
            label="Nama Jenis Penilaian"
            placeholder="Contoh: Sumatif Lingkup Materi 2"
            value={namaKolomBaru}
            onChange={(e) => setNamaKolomBaru(e.target.value)}
            required
          />
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTambahKolomOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Tambahkan Kolom
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Catatan */}
      <Modal
        isOpen={isCatatanModalOpen}
        onClose={() => setIsCatatanModalOpen(false)}
        title="Rekam Catatan Karakter Siswa"
        description="Pilih siswa dan masukkan catatan jurnal sikap harian"
      >
        <form onSubmit={handleSaveCatatan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Siswa</label>
            <select
              value={catatanSiswaNis}
              onChange={(e) => setCatatanSiswaNis(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {siswas.map((s) => (
                <option key={s.nis} value={s.nis}>
                  {s.nama} ({s.nis})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Catatan</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <input
                  type="radio"
                  name="jenis"
                  checked={catatanJenis === 'Positif'}
                  onChange={() => setCatatanJenis('Positif')}
                />
                Positif (Apresiasi / Kemajuan)
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-rose-700">
                <input
                  type="radio"
                  name="jenis"
                  checked={catatanJenis === 'Negatif'}
                  onChange={() => setCatatanJenis('Negatif')}
                />
                Negatif (Perlu Pembinaan)
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Uraian / Keterangan Perilaku</label>
            <textarea
              rows={3}
              required
              placeholder="Jelaskan secara ringkas perilaku yang diamati..."
              value={catatanKet}
              onChange={(e) => setCatatanKet(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCatatanModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Simpan Catatan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Penugasan */}
      <Modal
        isOpen={isTugasModalOpen}
        onClose={() => setIsTugasModalOpen(false)}
        title="Terbitkan Tugas Belajar Baru"
        description={`Tugas ini akan langsung masuk ke beranda siswa kelas ${kelas}`}
      >
        <form onSubmit={handleSaveTugas} className="space-y-4">
          <Input
            label="Judul Tugas"
            placeholder="Contoh: Analisis Cerpen & Unsur Intrinsik"
            value={tugasJudul}
            onChange={(e) => setTugasJudul(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Instruksi & Deskripsi Tugas</label>
            <textarea
              rows={3}
              placeholder="Instruksi pengerjaan tugas, buku referensi, dll..."
              value={tugasDeskripsi}
              onChange={(e) => setTugasDeskripsi(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Input
            label="Batas Akhir Pengumpulan (Deadline)"
            type="date"
            value={tugasDeadline}
            onChange={(e) => setTugasDeadline(e.target.value)}
            required
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTugasModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Terbitkan Tugas
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
