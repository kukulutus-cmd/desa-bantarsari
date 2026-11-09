'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MessageSquareWarning } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { appName, villageName } from '@/lib/branding';

const complaintMessage = encodeURIComponent(
  `Halo K2C Komputindo, saya ingin menyampaikan pengaduan terkait aplikasi ${appName} ${villageName}.`
);

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const identifier = username.trim();
      if (identifier.includes('@')) {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: identifier, password });
        if (signInError) {
          setError('Username atau kata sandi tidak cocok, atau akun belum diaktifkan.');
          return;
        }
      } else {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: identifier, password }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(result.error || 'Username atau kata sandi tidak cocok, atau akun belum diaktifkan.');
          return;
        }
      }
      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('Koneksi belum siap. Hubungi administrator untuk konfigurasi aplikasi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-y-auto bg-slate-950 text-slate-900">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/kantor-desa-login.png')" }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-slate-950/10"
      />

      <div className="relative z-10 flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          <div className="order-2 w-full max-w-md py-4 sm:py-8 lg:order-1">
            <div className="mb-5 text-white">
              <Image
                src="/logo-kabupaten-bekasi.png"
                alt="Lambang Kabupaten Bekasi"
                width={82}
                height={96}
                priority
                className="mb-3 h-auto w-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:w-14"
              />
              <h1 className="text-4xl font-black leading-none tracking-tight drop-shadow sm:text-5xl lg:text-6xl">
                {villageName}
              </h1>
              <p className="mt-3 text-lg font-semibold leading-snug text-white/95 drop-shadow sm:text-xl">
                {appName}
              </p>
              <p className="mt-2 text-sm text-white/85">
                Layanan administrasi kependudukan desa
              </p>
            </div>

            <section className="w-full border border-white/80 bg-white p-5 shadow-2xl sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="mb-1.5 block text-sm font-bold text-slate-800">
                    Username petugas
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Masukkan username"
                    className="w-full border border-slate-400 bg-slate-50 px-3.5 py-2.5 outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-800">
                    Kata sandi
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full border border-slate-400 bg-slate-50 px-3.5 py-2.5 outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                {error && (
                  <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full border border-sky-800 bg-sky-800 px-4 py-3 font-bold text-white transition-colors hover:bg-sky-900 disabled:opacity-60"
                >
                  {busy ? 'Memeriksa akun…' : 'Masuk'}
                </button>
              </form>

              <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-600">
                Masuk menggunakan username dan kata sandi yang diberikan administrator desa.
              </p>
            </section>
          </div>
          <figure className="order-1 flex w-full items-center gap-4 border border-white/60 bg-slate-950/40 p-3 text-white shadow-xl backdrop-blur-sm lg:order-2 lg:block lg:max-w-[320px] lg:bg-white/95 lg:p-4 lg:text-slate-900">
            <Image
              src="/foto-kepala-desa.png"
              alt="Foto Kepala Desa Bantarsari"
              width={720}
              height={765}
              priority
              className="h-24 w-24 shrink-0 border border-white/60 object-cover object-top lg:h-[360px] lg:w-full lg:border-slate-200"
            />
            <figcaption className="min-w-0 text-left lg:pt-3 lg:text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-white/75 lg:text-sky-800">Kepala Desa</p>
              <p className="mt-1 text-sm font-extrabold leading-snug text-white lg:text-slate-900">{villageName}</p>
            </figcaption>
          </figure>
        </div>

        <footer className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 border-t border-white/40 pt-3 text-white sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold">K2C Komputindo</p>
            <p className="text-xs text-white/80">Pengembang aplikasi {appName}</p>
          </div>
          <a
            href={`https://wa.me/?text=${complaintMessage}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-white/80 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-slate-900"
          >
            <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
            Tombol Pengaduan
          </a>
        </footer>
      </div>
    </main>
  );
}
