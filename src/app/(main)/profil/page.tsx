'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, MapPin, Settings, Database, LogOut, UserRound } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function ProfilPage() {
  const router = useRouter();
  const { currentProfile, villageConfig, stats, logout, isSupabaseConnected, lastSyncedAt } = useApp();

  async function handleLogout() {
    await logout();
    router.replace('/login');
    router.refresh();
  }

  const role = currentProfile?.role === 'admin' ? 'Administrator desa'
    : currentProfile?.role === 'kadus' ? 'Kepala dusun'
    : currentProfile?.role === 'rw' ? 'Ketua RW' : 'Ketua RT';

  return (
    <main className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-2xl bg-gradient-to-r from-sky-700 to-cyan-700 p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20"><UserRound className="h-6 w-6" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-white/80">{role}</p>
              <h1 className="break-words text-lg font-extrabold">{currentProfile?.full_name}</h1>
              <p className="mt-0.5 text-sm text-white/90">
                {[currentProfile?.assigned_dusun, currentProfile?.assigned_rw && `RW ${currentProfile.assigned_rw}`, currentProfile?.assigned_rt && `RT ${currentProfile.assigned_rt}`].filter(Boolean).join(' • ') || 'Seluruh wilayah'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="h-5 w-5 text-sky-700" />
            <h2 className="font-extrabold text-slate-900">Identitas desa</h2>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ['Nama desa', villageConfig.nama_desa],
              ['Kepala desa', villageConfig.kepala_desa],
              ['Kecamatan', villageConfig.kecamatan],
              ['Kabupaten', villageConfig.kabupaten],
              ['Provinsi', villageConfig.provinsi],
              ['Alamat kantor', villageConfig.alamat_desa],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
                <dd className="mt-1 break-words font-semibold text-slate-900">{value || 'Belum diatur'}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Koneksi</dt>
              <dd className="mt-1 flex items-center gap-1 font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-sky-700" />
                {isSupabaseConnected ? 'Database dikonfigurasi' : 'Belum dikonfigurasi'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Terakhir dimuat</dt>
              <dd className="mt-1 font-semibold text-slate-900">{lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('id-ID') : 'Belum ada'}</dd>
            </div>
          </dl>
        </section>

        <section className="grid grid-cols-3 gap-3">
          {[['KK', stats.totalKK], ['Warga', stats.totalJiwa], ['Rumah', stats.totalRumah]].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{value}</p>
            </div>
          ))}
        </section>

        {currentProfile?.role === 'admin' && (
          <section className="grid gap-3 sm:grid-cols-2">
            <Link href="/pengaturan" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 font-bold text-slate-800 hover:border-sky-500">
              <Settings className="h-5 w-5 text-sky-700" /> Ubah identitas desa
            </Link>
            <Link href="/data" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 font-bold text-slate-800 hover:border-sky-500">
              <Database className="h-5 w-5 text-sky-700" /> Status data
            </Link>
          </section>
        )}

        <button type="button" onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 font-bold text-rose-700 hover:bg-rose-50">
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </div>
    </main>
  );
}
