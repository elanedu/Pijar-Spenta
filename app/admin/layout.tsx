'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Layout Khusus Administrator
 * app/admin/layout.tsx
 * Menyediakan Sidebar navigasi admin dan header terpadu
 */

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar.tsx';
import { PENGATURAN_DEFAULT } from '@/lib/constants.ts';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<any>({
    id: 'USR-ADM-001',
    nama: 'Administrator PIJAR',
    username: 'admin',
    role: 'admin',
    email: 'admin@pijar-spenta.sch.id',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (json.data.role !== 'admin') {
            window.location.href = '/login';
          } else {
            setAdminUser(json.data);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <Sidebar
        user={adminUser}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/admin'}
        onNavigate={(path) => {
          window.location.href = path;
        }}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="no-print bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Panel Administrator Sekolah</h2>
            <p className="text-xs text-slate-500">
              {PENGATURAN_DEFAULT.nama_sekolah} • Tahun Ajaran {PENGATURAN_DEFAULT.tahun_ajaran} ({PENGATURAN_DEFAULT.semester})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{adminUser.nama}</p>
              <p className="text-[11px] text-slate-500 font-medium">Administrator Utama</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center border border-blue-200 text-xs shadow-inner">
              A
            </div>
          </div>
        </header>

        {/* Isi Halaman Admin */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
