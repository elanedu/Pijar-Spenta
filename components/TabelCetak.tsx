/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Komponen Kop Surat & Header Cetak Resmi Sekolah
 * Didesain khusus untuk memenuhi standar cetak dokumen kedinasan/sekolah di Indonesia
 */

import React from 'react';
import { School } from 'lucide-react';
import { formatTanggal, getTanggalHariIni } from '@/lib/utils.ts';

export interface TabelCetakProps {
  judulDokumen: string;
  nomorSurat?: string;
  subJudul?: string;
  kelas?: string;
  mapel?: string;
  semester?: string;
  tahunAjaran?: string;
  namaGuru?: string;
  nipGuru?: string;
  namaWaliKelas?: string;
  nipWaliKelas?: string;
  tipeTandaTangan?: 'guru_dan_kepala' | 'kepala_saja' | 'tiga_pihak' | 'wali_kelas';
  pengaturan?: {
    nama_sekolah?: string;
    alamat_sekolah?: string;
    telepon_sekolah?: string;
    email_sekolah?: string;
    website_sekolah?: string;
    logo_url?: string;
    kepala_sekolah?: string;
    nip_kepala_sekolah?: string;
    kota_cetak?: string;
  };
  children?: React.ReactNode;
  showTandaTangan?: boolean;
}

export function TabelCetak({
  judulDokumen,
  nomorSurat,
  subJudul,
  kelas,
  mapel,
  semester = 'Ganjil',
  tahunAjaran = '2024/2025',
  namaGuru,
  nipGuru,
  namaWaliKelas,
  nipWaliKelas,
  tipeTandaTangan = 'guru_dan_kepala',
  pengaturan,
  children,
  showTandaTangan = true,
}: TabelCetakProps) {
  const sekolah = pengaturan?.nama_sekolah || 'SMP NEGERI 1 SPENTA';
  const alamat = pengaturan?.alamat_sekolah || 'Jl. Ki Hajar Dewantara No. 12, Jawa Barat';
  const telepon = pengaturan?.telepon_sekolah || '(021) 8765-4321';
  const email = pengaturan?.email_sekolah || 'info@smpn1spenta.sch.id';
  const kota = pengaturan?.kota_cetak || 'Kota Bandung';
  const kepala = pengaturan?.kepala_sekolah || 'Drs. H. Mulyono, M.Pd.';
  const nipKepala = pengaturan?.nip_kepala_sekolah || '197005121996031002';

  const tanggalCetak = formatTanggal(getTanggalHariIni(), 'lengkap');

  return (
    <div className="w-full bg-white text-black p-4 sm:p-6 print:p-0">
      {/* 1. KOP SURAT RESMI SEKOLAH */}
      <div className="border-b-2 border-black pb-3 mb-1">
        <div className="flex items-center gap-4 text-center sm:text-left">
          {/* Logo Sekolah */}
          <div className="w-20 h-20 shrink-0 flex items-center justify-center border-2 border-black/20 rounded-lg p-1 bg-white">
            {pengaturan?.logo_url ? (
              <img
                src={pengaturan.logo_url}
                alt="Logo Sekolah"
                className="w-full h-full object-contain"
              />
            ) : (
              <School className="w-12 h-12 text-slate-800" />
            )}
          </div>

          {/* Teks Identitas Sekolah */}
          <div className="flex-1 text-center">
            <h3 className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-800">
              PEMERINTAH DAERAH PROVINSI JAWA BARAT
            </h3>
            <h4 className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-800">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </h4>
            <h1 className="text-lg sm:text-2xl font-black tracking-wide text-black uppercase mt-0.5">
              {sekolah}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-700 leading-tight mt-0.5">
              {alamat} • Telp: {telepon}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-600">
              Laman: {pengaturan?.website_sekolah || 'https://smpn1spenta.sch.id'} • Pos-el: {email}
            </p>
          </div>
        </div>
      </div>
      {/* Garis Ganda Pembatas Kop Surat */}
      <div className="border-b border-black mb-6"></div>

      {/* 2. JUDUL DOKUMEN LAPORAN */}
      <div className="text-center mb-6">
        <h2 className="text-base sm:text-lg font-extrabold uppercase underline underline-offset-4 tracking-wide text-black">
          {judulDokumen}
        </h2>
        {nomorSurat && (
          <p className="text-xs text-slate-700 font-mono mt-1">Nomor: {nomorSurat}</p>
        )}
        {subJudul && <p className="text-xs text-slate-600 mt-1 italic">{subJudul}</p>}
      </div>

      {/* 3. METADATA INFORMASI KELAS & MAPEL */}
      {(kelas || mapel || semester || tahunAjaran) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-900 mb-5 p-3 bg-slate-50 border border-slate-300 rounded-md print:bg-transparent print:border-none print:p-0">
          {mapel && (
            <div>
              <span className="font-semibold text-slate-600">Mata Pelajaran:</span>{' '}
              <span className="font-bold">{mapel}</span>
            </div>
          )}
          {kelas && (
            <div>
              <span className="font-semibold text-slate-600">Kelas / Rombel:</span>{' '}
              <span className="font-bold">{kelas}</span>
            </div>
          )}
          <div>
            <span className="font-semibold text-slate-600">Tahun Ajaran:</span>{' '}
            <span className="font-bold">{tahunAjaran}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Semester:</span>{' '}
            <span className="font-bold">{semester}</span>
          </div>
        </div>
      )}

      {/* 4. KONTEN TABEL DATA */}
      <div className="mb-8">{children}</div>

      {/* 5. TITIMANGSA & LEMBAR TANDA TANGAN RESMI */}
      {showTandaTangan && (
        <div className="print-avoid-break mt-10 pt-4 text-xs text-black">
          {tipeTandaTangan === 'tiga_pihak' ? (
            <div>
              <div className="text-right text-slate-600 mb-4 font-medium">
                {kota}, {tanggalCetak}
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-slate-600">Mengetahui,</p>
                  <p className="font-bold text-slate-800">Orang Tua / Wali Siswa</p>
                  <div className="h-20"></div>
                  <p className="font-bold text-slate-900 border-b border-slate-700 inline-block px-4">
                    ...........................................
                  </p>
                </div>

                <div>
                  <p className="text-slate-600">Wali Kelas {kelas || ''}</p>
                  <div className="h-20"></div>
                  <p className="font-bold text-slate-900 border-b border-slate-700 inline-block px-4">
                    {namaWaliKelas || '...........................................'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    NIP. {nipWaliKelas || '.......................................'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600">Kepala Sekolah</p>
                  <p className="font-bold text-slate-800">{sekolah}</p>
                  <div className="h-20"></div>
                  <p className="font-bold text-slate-900 border-b border-slate-700 inline-block px-4">
                    {kepala}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">NIP. {nipKepala}</p>
                </div>
              </div>
            </div>
          ) : tipeTandaTangan === 'kepala_saja' ? (
            <div className="flex justify-end">
              <div className="text-center w-64">
                <p className="font-medium">
                  {kota}, {tanggalCetak}
                </p>
                <p className="font-medium text-slate-700">Mengetahui,</p>
                <p className="font-semibold text-slate-900">Kepala Sekolah {sekolah}</p>
                <div className="h-20"></div>
                <p className="font-bold underline text-black uppercase">{kepala}</p>
                <p className="text-slate-700">NIP. {nipKepala}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start gap-8">
              {/* Tanda Tangan Guru / Wali Kelas */}
              <div className="text-center w-60">
                <p className="invisible">Kota Bandung, Tanggal</p>
                <p className="font-medium text-slate-700">
                  {namaGuru ? 'Guru Mata Pelajaran,' : 'Wali Kelas,'}
                </p>
                <div className="h-20"></div>
                <p className="font-bold underline text-black uppercase">
                  {namaGuru || namaWaliKelas || '.............................................'}
                </p>
                <p className="text-slate-700">
                  NIP. {nipGuru || nipWaliKelas || '.......................................'}
                </p>
              </div>

              {/* Tanda Tangan Kepala Sekolah */}
              <div className="text-center w-64">
                <p className="font-medium">
                  {kota}, {tanggalCetak}
                </p>
                <p className="font-medium text-slate-700">Mengetahui,</p>
                <p className="font-semibold text-slate-900">Kepala Sekolah {sekolah}</p>
                <div className="h-16"></div>
                <p className="font-bold underline text-black uppercase">{kepala}</p>
                <p className="text-slate-700">NIP. {nipKepala}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
