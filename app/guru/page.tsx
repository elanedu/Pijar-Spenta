'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Dashboard Guru & Daftar Card Kelas
 * app/guru/page.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  School,
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  ChevronRight,
  ClipboardList,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';

export interface GuruClassCard {
  id: string;
  mapelId: string;
  kodeMapel: string;
  namaMapel: string;
  kelas: string;
  jumlahSiswa: number;
  guruNama: string;
}

export default function GuruDashboardPage({
  onSelectClass,
}: {
  onSelectClass?: (mapel: string, kelas: string) => void;
}) {
  const [cards, setCards] = useState<GuruClassCard[]>([]);
  const [guruInfo, setGuruInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guru/kartu');
      const json = await res.json();
      if (json.success && json.data) {
        setCards(json.data.cards || []);
        setGuruInfo(json.data.guru || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleOpenClass = (mapel: string, kelas: string) => {
    if (onSelectClass) {
      onSelectClass(mapel, kelas);
    } else {
      window.location.href = `/guru/kelas/${encodeURIComponent(mapel)}/${encodeURIComponent(kelas)}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Guru */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-blue-600/40 text-blue-200 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Tahun Ajaran 2024/2025 • Semester Ganjil
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Selamat Mengajar, {guruInfo?.nama || 'Bapak/Ibu Guru'}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
              Silakan pilih rombongan belajar di bawah ini untuk mencatat presensi pertemuan, penilaian formatif/sumatif, jurnal karakter, dan tugas belajar.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-white border-white/20 hover:bg-white/10 self-start sm:self-auto"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchCards}
          >
            Segarkan Kelas
          </Button>
        </div>
      </div>

      {/* Grid Card Kelas yang Diampu */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Daftar Kelas & Mata Pelajaran yang Diampu ({cards.length})
          </h2>
          <span className="text-xs text-slate-500">Klik kartu untuk membuka 4 tab pengelolaan</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-white rounded-xl border border-slate-200 p-5 animate-pulse"></div>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500">
            Belum ada rombel kelas yang ditugaskan ke akun guru ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((c) => (
              <div
                key={c.id}
                onClick={() => handleOpenClass(c.namaMapel, c.kelas)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex flex-col justify-between overflow-hidden"
              >
                {/* Header Card */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                      {c.kodeMapel}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      <School className="w-3.5 h-3.5 text-blue-600" />
                      Kelas {c.kelas}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-700 transition mt-2">
                    {c.namaMapel}
                  </h3>
                  <p className="text-xs text-slate-500">SMP NEGERI 1 SPENTA</p>
                </div>

                {/* Body Card */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400">Total Siswa</p>
                        <p className="font-bold text-slate-800">{c.jumlahSiswa} Siswa</p>
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400">KBM</p>
                        <p className="font-bold text-slate-800">Semester 1</p>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Masuk Kelas */}
                  <div className="flex items-center justify-between text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition-transform">
                    <span>Buka 4 Tab Pengelolaan Kelas</span>
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
