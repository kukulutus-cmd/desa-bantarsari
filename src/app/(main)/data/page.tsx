'use client';

import { useApp } from '@/lib/context';
import { Database, RefreshCw, ShieldAlert } from 'lucide-react';
import { PopulationImport } from '@/components/PopulationImport';

export default function DataPage() {
  const { currentProfile, stats, isLoading, isSupabaseConnected, isSyncingWithSupabase, lastSyncedAt, refreshFromSupabase } = useApp();

  if (currentProfile?.role !== 'admin') {
    return (
      <section className="m-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
        <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-amber-700" />
        <h1 className="font-bold text-slate-900">Khusus administrator desa</h1>
        <p className="mt-1 text-sm text-slate-600">Akun ini tidak memiliki akses ke ringkasan data.</p>
      </section>
    );
  }

  return (
    <main className="h-full overflow-y-auto p-4 sm:p-6">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Status data desa</h1>
            <p className="mt-1 text-sm text-slate-600">Ringkasan berasal dari database dan mengikuti hak akses akun.</p>
          </div>
          <Database className="h-6 w-6 text-sky-700" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[['Kartu keluarga', stats.totalKK], ['Penduduk', stats.totalJiwa], ['Rumah', stats.totalRumah]].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{isLoading ? '…' : value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
          <p><strong>Koneksi:</strong> {isSupabaseConnected ? 'Supabase dikonfigurasi' : 'Belum dikonfigurasi'}</p>
          <p className="mt-1"><strong>Pembaruan terakhir:</strong> {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('id-ID') : 'Belum ada'}</p>
        </div>
        <button type="button" onClick={() => void refreshFromSupabase()} disabled={!isSupabaseConnected || isSyncingWithSupabase}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${isSyncingWithSupabase ? 'animate-spin' : ''}`} />
          Muat ulang ringkasan
        </button>
        <p className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 text-xs leading-relaxed text-slate-700">
          Data uji fiktif tidak boleh dimasukkan ke basis data produksi. Impor akan memeriksa format dan duplikasi sebelum menyimpan.
        </p>
      </section>
      <PopulationImport />
    </main>
  );
}
