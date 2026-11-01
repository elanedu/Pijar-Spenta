'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Pengaturan Aplikasi Sekolah (Sheet: PENGATURAN)
 * app/admin/pengaturan/page.tsx
 * Nilai disimpan di sheet PENGATURAN dan langsung memengaruhi tampilan semua panel
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  School,
  Printer,
  Palette,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Toast } from '@/components/ui/Toast.tsx';

export default function AdminPengaturanPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    nama_sekolah: 'SMP NEGERI 1 SPENTA',
    alamat_sekolah: 'Jl. Ki Hajar Dewantara No. 12, Jawa Barat',
    telepon_sekolah: '(021) 8765-4321',
    email_sekolah: 'info@smpn1spenta.sch.id',
    website_sekolah: 'https://smpn1spenta.sch.id',
    kepala_sekolah: 'Drs. H. Mulyono, M.Pd.',
    nip_kepala_sekolah: '197005121996031002',
    logo_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&auto=format&fit=crop&q=80',
    warna_primary: '#1d4ed8',
    tahun_ajaran: '2024/2025',
    semester: 'Ganjil',
    kkm_default: '75',
    kota_cetak: 'Kota Bandung',
    footer_cetak: 'Dokumen resmi PIJAR SPENTA - Dicetak secara elektronik dan sah tanpa cap basah tambahan.',
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pengaturan');
      const json = await res.json();
      if (json.success && json.data) {
        setSettings((prev) => ({ ...prev, ...json.data }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setToastMessage('Pengaturan sekolah berhasil disimpan ke Google Sheets.');
      } else {
        alert(json.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Toast
        isOpen={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="success"
        onClose={() => setToastMessage(null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pengaturan Aplikasi & Identitas Sekolah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Konfigurasi tersimpan di sheet <strong>PENGATURAN</strong> dan langsung memperbarui kop cetak, tahun ajaran, dan tema semua panel
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchSettings}
        >
          Muat Ulang
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Identitas Sekolah */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <School className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Identitas Satuan Pendidikan
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Resmi Sekolah"
              value={settings.nama_sekolah}
              onChange={(e) => handleChange('nama_sekolah', e.target.value)}
              required
            />

            <Input
              label="Alamat Sekolah Lengkap"
              value={settings.alamat_sekolah}
              onChange={(e) => handleChange('alamat_sekolah', e.target.value)}
              required
            />

            <Input
              label="Nomor Telepon Kantor"
              value={settings.telepon_sekolah}
              onChange={(e) => handleChange('telepon_sekolah', e.target.value)}
            />

            <Input
              label="Email Resmi Sekolah"
              type="email"
              value={settings.email_sekolah}
              onChange={(e) => handleChange('email_sekolah', e.target.value)}
            />

            <Input
              label="Website Resmi Sekolah"
              value={settings.website_sekolah}
              onChange={(e) => handleChange('website_sekolah', e.target.value)}
            />

            <div className="space-y-1">
              <Input
                label="URL Logo Sekolah (PNG / SVG)"
                value={settings.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
              />
              {settings.logo_url && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500">Pratinjau Logo:</span>
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="w-7 h-7 object-contain rounded border border-slate-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Tahun Ajaran, Semester & KKM */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Tahun Ajaran, Semester & Standar KKM
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Tahun Ajaran Aktif"
              placeholder="2024/2025"
              value={settings.tahun_ajaran}
              onChange={(e) => handleChange('tahun_ajaran', e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
              <select
                value={settings.semester}
                onChange={(e) => handleChange('semester', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            <Input
              label="Standar KKM Default (0 - 100)"
              type="number"
              min="0"
              max="100"
              value={settings.kkm_default}
              onChange={(e) => handleChange('kkm_default', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Card 3: Pejabat Penandatangan & Format Cetak */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Printer className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Pengesahan & Footer Dokumen Cetak
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Nama Kepala Sekolah"
              value={settings.kepala_sekolah}
              onChange={(e) => handleChange('kepala_sekolah', e.target.value)}
              required
            />

            <Input
              label="NIP Kepala Sekolah"
              value={settings.nip_kepala_sekolah}
              onChange={(e) => handleChange('nip_kepala_sekolah', e.target.value)}
              required
            />

            <Input
              label="Kota Penerbitan Cetak"
              placeholder="Contoh: Kota Bandung"
              value={settings.kota_cetak}
              onChange={(e) => handleChange('kota_cetak', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Footer Resmi Lembar Cetak</label>
            <textarea
              rows={2}
              value={settings.footer_cetak}
              onChange={(e) => handleChange('footer_cetak', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={submitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Simpan Semua Pengaturan
          </Button>
        </div>
      </form>
    </div>
  );
}
