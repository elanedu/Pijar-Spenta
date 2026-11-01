'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - CRUD Guru & Tenaga Pendidik
 * app/admin/guru/page.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table.tsx';
import { Toast } from '@/components/ui/Toast.tsx';

export default function AdminGuruPage() {
  const [gurus, setGurus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState<any>(null);

  // Form State
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [mapelUtama, setMapelUtama] = useState('');
  const [status, setStatus] = useState('Aktif');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchGurus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/guru');
      const json = await res.json();
      if (json.success) setGurus(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGurus();
  }, []);

  const openAddModal = () => {
    setSelectedGuru(null);
    setNama('');
    setNip('');
    setMapelUtama('');
    setStatus('Aktif');
    setUsername('');
    setPassword('');
    setIsModalOpen(true);
  };

  const openEditModal = (g: any) => {
    setSelectedGuru(g);
    setNama(g.nama);
    setNip(g.nip);
    setMapelUtama(g.mapel_utama);
    setStatus(g.status || 'Aktif');
    setUsername('');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = { nama, nip, mapel_utama: mapelUtama, status };
      if (selectedGuru) {
        payload.id = selectedGuru.id;
        payload.user_id = selectedGuru.user_id;
      } else {
        payload.username = username || `guru_${nip.slice(-4)}`;
        payload.password = password || 'guru123';
      }

      const res = await fetch('/api/admin/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage(selectedGuru ? 'Data guru diperbarui.' : 'Guru baru berhasil ditambahkan.');
        setIsModalOpen(false);
        fetchGurus();
      } else {
        alert(json.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (g: any) => {
    if (!confirm(`Hapus guru ${g.nama}?`)) return;
    try {
      const res = await fetch(`/api/admin/guru?id=${g.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToastMessage('Data guru berhasil dihapus.');
        fetchGurus();
      }
    } catch {
      alert('Gagal menghapus data.');
    }
  };

  const filtered = gurus.filter(
    (g) =>
      (g.nama && g.nama.toLowerCase().includes(search.toLowerCase())) ||
      (g.nip && g.nip.toLowerCase().includes(search.toLowerCase())) ||
      (g.mapel_utama && g.mapel_utama.toLowerCase().includes(search.toLowerCase()))
  );

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
            Data Guru & Tenaga Pendidik
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data biodata guru, NIP, spesialisasi mata pelajaran utama, dan akun login
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchGurus}
          >
            Segarkan
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openAddModal}
          >
            Tambah Guru Baru
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari guru berdasarkan nama, NIP, mapel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Guru & NIP</TableHead>
              <TableHead>Mata Pelajaran Utama</TableHead>
              <TableHead>Status Kepegawaian</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                  {loading ? 'Memuat data guru...' : 'Belum ada data guru.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-xs">
                        {g.nama?.charAt(0) || 'G'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{g.nama}</p>
                        <p className="font-mono text-xs text-slate-400">NIP: {g.nip}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                      <BookOpen className="w-3.5 h-3.5" />
                      {g.mapel_utama}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        g.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {g.status || 'Aktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(g)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(g)}
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

      {/* Modal Tambah / Edit Guru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedGuru ? 'Edit Data Guru' : 'Tambah Guru Baru'}
        description="Lengkapi data profil guru dan mata pelajaran yang diampu"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nama Lengkap & Gelar"
            placeholder="Contoh: Budi Santoso, S.Pd."
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nomor Induk Pegawai (NIP)"
              placeholder="18 digit NIP"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              required
            />

            <Input
              label="Mata Pelajaran Utama"
              placeholder="Contoh: Bahasa Indonesia"
              value={mapelUtama}
              onChange={(e) => setMapelUtama(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Aktif">Aktif</option>
              <option value="Cuti">Cuti</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          {!selectedGuru && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-800">Akun Login Guru (Otomatis Dibuat di USERS):</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Username"
                  placeholder="guru_nama"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                  label="Password Awal"
                  type="password"
                  placeholder="Default: guru123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Simpan Data Guru
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
