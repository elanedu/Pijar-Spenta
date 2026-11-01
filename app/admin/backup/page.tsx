'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Backup Data & Cetak Rekap Global Kelas
 * app/admin/backup/page.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Printer,
  RefreshCw,
  FileJson,
  CheckCircle2,
  CalendarCheck,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { TabelCetak } from '@/components/TabelCetak.tsx';
import { PENGATURAN_DEFAULT } from '@/lib/constants.ts';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table.tsx';

export default function AdminBackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [backupSummary, setBackupSummary] = useState<any>(null);

  // State untuk Cetak Rekap Global per Kelas
  const [kelases, setKelases] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('7A');
  const [siswaKelas, setSiswaKelas] = useState<any[]>([]);
  const [nilaiList, setNilaiList] = useState<any[]>([]);
  const [kehadiranList, setKehadiranList] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(PENGATURAN_DEFAULT);
  const [loadingRekap, setLoadingRekap] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedKelas) {
      loadRekapKelas(selectedKelas);
    }
  }, [selectedKelas]);

  const fetchInitialData = async () => {
    try {
      const [resK, resSet] = await Promise.all([
        fetch('/api/admin/kelas'),
        fetch('/api/admin/pengaturan'),
      ]);
      const jsonK = await resK.json();
      const jsonSet = await resSet.json();

      if (jsonK.success && jsonK.data?.length > 0) {
        setKelases(jsonK.data);
        setSelectedKelas(jsonK.data[0].nama_kelas);
      }
      if (jsonSet.success && jsonSet.data) {
        setSettings(jsonSet.data);
      }
    } catch {
      // Handle error
    }
  };

  const loadRekapKelas = async (kls: string) => {
    setLoadingRekap(true);
    try {
      const [resS, resDash] = await Promise.all([
        fetch(`/api/admin/siswa?kelas=${encodeURIComponent(kls)}`),
        fetch('/api/admin/dashboard'),
      ]);
      const jsonS = await resS.json();
      if (jsonS.success) setSiswaKelas(jsonS.data || []);
    } finally {
      setLoadingRekap(false);
    }
  };

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/admin/backup');
      const json = await res.json();
      if (json.success && json.data) {
        setBackupSummary(json.data);

        // Unduh sebagai file JSON di browser
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `backup-edulog-${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } else {
        alert('Gagal membuat file backup.');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Backup Database & Cetak Rekap Global
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ekspor seluruh 10 lembar sheet ke file JSON cadangan dan cetak rekap nilai per rombel
          </p>
        </div>
      </div>

      {/* Bagian 1: Card Backup Data JSON */}
      <div className="no-print bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Cadangkan Database Lengkap (Export JSON)
              </h3>
              <p className="text-xs text-slate-500">
                Mencakup 10 sheet: USERS, GURU, SISWA, KELAS, MAPEL, PENUGASAN, KEHADIRAN, NILAI, CATATAN, PENGATURAN
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            isLoading={downloading}
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleDownloadBackup}
          >
            Unduh Cadangan JSON
          </Button>
        </div>

        {backupSummary && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">File Cadangan Berhasil Diunduh!</p>
              <p className="text-emerald-700 mt-0.5">
                Waktu ekspor: {backupSummary.exportedAt} • Total 10 sheet berhasil diekspor lengkap.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bagian 2: Cetak Rekap Global Per Kelas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="no-print px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Cetak Rekap Global Kelas Resmi
            </h3>
            <p className="text-xs text-slate-500">
              Pilih rombel untuk mencetak lembar rekapitulasi siswa dengan kop dinas dan tanda tangan
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
            >
              {kelases.map((k) => (
                <option key={k.id} value={k.nama_kelas}>
                  Kelas {k.nama_kelas} ({k.wali_kelas})
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Cetak Rekap Kelas {selectedKelas}
            </Button>
          </div>
        </div>

        {/* Lembar Cetak Kop Surat Resmi */}
        <div className="p-4 sm:p-8">
          <TabelCetak
            judulDokumen={`REKAPITULASI DATA PESERTA DIDIK KELAS ${selectedKelas}`}
            nomorSurat={`421/REKAP-${selectedKelas}/SMP.SPENTA/${new Date().getFullYear()}`}
            subJudul="Daftar Siswa, Status Keaktifan, dan Profil Akademik Semester Berjalan"
            kelas={selectedKelas}
            semester={settings.semester}
            tahunAjaran={settings.tahun_ajaran}
            pengaturan={settings}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-200 border-b border-black text-black">
                    <th className="py-2 px-3 border-r border-black w-10 text-center">No</th>
                    <th className="py-2 px-3 border-r border-black w-24">NIS</th>
                    <th className="py-2 px-3 border-r border-black">Nama Lengkap Siswa</th>
                    <th className="py-2 px-3 border-r border-black w-16 text-center">L/P</th>
                    <th className="py-2 px-3 border-r border-black">Email Akun</th>
                    <th className="py-2 px-3 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {siswaKelas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center border-b border-black">
                        Tidak ada data siswa untuk rombel ini.
                      </td>
                    </tr>
                  ) : (
                    siswaKelas.map((s, idx) => (
                      <tr key={s.id || idx} className="border-b border-black">
                        <td className="py-2 px-3 border-r border-black text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-black font-mono font-bold">
                          {s.nis}
                        </td>
                        <td className="py-2 px-3 border-r border-black font-medium">{s.nama}</td>
                        <td className="py-2 px-3 border-r border-black text-center">
                          {s.jenis_kelamin || 'L'}
                        </td>
                        <td className="py-2 px-3 border-r border-black text-slate-700">
                          {s.email || '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold">
                          {s.aktif === 'Ya' ? 'Aktif' : 'Nonaktif'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabelCetak>
        </div>
      </div>
    </div>
  );
}
