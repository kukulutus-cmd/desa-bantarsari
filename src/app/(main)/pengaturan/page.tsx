'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ShieldAlert, Save } from 'lucide-react';
import { useApp } from '@/lib/context';
import type { VillageConfig } from '@/lib/types';
import { UserManagement } from '@/components/UserManagement';

const fields: Array<{ key: keyof VillageConfig; label: string; required?: boolean }> = [
  { key: 'nama_desa', label: 'Nama resmi desa', required: true },
  { key: 'kepala_desa', label: 'Nama kepala desa' },
  { key: 'alamat_desa', label: 'Alamat kantor desa' },
  { key: 'kecamatan', label: 'Kecamatan' },
  { key: 'kabupaten', label: 'Kabupaten' },
  { key: 'provinsi', label: 'Provinsi' },
  { key: 'kode_pos', label: 'Kode pos' },
  { key: 'telepon_desa', label: 'Telepon kantor' },
  { key: 'email_desa', label: 'Email kantor' },
];

export default function PengaturanPage() {
  const { currentProfile, villageConfig, updateVillageConfig } = useApp();
  const [form, setForm] = useState<VillageConfig>(villageConfig);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => setForm(villageConfig), [villageConfig]);

  if (currentProfile?.role !== 'admin') {
    return (
      <section className="m-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
        <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-amber-700" />
        <h1 className="font-bold text-slate-900">Khusus administrator desa</h1>
        <p className="mt-1 text-sm text-slate-600">Akun ini tidak memiliki akses pengaturan desa.</p>
      </section>
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    const result = await updateVillageConfig(form);
    setNotice(result.success ? 'Identitas desa berhasil disimpan.' : result.error || 'Gagal menyimpan perubahan.');
    setBusy(false);
  }

  return (
    <main className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
      <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h1 className="text-xl font-extrabold text-slate-900">Identitas desa</h1>
        <p className="mt-1 text-sm text-slate-600">Perubahan disimpan ke database desa.</p>
        <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map(({ key, label, required }) => (
            <label key={key} className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
              <input
                required={required}
                value={form[key] || ''}
                onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </label>
          ))}
          {notice && <p role="status" className="sm:col-span-2 text-sm text-slate-700">{notice}</p>}
          <div className="sm:col-span-2">
            <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 font-bold text-white disabled:opacity-60">
              <Save className="h-4 w-4" />
              {busy ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </section>
      <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <UserManagement />
      </section>
      </div>
    </main>
  );
}
