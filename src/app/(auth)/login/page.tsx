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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError('Email atau kata sandi tidak cocok, atau akun belum diaktifkan.');
        return;
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
        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center">
          <div className="w-full max-w-md py-12 sm:py-8">
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
                  <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-800">
                    Email petugas
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
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
                Akun dibuat dan diaktifkan oleh administrator. Pendaftaran mandiri tidak tersedia.
              </p>
            </section>
          </div>
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