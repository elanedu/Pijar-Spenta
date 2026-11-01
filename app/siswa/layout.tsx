'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Layout Khusus Siswa
 * app/siswa/layout.tsx
 */

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar.tsx';
import { PENGATURAN_DEFAULT } from '@/lib/constants.ts';

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  const [siswaUser, setSiswaUser] = useState<any>({
    id: 'USR-SIS-001',
    nama: 'Ahmad Fauzan',
    username: '1001',
    role: 'siswa',
    extraId: '1001',
    kelas: '7A',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (json.data.role !== 'siswa' && json.data.role !== 'admin') {
            window.location.href = '/login';
          } else {
            setSiswaUser(json.data);
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
        user={siswaUser}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/siswa'}
        onNavigate={(path) => {
          window.location.href = path;
        }}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="no-print bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Portal Siswa • Kelas {siswaUser.kelas || '7A'}
            </h2>
            <p className="text-xs text-slate-500">
              {PENGATURAN_DEFAULT.nama_sekolah} — Pantau Kehadiran, Nilai Akademik, dan Raport
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Siswa Aktif
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
