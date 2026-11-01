'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Layout Khusus Guru
 * app/guru/layout.tsx
 */

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar.tsx';
import { PENGATURAN_DEFAULT } from '@/lib/constants.ts';

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  const [guruUser, setGuruUser] = useState<any>({
    id: 'USR-GRU-001',
    nama: 'Budi Santoso, S.Pd.',
    username: 'guru_budi',
    role: 'guru',
    extraId: '198001012005011001',
    mapel: 'Bahasa Indonesia',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          if (json.data.role !== 'guru' && json.data.role !== 'admin') {
            window.location.href = '/login';
          } else {
            setGuruUser(json.data);
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
        user={guruUser}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/guru'}
        onNavigate={(path) => {
          window.location.href = path;
        }}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="no-print bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Portal Guru Pengajar • {guruUser.mapel || 'Guru Mata Pelajaran'}
            </h2>
            <p className="text-xs text-slate-500">
              {PENGATURAN_DEFAULT.nama_sekolah} • T.A. {PENGATURAN_DEFAULT.tahun_ajaran} ({PENGATURAN_DEFAULT.semester})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{guruUser.nama}</p>
              <p className="text-[11px] text-slate-500 font-mono">NIP: {guruUser.extraId || '-'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center border border-indigo-200 text-xs shadow-inner">
              G
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
