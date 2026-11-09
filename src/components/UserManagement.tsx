'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Pencil, Plus, RefreshCw, UserCog, UserRoundCheck, UserRoundX } from 'lucide-react';
import type { UserRole } from '@/lib/types';

type Account = {
  id: string;
  username: string | null;
  full_name: string;
  role: UserRole;
  assigned_dusun: string | null;
  assigned_rw: string | null;
  assigned_rt: string | null;
  active: boolean;
  created_at: string;
};

type AccountForm = {
  username: string;
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  assigned_dusun: string;
  assigned_rw: string;
  assigned_rt: string;
};

const emptyForm: AccountForm = {
  username: '', full_name: '', email: '', password: '', role: 'rt',
  assigned_dusun: '', assigned_rw: '', assigned_rt: '',
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator desa', kadus: 'Kepala dusun', rw: 'Ketua RW', rt: 'Ketua RT',
};

const fieldClass = 'w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100';

async function requestAccounts(method: string, body?: Record<string, unknown>) {
  const response = await fetch('/api/admin/users', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Permintaan gagal diproses.');
  return result;
}

export function UserManagement() {
  const [users, setUsers] = useState<Account[]>([]);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await requestAccounts('GET');
      setUsers(result.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Daftar akun gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  function startEdit(user: Account) {
    setEditingId(user.id);
    setForm({
      username: user.username || '', full_name: user.full_name, email: '', password: '', role: user.role,
      assigned_dusun: user.assigned_dusun || '', assigned_rw: user.assigned_rw || '', assigned_rt: user.assigned_rt || '',
    });
    setNotice('');
    setError('');
    document.getElementById('form-akun-petugas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setNotice('');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const body: Record<string, unknown> = { ...form };
      if (editingId) {
        delete body.email;
        body.id = editingId;
        body.active = users.find((user) => user.id === editingId)?.active ?? true;
        await requestAccounts('PATCH', body);
        setNotice('Akun berhasil diperbarui.');
      } else {
        await requestAccounts('POST', body);
        setNotice('Akun petugas berhasil dibuat. Username dan kata sandi sudah siap digunakan.');
      }
      setEditingId(null);
      setForm(emptyForm);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Akun gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: Account) {
    setError('');
    setNotice('');
    try {
      await requestAccounts('PATCH', {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        assigned_dusun: user.assigned_dusun || '',
        assigned_rw: user.assigned_rw || '',
        assigned_rt: user.assigned_rt || '',
        active: !user.active,
      });
      setNotice(user.active ? 'Akun dinonaktifkan.' : 'Akun diaktifkan kembali.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status akun gagal diubah.');
    }
  }

  const role = form.role;

  return (
    <section className="space-y-5 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-sky-700" />
            <h2 className="text-xl font-extrabold text-slate-900">Akun petugas</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">Buat username login, atur peran dan wilayah, atau nonaktifkan akses.</p>
        </div>
        <button type="button" onClick={() => void loadUsers()} disabled={loading} className="inline-flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      <form id="form-akun-petugas" onSubmit={save} className="border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <h3 className="font-bold text-slate-900">{editingId ? 'Ubah akun petugas' : 'Tambah akun petugas'}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-700">Username
            <input required minLength={3} maxLength={32} pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}" autoComplete="off" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase() })} placeholder="contoh: ketua.rt01" className={`${fieldClass} mt-1`} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Nama petugas
            <input required maxLength={120} value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className={`${fieldClass} mt-1`} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Peran
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className={`${fieldClass} mt-1`}>
              {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {!editingId && <label className="block text-sm font-semibold text-slate-700">Email pemulihan (opsional)
            <input type="email" autoComplete="off" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Tidak digunakan untuk login" className={`${fieldClass} mt-1`} />
          </label>}
          <label className="block text-sm font-semibold text-slate-700">{editingId ? 'Kata sandi baru (opsional)' : 'Kata sandi awal'}
            <input type="password" minLength={12} required={!editingId} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Minimal 12 karakter" className={`${fieldClass} mt-1`} />
          </label>
          {role !== 'admin' && <label className="block text-sm font-semibold text-slate-700">Dusun
            <input required value={form.assigned_dusun} onChange={(event) => setForm({ ...form, assigned_dusun: event.target.value })} placeholder="Misalnya Dusun I" className={`${fieldClass} mt-1`} />
          </label>}
          {(role === 'rw' || role === 'rt') && <label className="block text-sm font-semibold text-slate-700">RW
            <input required maxLength={8} value={form.assigned_rw} onChange={(event) => setForm({ ...form, assigned_rw: event.target.value })} placeholder="001" className={`${fieldClass} mt-1`} />
          </label>}
          {role === 'rt' && <label className="block text-sm font-semibold text-slate-700">RT
            <input required maxLength={8} value={form.assigned_rt} onChange={(event) => setForm({ ...form, assigned_rt: event.target.value })} placeholder="001" className={`${fieldClass} mt-1`} />
          </label>}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600">Akun tanpa email pemulihan tetap bisa masuk dengan username. Jika lupa kata sandi, administrator perlu menetapkan kata sandi baru.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={saving} className="inline-flex items-center gap-2 border border-sky-800 bg-sky-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-900 disabled:opacity-60">
            {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Menyimpan…' : editingId ? 'Simpan perubahan' : 'Buat akun'}
          </button>
          {editingId && <button type="button" onClick={cancelEdit} className="border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white">Batal</button>}
        </div>
      </form>

      <div className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 font-bold text-slate-900">Daftar akun</div>
        {loading ? <p className="p-4 text-sm text-slate-500">Memuat akun…</p> : users.length === 0 ? <p className="p-4 text-sm text-slate-500">Belum ada profil petugas.</p> : (
          <ul className="divide-y divide-slate-200">
            {users.map((user) => (
              <li key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{user.full_name}</p>
                  <p className="text-sm text-slate-700">@{user.username || 'username belum diatur'} · {roleLabels[user.role]}</p>
                  <p className="text-xs text-slate-500">{[user.assigned_dusun, user.assigned_rw && `RW ${user.assigned_rw}`, user.assigned_rt && `RT ${user.assigned_rt}`].filter(Boolean).join(' · ') || 'Seluruh wilayah'}</p>
                  <span className={`mt-1 inline-block border px-2 py-0.5 text-xs font-bold ${user.active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-slate-100 text-slate-600'}`}>{user.active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => startEdit(user)} className="inline-flex items-center gap-1.5 border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Pencil className="h-4 w-4" /> Ubah</button>
                  <button type="button" onClick={() => void toggleActive(user)} className={`inline-flex items-center gap-1.5 border px-3 py-2 text-sm font-semibold ${user.active ? 'border-rose-200 text-rose-700 hover:bg-rose-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
                    {user.active ? <UserRoundX className="h-4 w-4" /> : <UserRoundCheck className="h-4 w-4" />}
                    {user.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="flex items-start gap-2 border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"><KeyRound className="mt-0.5 h-4 w-4 shrink-0" />Kunci admin Supabase hanya digunakan di server. Jangan bagikan kata sandi petugas atau kunci proyek di chat.</p>
    </section>
  );
}
