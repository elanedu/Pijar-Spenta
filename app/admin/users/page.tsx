'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Manajemen Users & Reset Password
 * app/admin/users/page.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table.tsx';
import { Toast } from '@/components/ui/Toast.tsx';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form State
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'guru' | 'siswa'>('siswa');
  const [formAktif, setFormAktif] = useState('Ya');

  const [newPassword, setNewPassword] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setSelectedUser(null);
    setFormUsername('');
    setFormPassword('');
    setFormNama('');
    setFormEmail('');
    setFormRole('siswa');
    setFormAktif('Ya');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (u: any) => {
    setSelectedUser(u);
    setFormUsername(u.username);
    setFormPassword('');
    setFormNama(u.nama);
    setFormEmail(u.email || '');
    setFormRole(u.role);
    setFormAktif(u.aktif || 'Ya');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openResetModal = (u: any) => {
    setSelectedUser(u);
    setNewPassword('');
    setIsResetOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const payload: any = {
        username: formUsername.trim(),
        nama: formNama.trim(),
        email: formEmail.trim(),
        role: formRole,
        aktif: formAktif,
      };

      if (selectedUser) {
        payload.id = selectedUser.id;
        if (formPassword) payload.password = formPassword;
      } else {
        payload.password = formPassword || 'pijar123';
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage(selectedUser ? 'Pengguna diperbarui.' : `Pengguna baru '${payload.username}' berhasil ditambahkan.`);
        setIsFormOpen(false);
        fetchUsers();
      } else {
        setFormError(json.message || 'Gagal menyimpan pengguna.');
      }
    } catch (err: any) {
      setFormError('Terjadi kesalahan jaringan atau server: ' + (err.message || 'Koneksi terputus.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          id: selectedUser.id,
          password: newPassword,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setToastMessage(`Password untuk ${selectedUser.username} berhasil direset.`);
        setIsResetOpen(false);
      } else {
        alert(json.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!confirm(`Yakin ingin menghapus pengguna '${u.nama}' (${u.username})?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${u.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setToastMessage('Pengguna berhasil dihapus.');
        fetchUsers();
      }
    } catch {
      alert('Gagal menghapus pengguna.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.nama && u.nama.toLowerCase().includes(search.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <Toast
        isOpen={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="success"
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Akun Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar kredensial akun Admin, Guru, dan Siswa beserta kontrol status aktif & reset sandi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchUsers}
          >
            Segarkan
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={openAddModal}
          >
            Tambah Pengguna
          </Button>
        </div>
      </div>

      {/* Petunjuk Penggunaan Cepat */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-3">
        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700 shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-blue-950">Cara Menambahkan Akun Pengguna Baru:</p>
          <p className="text-blue-800 leading-relaxed">
            1. Klik tombol biru <strong>+ Tambah Pengguna</strong> di kanan atas. <br />
            2. Masukkan <strong>Nama Lengkap</strong>, <strong>Username</strong> unik (misal: <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900">guru_anwar</code> atau <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900">1011</code>), dan <strong>Password</strong>. <br />
            3. Pilih Peran (<strong>Admin</strong>, <strong>Guru</strong>, atau <strong>Siswa</strong>). Akun Guru & Siswa akan langsung disinkronkan ke master data akademik secara otomatis!
          </p>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari nama, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter Peran:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Peran ({users.length})</option>
            <option value="admin">Administrator</option>
            <option value="guru">Guru</option>
            <option value="siswa">Siswa</option>
          </select>
        </div>
      </div>

      {/* Tabel Data Users */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User / Akun</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  {loading ? 'Memuat pengguna...' : 'Tidak ada data pengguna ditemukan.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                        {u.nama?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{u.nama}</p>
                        <p className="font-mono text-xs text-blue-700 font-semibold">{u.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : u.role === 'guru'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs">{u.email || '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        u.aktif === 'Ya'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {u.aktif === 'Ya' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openResetModal(u)}
                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus User"
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

      {/* Modal Tambah / Edit User */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedUser ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
        description="Isi kredensial akun dan perannya dalam sistem"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Drs. H. Ahmad Dahlan"
            value={formNama}
            onChange={(e) => setFormNama(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Username / NIS"
              placeholder="admin, guru_budi, dll"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Peran (Role)</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="siswa">Siswa</option>
                <option value="guru">Guru</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <Input
            label={selectedUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Akun'}
            type="password"
            placeholder={selectedUser ? 'Tetap gunakan kata sandi lama' : 'Password awal'}
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            required={!selectedUser}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="user@sekolah.sch.id"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Akun</label>
              <select
                value={formAktif}
                onChange={(e) => setFormAktif(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ya">Aktif</option>
                <option value="Tidak">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title={`Reset Password: ${selectedUser?.nama}`}
        description={`Username: ${selectedUser?.username}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="Password Baru"
            type="password"
            placeholder="Masukkan kata sandi baru (cth: rahasia123)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <p className="text-xs text-slate-500">
            Kata sandi baru akan langsung dienkripsi menggunakan bcrypt (10 rounds) dan disimpan ke sheet USERS.
          </p>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Reset Kata Sandi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
