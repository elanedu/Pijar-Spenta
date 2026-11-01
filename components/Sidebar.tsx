/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Komponen Sidebar Navigasi Responsif
 * Menampilkan menu yang disesuaikan secara dinamis berdasarkan peran: Admin, Guru, Siswa
 * Memiliki kelas `no-print` agar tidak ikut tercetak saat mencetak dokumen/raport
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  BookOpen,
  Settings,
  Database,
  CalendarCheck,
  Award,
  FileText,
  ClipboardList,
  Printer,
  LogOut,
  ChevronRight,
  Shield,
  UserCheck,
  HelpCircle
} from 'lucide-react';
import { UserRole } from '@/lib/constants.ts';
import { cn } from '@/lib/utils.ts';

export interface SidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  user: {
    nama: string;
    role: UserRole;
    username: string;
    extraId?: string;
    kelas?: string;
    mapel?: string;
    foto?: string;
  };
  onLogout: () => void;
}

interface MenuItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export function Sidebar({ currentPath = '/admin', onNavigate, user, onLogout }: SidebarProps) {
  // Menu navigasi khusus peran Admin
  const adminMenu: MenuItem[] = [
    { title: 'Dashboard Statistik', path: '/admin', icon: LayoutDashboard },
    { title: 'Manajemen Users', path: '/admin/users', icon: Users },
    { title: 'Data Guru', path: '/admin/guru', icon: GraduationCap },
    { title: 'Data Siswa', path: '/admin/siswa', icon: UserCheck },
    { title: 'Data Kelas & Rombel', path: '/admin/kelas', icon: School },
    { title: 'Mata Pelajaran', path: '/admin/mapel', icon: BookOpen },
    { title: 'Pengaturan Sekolah', path: '/admin/pengaturan', icon: Settings },
    { title: 'Backup & Export', path: '/admin/backup', icon: Database },
    { title: 'Panduan & Deploy', path: '/admin/panduan', icon: HelpCircle, badge: 'Vercel' },
  ];

  // Menu navigasi khusus peran Guru
  const guruMenu: MenuItem[] = [
    { title: 'Beranda Kelas', path: '/guru', icon: LayoutDashboard },
    { title: 'Presensi & Kehadiran', path: '/guru/kehadiran', icon: CalendarCheck },
    { title: 'Penilaian & KKM', path: '/guru/nilai', icon: Award },
    { title: 'Jurnal Catatan Siswa', path: '/guru/catatan', icon: FileText },
    { title: 'Daftar Penugasan', path: '/guru/penugasan', icon: ClipboardList },
  ];

  // Menu navigasi khusus peran Siswa
  const siswaMenu: MenuItem[] = [
    { title: 'Dashboard Akademik', path: '/siswa', icon: LayoutDashboard },
    { title: 'Buku Nilai', path: '/siswa/nilai', icon: Award },
    { title: 'Rekap Kehadiran', path: '/siswa/kehadiran', icon: CalendarCheck },
    { title: 'Jurnal Karakter', path: '/siswa/catatan', icon: FileText },
    { title: 'Tugas Belajar', path: '/siswa/penugasan', icon: ClipboardList },
    { title: 'Raport Siswa', path: '/siswa/raport', icon: Printer, badge: 'Cetak' },
  ];

  let menuItems: MenuItem[] = adminMenu;
  if (user.role === 'guru') menuItems = guruMenu;
  if (user.role === 'siswa') menuItems = siswaMenu;

  const roleColors = {
    admin: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    guru: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    siswa: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  return (
    <aside className="no-print w-64 bg-slate-900 text-slate-100 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <School className="w-6 h-6 text-yellow-300" />
        </div>
        <div>
          <h2 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            PIJAR SPENTA
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">Sistem Terpadu Sekolah</p>
        </div>
      </div>

      {/* Profil Ringkas Pengguna */}
      <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 overflow-hidden flex items-center justify-center text-slate-300 font-bold shrink-0">
          {user.foto ? (
            <img src={user.foto} alt={user.nama} className="w-full h-full object-cover" />
          ) : (
            user.nama.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{user.nama}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                roleColors[user.role]
              )}
            >
              {user.role}
            </span>
            {user.extraId && (
              <span className="text-[10px] text-slate-400 font-mono truncate">
                {user.extraId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Daftar Menu Navigasi */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Menu {user.role === 'admin' ? 'Administrator' : user.role === 'guru' ? 'Guru Pengajar' : 'Siswa'}
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => {
                if (onNavigate) {
                  onNavigate(item.path);
                } else {
                  window.location.href = item.path;
                }
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition group',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  )}
                />
                <span className="truncate">{item.title}</span>
              </div>
              {item.badge ? (
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Tombol Logout di Bawah */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition border border-rose-900/30"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4" />
            <span>Keluar Aplikasi</span>
          </div>
          <span className="text-[10px] text-rose-500 font-mono">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
