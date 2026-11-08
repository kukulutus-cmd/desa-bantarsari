'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Building2, Cloud, LogOut, MapPin, RefreshCw, WifiOff } from 'lucide-react';
import { useApp } from '@/lib/context';

export const Header: React.FC = () => {
  const router = useRouter();
  const {
    currentProfile, logout, villageConfig, visibleNotes, isOnline,
    isSupabaseConnected, isSyncingWithSupabase, lastSyncedAt, refreshFromSupabase,
  } = useApp();
  const pendingNotesCount = visibleNotes.filter((note) => note.status === 'pending').length;
  const roleLabel = currentProfile?.role === 'admin' ? 'Admin Desa'
    : currentProfile?.role === 'kadus' ? `Kepala ${currentProfile.assigned_dusun || 'Dusun'}`
    : currentProfile?.role === 'rw' ? `Ketua RW ${currentProfile.assigned_rw || ''}`
    : `Ketua RT ${currentProfile?.assigned_rt || ''}/RW ${currentProfile?.assigned_rw || ''}`;

  async function handleLogout() {
    await logout();
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="w-full bg-gradient-to-r from-blue-900 via-sky-800 to-cyan-800 text-white shadow-sm">
      <div className="px-3 py-2.5 sm:px-5 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/15">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{currentProfile?.full_name || villageConfig.nama_desa}</p>
              <p className="flex items-center gap-1 text-[11px] text-white/90">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{roleLabel}{currentProfile?.assigned_dusun ? ` • ${currentProfile.assigned_dusun}` : ''}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => void refreshFromSupabase()}
              disabled={!isSupabaseConnected || isSyncingWithSupabase}
              className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[10px] font-bold disabled:opacity-50"
              title="Muat ulang data yang boleh diakses akun ini">
              <Cloud className="h-3 w-3" />
              <RefreshCw className={`h-3 w-3 ${isSyncingWithSupabase ? 'animate-spin' : ''}`} />
            </button>
            <span title={isOnline ? 'Terhubung ke internet' : 'Tidak ada koneksi internet'}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
              {isOnline ? <span className="h-2 w-2 rounded-full bg-emerald-300" /> : <WifiOff className="h-3 w-3" />}
            </span>
            <Link href="/catatan" className="relative rounded-full border border-white/30 bg-white/10 p-1.5" title="Catatan wilayah">
              <Bell className="h-4 w-4" />
              {pendingNotesCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold">{pendingNotesCount}</span>}
            </Link>
            <button type="button" onClick={() => void handleLogout()} className="rounded-full border border-white/30 bg-white/10 p-1.5" title="Keluar">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/15 bg-blue-950/25 px-3 py-1 text-[10px] text-white/90 sm:px-5 md:px-8">
        <span>{villageConfig.nama_desa} • {isSupabaseConnected ? 'Database' : 'Belum dikonfigurasi'}</span>
        {lastSyncedAt && <span className="truncate">Terakhir dimuat {new Date(lastSyncedAt).toLocaleTimeString('id-ID')}</span>}
      </div>
    </header>
  );
};
