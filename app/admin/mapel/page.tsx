'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - CRUD Mata Pelajaran & Assignment Guru/Kelas
 * app/admin/mapel/page.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  GraduationCap,
  School
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table.tsx';
import { Toast } from '@/components/ui/Toast.tsx';

export default function AdminMapelPage() {
  const [mapels, setMapels] = useState<any[]>([]);
  const [gurus, setGurus] = useState<any[]>([]);
  const [kelases, setKelases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMapel, setSelectedMapel] = useState<any>(null);

  // Form State
  const [kode, setKode] = useState('');
  const [namaMapel, setNamaMapel] = useState('');
  const [guruId, setGuruId] = useState('');
  const [kelasDiampu, setKelasDiampu] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resM, resG, resK] = await Promise.all([
        fetch('/api/admin/mapel'),
        fetch('/api/admin/guru'),
        fetch('/api/admin/kelas'),
      ]);
      const jsonM = await resM.json();
      const jsonG = await resG.json();
      const jsonK = await resK.json();

      if (jsonM.success) setMapels(jsonM.data || []);
      if (jsonG.success) setGurus(jsonG.data || []);
      if (jsonK.success) setKelases(jsonK.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setSelectedMapel(null);
    setKode('');
    setNamaMapel('');
    setGuruId(gurus[0]?.id || '');
    setKelasDiampu('7A, 7B');
    setIsModalOpen(true);
  };

  const openEditModal = (m: any) => {
    setSelectedMapel(m);
    setKode(m.kode);
    setNamaMapel(m.nama_mapel);
    setGuruId(m.guru_id);
    setKelasDiampu(m.kelas_diampu || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        kode,
        nama_mapel: namaMapel,
        guru_id: guruId,
        kelas_diampu: kelasDiampu,
      };

      if (selectedMapel) {
        payload.id = selectedMapel.id;
      }

      const res = await fetch('/api/admin/mapel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage(selectedMapel ? 'Mapel diperbarui.' : 'Mata pelajaran berhasil ditambahkan.');
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(json.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (m: any) => {
    if (!confirm(`Hapus mata pelajaran ${m.nama_mapel}?`)) return;
    try {
      const res = await fetch(`/api/admin/mapel?id=${m.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToastMessage('Mapel berhasil dihapus.');
        fetchData();
      }
    } catch {
      alert('Gagal menghapus data.');
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
            Mata Pelajaran & Assignment Guru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar kurikulum mata pelajaran, penugasan guru pengampu, dan rombel kelas yang diajar
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
            Tambah Mapel Baru
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode & Nama Mapel</TableHead>
              <TableHead>Guru Pengampu</TableHead>
              <TableHead>Rombel Kelas yang Diampu</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mapels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  {loading ? 'Memuat mata pelajaran...' : 'Belum ada data mata pelajaran.'}
                </TableCell>
              </TableRow>
            ) : (
              mapels.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black bg-blue-100 text-blue-900 px-2 py-1 rounded-md border border-blue-200">
                        {m.kode}
                      </span>
                      <span className="font-bold text-slate-900">{m.nama_mapel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-800">
                        {m.nama_guru || 'Belum ditugaskan'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {String(m.kelas_diampu || '')
                        .split(',')
                        .map((k, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-xs border border-slate-200"
                          >
                            Kelas {k.trim()}
                          </span>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Tambah/Edit Mapel */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
        description="Atur kode, nama mata pelajaran, guru pengajar, dan rombel sasaran"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Mapel"
              placeholder="Contoh: BIN-7, MAT-7"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              required
            />

            <Input
              label="Nama Mata Pelajaran"
              placeholder="Contoh: Bahasa Indonesia"
              value={namaMapel}
              onChange={(e) => setNamaMapel(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Guru Pengampu Utama
            </label>
            <select
              value={guruId}
              onChange={(e) => setGuruId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Guru Pengampu --</option>
              {gurus.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama} ({g.nip})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Rombel Kelas yang Diampu (Pisahkan dengan koma)"
            placeholder="Contoh: 7A, 7B"
            value={kelasDiampu}
            onChange={(e) => setKelasDiampu(e.target.value)}
            required
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Simpan Mapel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
