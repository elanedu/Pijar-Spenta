/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PIJAR SPENTA - Komponen UI Toast Notifikasi
 */

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info';
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  type = 'info',
  message,
  isOpen,
  onClose,
  duration = 3500,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const styles = {
    success: 'bg-emerald-900/90 text-white border-emerald-500/50',
    error: 'bg-rose-900/90 text-white border-rose-500/50',
    info: 'bg-slate-900/90 text-white border-blue-500/50',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md max-w-md',
          styles[type]
        )}
      >
        {icons[type]}
        <p className="text-xs sm:text-sm font-medium pr-2">{message}</p>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
