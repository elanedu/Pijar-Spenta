/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Aplikasi Utama (Router & Layout Multi-Peran)
 * Mengintegrasikan Panel Admin Lengkap (Tahap 4) dengan navigasi aktif dan live CRUD
 */

import React, { useState, useEffect } from 'react';
import {
  School,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Shield,
  GraduationCap,
  Users,
  LayoutDashboard,
  CalendarCheck,
  Award,
  FileText,
  ClipboardList,
  Printer,
  Settings,
  Database,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Toast } from '@/components/ui/Toast.tsx';
import { UserRole, PENGATURAN_DEFAULT } from '@/lib/constants.ts';

// Halaman-halaman Panel Admin (Tahap 4)
import AdminDashboardPage from '../app/admin/page.tsx';
import AdminUsersPage from '../app/admin/users/page.tsx';
import AdminGuruPage from '../app/admin/guru/page.tsx';
import AdminSiswaPage from '../app/admin/siswa/page.tsx';
import AdminKelasPage from '../app/admin/kelas/page.tsx';
import AdminMapelPage from '../app/admin/mapel/page.tsx';
import AdminPengaturanPage from '../app/admin/pengaturan/page.tsx';
import AdminBackupPage from '../app/admin/backup/page.tsx';
import AdminPanduanPage from '../app/admin/panduan/page.tsx';

// Halaman-halaman Panel Guru (Tahap 5)
import GuruDashboardPage from '../app/guru/page.tsx';
import GuruClassDetailPage from '../app/guru/kelas/[mapel]/[kelas]/page.tsx';

// Halaman-halaman Panel Siswa (Tahap 6)
import SiswaDashboardPage from '../app/siswa/page.tsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/admin');
  const [user, setUser] = useState<{
    id: string;
    nama: string;
    role: UserRole;
    username: string;
    email?: string;
    extraId?: string;
    kelas?: string;
    mapel?: string;
    foto?: string;
  } | null>({
    id: 'USR-ADM-001',
    nama: 'Administrator PIJAR',
    username: 'admin',
    role: 'admin',
    email: 'admin@pijar-spenta.sch.id',
  });

  // State form login
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('pijar_spenta_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/me', { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data);
        redirectByRole(json.data.role);
      }
    } catch {
      // Abaikan jika offline
    }
  };

  const redirectByRole = (role: UserRole) => {
    if (role === 'admin') setCurrentPath('/admin');
    else if (role === 'guru') setCurrentPath('/guru');
    else if (role === 'siswa') setCurrentPath('/siswa');
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Silakan isi username dan password Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!result.success || !result.data?.user) {
        setErrorMessage(result.message || 'Username atau password yang Anda masukkan salah.');
        setIsLoading(false);
        return;
      }

      const loggedUser = result.data.user;
      if (result.data.token) {
        localStorage.setItem('pijar_spenta_token', result.data.token);
      }
      setUser(loggedUser);
      setToastMessage(`Login berhasil! Selamat datang, ${loggedUser.nama}.`);

      setTimeout(() => {
        redirectByRole(loggedUser.role);
        setIsLoading(false);
      }, 400);
    } catch (err: any) {
      setErrorMessage('Terjadi kendala koneksi ke server. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Abaikan
    }
    localStorage.removeItem('pijar_spenta_token');
    setUser(null);
    setCurrentPath('/login');
    setToastMessage('Anda telah berhasil keluar (Logout).');
  };

  const setQuickAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  // State kelas aktif yang sedang dibuka oleh Guru
  const [selectedGuruClass, setSelectedGuruClass] = useState<{ mapel: string; kelas: string } | null>(null);

  // Render konten dinamis untuk rute Admin
  const renderAdminContent = () => {
    switch (currentPath) {
      case '/admin/users':
        return <AdminUsersPage />;
      case '/admin/guru':
        return <AdminGuruPage />;
      case '/admin/siswa':
        return <AdminSiswaPage />;
      case '/admin/kelas':
        return <AdminKelasPage />;
      case '/admin/mapel':
        return <AdminMapelPage />;
      case '/admin/pengaturan':
        return <AdminPengaturanPage />;
      case '/admin/backup':
        return <AdminBackupPage />;
      case '/admin/panduan':
        return <AdminPanduanPage />;
      case '/admin':
      default:
        return <AdminDashboardPage />;
    }
  };

  // Render konten dinamis untuk rute Guru
  const renderGuruContent = () => {
    // Jika rute spesifik diklik di sidebar (/guru/kehadiran, dll) dan belum pilih kelas, default ke 7A
    if (!selectedGuruClass && currentPath !== '/guru') {
      return (
        <GuruClassDetailPage
          mapel={user?.mapel || 'Bahasa Indonesia'}
          kelas="7A"
          onBack={() => {
            setCurrentPath('/guru');
            setSelectedGuruClass(null);
          }}
        />
      );
    }

    if (selectedGuruClass) {
      return (
        <GuruClassDetailPage
          mapel={selectedGuruClass.mapel}
          kelas={selectedGuruClass.kelas}
          onBack={() => setSelectedGuruClass(null)}
        />
      );
    }

    return (
      <GuruDashboardPage
        onSelectClass={(mapel, kelas) => setSelectedGuruClass({ mapel, kelas })}
      />
    );
  };

  // Render konten dinamis untuk rute Siswa (Tahap 6)
  const renderSiswaContent = () => {
    let initialTab: 'nilai' | 'kehadiran' | 'catatan' | 'penugasan' | 'raport' = 'nilai';
    if (currentPath === '/siswa/kehadiran') initialTab = 'kehadiran';
    else if (currentPath === '/siswa/catatan') initialTab = 'catatan';
    else if (currentPath === '/siswa/penugasan') initialTab = 'penugasan';
    else if (currentPath === '/siswa/raport') initialTab = 'raport';
    else if (currentPath === '/siswa/nilai') initialTab = 'nilai';

    return <SiswaDashboardPage initialTab={initialTab} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* Toast Notifikasi */}
      <Toast
        isOpen={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="success"
        onClose={() => setToastMessage(null)}
      />

      {/* Top Banner Status Proyek Tahap 8 */}
      <div className="no-print bg-slate-900 border-b border-slate-800 text-slate-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-white">PIJAR SPENTA</span>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-400 font-semibold">Tahap 8 Selesai (100%):</span>
          <span>Dokumentasi Komprehensif, Inspeksi Status Database Google Sheets, & Siap Deploy Vercel</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">Login sebagai:</span>
              <span className="font-bold text-white">{user.nama}</span>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-rose-400 hover:text-rose-200 ml-1 underline"
              >
                Ganti Akun
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">Silakan login untuk menjelajahi panel</span>
          )}
        </div>
      </div>

      {/* TAMPILAN HALAMAN LOGIN */}
      {(!user || currentPath === '/login') && (
        <div className="flex-1 min-h-[calc(100vh-37px)] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 items-center justify-center shadow-xl shadow-blue-500/25 border border-blue-400/30 mb-2">
                <School className="w-9 h-9 text-yellow-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                PIJAR SPENTA
              </h1>
              <p className="text-xs sm:text-sm text-blue-200">
                Sistem Manajemen Pembelajaran Terpadu Sekolah
              </p>
              <div className="inline-block bg-blue-900/60 border border-blue-700/50 px-3 py-1 rounded-full text-[11px] font-medium text-blue-300">
                SMP NEGERI 1 SPENTA • T.A. 2024/2025
              </div>
            </div>

            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">Masuk ke Akun Anda</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akses portal Admin, Guru, atau Siswa dengan kredensial Anda.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Gagal Masuk</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Username atau NIS Siswa"
                  placeholder="Contoh: admin, guru_budi, atau 1001"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  leftIcon={<User className="w-4 h-4" />}
                  autoComplete="username"
                  required
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  leftIcon={<Lock className="w-4 h-4" />}
                  autoComplete="current-password"
                  required
                  rightIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={<LogIn className="w-4 h-4" />}
                  className="w-full mt-2"
                >
                  Masuk Sekarang
                </Button>
              </form>

              {/* Demo Account Shortcuts */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
                  Pilih Cepat Akun Demo (Klik untuk Isi):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickAccount('admin', 'admin123')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 transition text-center group"
                  >
                    <Shield className="w-4 h-4 text-blue-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-800">Admin</div>
                    <div className="text-[10px] text-slate-400 font-mono">admin123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickAccount('guru_budi', 'guru123')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 transition text-center group"
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-800">Guru</div>
                    <div className="text-[10px] text-slate-400 font-mono">guru123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickAccount('1001', 'siswa123')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/60 transition text-center group"
                  >
                    <Users className="w-4 h-4 text-emerald-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-800">Siswa</div>
                    <div className="text-[10px] text-slate-400 font-mono">siswa123</div>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-blue-300/80">
              PIJAR SPENTA &copy; 2024 • Autentikasi JWT & Database Google Sheets
            </p>
          </div>
        </div>
      )}

      {/* TAMPILAN DASHBOARD MULTI-PANEL SETELAH LOGIN */}
      {user && currentPath !== '/login' && (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            user={user}
            currentPath={currentPath}
            onNavigate={(path) => setCurrentPath(path)}
            onLogout={handleLogout}
          />

          <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-100/60">
            {/* Topbar Layout */}
            <header className="no-print bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {user.role === 'admin'
                    ? 'Panel Administrator Sekolah'
                    : user.role === 'guru'
                    ? `Portal Pengajar • ${user.mapel || 'Guru Mata Pelajaran'}`
                    : `Portal Siswa • Kelas ${user.kelas || '7A'}`}
                </h2>
                <p className="text-xs text-slate-500">
                  {PENGATURAN_DEFAULT.nama_sekolah} • T.A. {PENGATURAN_DEFAULT.tahun_ajaran} ({PENGATURAN_DEFAULT.semester})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">{user.nama}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{user.role} Aktif</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center border border-blue-200 text-xs">
                  {user.nama.charAt(0).toUpperCase()}
                </div>
              </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 p-6">
              {user.role === 'admin' ? (
                renderAdminContent()
              ) : user.role === 'guru' ? (
                renderGuruContent()
              ) : (
                renderSiswaContent()
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
