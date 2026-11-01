'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - CRUD Rombongan Belajar (Kelas)
 * app/admin/kelas/page.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Users,
  GraduationCap,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table.tsx';
import { Toast } from '@/components/ui/Toast.tsx';
import { TabelCetak } from '@/components/TabelCetak.tsx';

export default function AdminKelasPage() {
  const [kelases, setKelases] = useState<any[]>([]);
  const [gurus, setGurus] = useState<any[]>([]);
  const [siswas, setSiswas] = useState<any[]>([]);
  const [pengaturan, setPengaturan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<any>(null);

  // State Cetak Rekap Rombel
  const [printKelas, setPrintKelas] = useState<any | null>(null);

  // Form State
  const [namaKelas, setNamaKelas] = useState('');
  const [tingkat, setTingkat] = useState('7');
  const [waliKelas, setWaliKelas] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resK, resG, resS, resP] = await Promise.all([
        fetch('/api/admin/kelas'),
        fetch('/api/admin/guru'),
        fetch('/api/admin/siswa'),
        fetch('/api/admin/pengaturan'),
      ]);
      const jsonK = await resK.json();
      const jsonG = await resG.json();
      const jsonS = await resS.json();
      const jsonP = await resP.json();

      if (jsonK.success) setKelases(jsonK.data || []);
      if (jsonG.success) setGurus(jsonG.data || []);
      if (jsonS.success) setSiswas(jsonS.data || []);
      if (jsonP.success && jsonP.data) setPengaturan(jsonP.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setSelectedKelas(null);
    setNamaKelas('');
    setTingkat('7');
    setWaliKelas(gurus[0]?.nama || '');
    setTahunAjaran('2024/2025');
    setIsModalOpen(true);
  };

  const openEditModal = (k: any) => {
    setSelectedKelas(k);
    setNamaKelas(k.nama_kelas);
    setTingkat(k.tingkat);
    setWaliKelas(k.wali_kelas);
    setTahunAjaran(k.tahun_ajaran || '2024/2025');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        nama_kelas: namaKelas,
        tingkat,
        wali_kelas: waliKelas,
        tahun_ajaran: tahunAjaran,
      };

      if (selectedKelas) {
        payload.id = selectedKelas.id;
      }

      const res = await fetch('/api/admin/kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage(selectedKelas ? 'Data rombel diperbarui.' : 'Rombel kelas baru berhasil disimpan.');
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(json.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (k: any) => {
    if (!confirm(`Hapus rombel kelas ${k.nama_kelas}?`)) return;
    try {
      const res = await fetch(`/api/admin/kelas?id=${k.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToastMessage('Kelas berhasil dihapus.');
        fetchData();
      }
    } catch {
      alert('Gagal menghapus data kelas.');
    }
  };

  return (
    <div className="space-y-6">
      <Toast
        isOpen={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="success"
        onClose={() => setToastMessage(null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Rombongan Belajar (Kelas)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data pembagian rombel, tingkat kelas, dan penugasan wali kelas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchData}
          >
            Segarkan
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openAddModal}
          >
            Tambah Kelas Baru
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kelas</TableHead>
              <TableHead>Tingkat</TableHead>
              <TableHead>Wali Kelas</TableHead>
              <TableHead>Jumlah Siswa</TableHead>
              <TableHead>Tahun Ajaran</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kelases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  {loading ? 'Memuat rombel kelas...' : 'Belum ada data kelas.'}
                </TableCell>
              </TableRow>
            ) : (
              kelases.map((k) => {
                const countSiswa = siswas.filter((s) => s.kelas === k.nama_kelas).length;
                return (
                  <TableRow key={k.id}>
                    <TableCell>
                      <span className="font-black text-sm text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                        Kelas {k.nama_kelas}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-slate-700">Tingkat {k.tingkat}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-semibold text-slate-800">{k.wali_kelas || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {countSiswa} Siswa
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">{k.tahun_ajaran}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPrintKelas(k)}
                          className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition"
                          title="Cetak Rekap Rombel Kelas"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(k)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Kelas"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(k)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Cetak Rekap Rombel Siswa */}
      {printKelas && (
        <Modal
          isOpen={Boolean(printKelas)}
          onClose={() => setPrintKelas(null)}
          title={`Cetak Rekap Siswa Kelas ${printKelas.nama_kelas}`}
          description="Format siap cetak resmi A4 dengan kop dinas sekolah dan tanda tangan"
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="no-print flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">
              <span className="text-blue-900 font-semibold">
                Pratinjau Dokumen Rekap Rombel • Standar Kertas A4 Portrait
              </span>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Cetak Sekarang
              </Button>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 bg-white max-h-[70vh] overflow-y-auto">
              <TabelCetak
                judulDokumen={`DAFTAR PESERTA DIDIK DAN REKAP ROMBONGAN BELAJAR`}
                subJudul={`Kelas ${printKelas.nama_kelas} • Tingkat ${printKelas.tingkat}`}
                kelas={printKelas.nama_kelas}
                tahunAjaran={printKelas.tahun_ajaran}
                namaWaliKelas={printKelas.wali_kelas}
                pengaturan={pengaturan}
                tipeTandaTangan="guru_dan_kepala"
              >
                <div className="mb-4">
                  <table className="w-full text-left text-xs border border-black border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-slate-900 font-bold">
                        <th className="py-2 px-3 border-r border-black w-10 text-center">No</th>
                        <th className="py-2 px-3 border-r border-black w-24">NIS</th>
                        <th className="py-2 px-3 border-r border-black">Nama Lengkap Peserta Didik</th>
                        <th className="py-2 px-3 border-r border-black w-16 text-center">L/P</th>
                        <th className="py-2 px-3 border-r border-black w-28 text-center">Status</th>
                        <th className="py-2 px-3">Pos-el / Kontak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/30">
                      {siswas.filter((s) => s.kelas === printKelas.nama_kelas).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                            Belum ada peserta didik yang terdaftar pada rombel ini.
                          </td>
                        </tr>
                      ) : (
                        siswas
                          .filter((s) => s.kelas === printKelas.nama_kelas)
                          .map((s, idx) => (
                            <tr key={s.id || s.nis} className="hover:bg-slate-50">
                              <td className="py-2 px-3 border-r border-black/30 text-center font-bold">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 border-r border-black/30 font-mono font-bold">
                                {s.nis}
                              </td>
                              <td className="py-2 px-3 border-r border-black/30 font-bold text-slate-900">
                                {s.nama}
                              </td>
                              <td className="py-2 px-3 border-r border-black/30 text-center font-bold">
                                {s.jenis_kelamin || 'L'}
                              </td>
                              <td className="py-2 px-3 border-r border-black/30 text-center">
                                <span className="font-semibold text-emerald-800">Aktif</span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                                {s.email || '-'}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span>
                    Total Siswa Rombel: <strong>{siswas.filter((s) => s.kelas === printKelas.nama_kelas).length} Orang</strong>
                  </span>
                  <span>
                    Laki-laki (L): <strong>{siswas.filter((s) => s.kelas === printKelas.nama_kelas && s.jenis_kelamin === 'L').length}</strong> • 
                    Perempuan (P): <strong>{siswas.filter((s) => s.kelas === printKelas.nama_kelas && s.jenis_kelamin === 'P').length}</strong>
                  </span>
                </div>
              </TabelCetak>
            </div>

            <div className="no-print pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" onClick={() => setPrintKelas(null)}>
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Tambah/Edit Kelas */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedKelas ? 'Edit Rombel Kelas' : 'Tambah Rombel Kelas Baru'}
        description="Tentukan nama rombel, tingkat, dan guru sebagai wali kelas"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nama Kelas"
              placeholder="Contoh: 7A, 8B, 9C"
              value={namaKelas}
              onChange={(e) => setNamaKelas(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Kelas</label>
              <select
                value={tingkat}
                onChange={(e) => setTingkat(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Tingkat 7</option>
                <option value="8">Tingkat 8</option>
                <option value="9">Tingkat 9</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Wali Kelas</label>
            <select
              value={waliKelas}
              onChange={(e) => setWaliKelas(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Guru Wali Kelas --</option>
              {gurus.map((g) => (
                <option key={g.id} value={g.nama}>
                  {g.nama} ({g.mapel_utama})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Tahun Ajaran"
            placeholder="2024/2025"
            value={tahunAjaran}
            onChange={(e) => setTahunAjaran(e.target.value)}
            required
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Simpan Rombel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
