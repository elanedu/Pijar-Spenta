'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Halaman Login Utama
 * app/login/page.tsx
 * Menangani login untuk 3 peran: Admin, Guru, Siswa, dan melakukan redirect otomatis
 */

import React, { useState } from 'react';
import {
  School,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Shield,
  GraduationCap,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Toast } from '@/components/ui/Toast.tsx';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fungsi pengisian cepat kredensial akun uji coba
  const setQuickAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

      setToastMessage('Login berhasil! Mengalihkan ke panel...');
      const role = result.data.user.role;

      // Redirect otomatis sesuai peran pengguna
      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = '/admin';
        } else if (role === 'guru') {
          window.location.href = '/guru';
        } else if (role === 'siswa') {
          window.location.href = '/siswa';
        } else {
          window.location.href = '/';
        }
      }, 700);
    } catch (err: any) {
      setErrorMessage('Terjadi kendala koneksi ke server. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Toast Notifikasi */}
      <Toast
        isOpen={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="success"
        onClose={() => setToastMessage(null)}
      />

      <div className="w-full max-w-md space-y-6">
        {/* Logo & Judul Aplikasi */}
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

        {/* Card Formulir Login */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Masuk ke Akun Anda</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan username atau NIS dan kata sandi Anda.
            </p>
          </div>

          {/* Alert Error */}
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

          {/* Quick Demo Shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              Akun Uji Coba Cepat (Klik untuk Isi):
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

        {/* Footer info */}
        <p className="text-center text-xs text-blue-300/80">
          Platform Terpadu PIJAR SPENTA &copy; 2024 • Dilindungi Enkripsi Sesi JWT & Google Sheets
        </p>
      </div>
    </div>
  );
}
