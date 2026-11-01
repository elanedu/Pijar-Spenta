'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - CRUD Siswa & Peserta Didik
 * app/admin/siswa/page.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  School
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table.tsx';
import { Toast } from '@/components/ui/Toast.tsx';

export default function AdminSiswaPage() {
  const [siswas, setSiswas] = useState<any[]>([]);
  const [kelases, setKelases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kelasFilter, setKelasFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);

  // Form State
  const [nis, setNis] = useState('');
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('7A');
  const [jk, setJk] = useState<'L' | 'P'>('L');
  const [email, setEmail] = useState('');
  const [aktif, setAktif] = useState('Ya');
  const [foto, setFoto] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSiswa, resKelas] = await Promise.all([
        fetch('/api/admin/siswa'),
        fetch('/api/admin/kelas'),
      ]);
      const jsonSiswa = await resSiswa.json();
      const jsonKelas = await resKelas.json();

      if (jsonSiswa.success) setSiswas(jsonSiswa.data || []);
      if (jsonKelas.success) setKelases(jsonKelas.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setSelectedSiswa(null);
    setNis('');
    setNama('');
    setKelas(kelases[0]?.nama_kelas || '7A');
    setJk('L');
    setEmail('');
    setAktif('Ya');
    setFoto('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setSelectedSiswa(s);
    setNis(s.nis);
    setNama(s.nama);
    setKelas(s.kelas);
    setJk(s.jenis_kelamin || 'L');
    setEmail(s.email || '');
    setAktif(s.aktif || 'Ya');
    setFoto(s.foto || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        nis,
        nama,
        kelas,
        jenis_kelamin: jk,
        email,
        aktif,
        foto: foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nama)}`,
      };

      if (selectedSiswa) {
        payload.id = selectedSiswa.id;
        payload.user_id = selectedSiswa.user_id;
      }

      const res = await fetch('/api/admin/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage(selectedSiswa ? 'Data siswa diperbarui.' : 'Siswa baru berhasil didaftarkan.');
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(json.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (s: any) => {
    if (!confirm(`Hapus data siswa ${s.nama} (${s.nis})?`)) return;
    try {
      const res = await fetch(`/api/admin/siswa?id=${s.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToastMessage('Siswa berhasil dihapus.');
        fetchData();
      }
    } catch {
      alert('Gagal menghapus siswa.');
    }
  };

  const filtered = siswas.filter((s) => {
    const matchSearch =
      (s.nama && s.nama.toLowerCase().includes(search.toLowerCase())) ||
      (s.nis && s.nis.toLowerCase().includes(search.toLowerCase()));
    const matchKelas = kelasFilter === 'all' || s.kelas === kelasFilter;
    return matchSearch && matchKelas;
  });

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
            Data Peserta Didik (Siswa)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manajemen biodata siswa per rombel, NIS, jenis kelamin, dan foto profil
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
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={openAddModal}
          >
            Tambah Siswa Baru
          </Button>
        </div>
      </div>

      {/* Filter Rombel & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari siswa via nama atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter Kelas:</span>
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Rombel ({siswas.length})</option>
            {kelases.map((k) => (
              <option key={k.id} value={k.nama_kelas}>
                Kelas {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead>L/P</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  {loading ? 'Memuat siswa...' : 'Belum ada data siswa.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <img
                          src={s.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.nama}`}
                          alt={s.nama}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{s.nama}</p>
                        <p className="text-xs text-slate-400">{s.email || '-'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-blue-700">{s.nis}</TableCell>
                  <TableCell>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200">
                      {s.kelas}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-600">
                    {s.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        s.aktif === 'Ya'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {s.aktif === 'Ya' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
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

      {/* Modal Tambah/Edit Siswa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSiswa ? 'Edit Biodata Siswa' : 'Tambah Siswa Baru'}
        description="Lengkapi informasi peserta didik dan rombongan belajarnya"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nama Lengkap Siswa"
            placeholder="Contoh: Ahmad Fauzi"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nomor Induk Siswa (NIS)"
              placeholder="Contoh: 1011"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rombel Kelas</label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                {kelases.map((k) => (
                  <option key={k.id} value={k.nama_kelas}>
                    Kelas {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={jk}
                onChange={(e) => setJk(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Keaktifan</label>
              <select
                value={aktif}
                onChange={(e) => setAktif(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ya">Aktif</option>
                <option value="Tidak">Pindah / Nonaktif</option>
              </select>
            </div>
          </div>

          <Input
            label="Email Siswa"
            type="email"
            placeholder="nis@siswa.pijar-spenta.sch.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Simpan Data Siswa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
