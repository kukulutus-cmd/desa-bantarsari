import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/lib/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;
const VALID_ROLES: UserRole[] = ['admin', 'kadus', 'rw', 'rt'];

type UserInput = {
  id?: unknown;
  username?: unknown;
  full_name?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
  assigned_dusun?: unknown;
  assigned_rw?: unknown;
  assigned_rt?: unknown;
  active?: unknown;
};

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return request.method === 'GET' || request.method === 'HEAD';
  return new URL(origin).host === request.headers.get('host');
}

function text(value: unknown, max = 120) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function profileFields(body: UserInput) {
  const username = text(body.username, 32).toLowerCase();
  const full_name = text(body.full_name, 120);
  const role = body.role as UserRole;
  const assigned_dusun = text(body.assigned_dusun, 80) || null;
  const assigned_rw = text(body.assigned_rw, 8) || null;
  const assigned_rt = text(body.assigned_rt, 8) || null;

  if (!USERNAME_RE.test(username)) throw new Error('Username 3–32 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung.');
  if (!full_name) throw new Error('Nama petugas wajib diisi.');
  if (!VALID_ROLES.includes(role)) throw new Error('Peran akun tidak valid.');
  if (role !== 'admin' && !assigned_dusun) throw new Error('Dusun wajib diisi untuk peran ini.');
  if ((role === 'rw' || role === 'rt') && !assigned_rw) throw new Error('RW wajib diisi untuk peran ini.');
  if (role === 'rt' && !assigned_rt) throw new Error('RT wajib diisi untuk peran ini.');

  return {
    username,
    full_name,
    role,
    assigned_dusun: role === 'admin' ? null : assigned_dusun,
    assigned_rw: role === 'rw' || role === 'rt' ? assigned_rw : null,
    assigned_rt: role === 'rt' ? assigned_rt : null,
  };
}

async function getAuthorizedAdmin(request: NextRequest) {
  if (!sameOrigin(request)) return { ok: false as const, error: 'Permintaan tidak valid.', status: 403 as const };
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { ok: false as const, error: 'Sesi login berakhir. Masuk kembali.', status: 401 as const };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false as const, error: 'Pengelolaan akun belum dikonfigurasi di server.', status: 503 as const };
  }
  const { data: profile } = await admin.from('profiles').select('id, role, active').eq('id', user.id).maybeSingle();
  if (!profile?.active || profile.role !== 'admin') return { ok: false as const, error: 'Akses administrator diperlukan.', status: 403 as const };
  return { ok: true as const, admin, userId: user.id };
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: NextRequest) {
  const auth = await getAuthorizedAdmin(request);
  if (!auth.ok) return fail(auth.error, auth.status);

  const { data, error } = await auth.admin
    .from('profiles')
    .select('id, username, full_name, role, assigned_dusun, assigned_rw, assigned_rt, phone, active, created_at')
    .order('full_name');
  if (error) return fail('Daftar akun gagal dimuat.', 500);
  return NextResponse.json({ users: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthorizedAdmin(request);
  if (!auth.ok) return fail(auth.error, auth.status);

  let body: UserInput;
  try { body = await request.json(); } catch { return fail('Data akun tidak valid.'); }

  let fields: ReturnType<typeof profileFields>;
  try { fields = profileFields(body); } catch (error) { return fail(error instanceof Error ? error.message : 'Data akun tidak valid.'); }
  const password = typeof body.password === 'string' ? body.password : '';
  const recoveryEmail = text(body.email, 254).toLowerCase();
  if (password.length < 12 || password.length > 128) return fail('Kata sandi awal harus terdiri dari minimal 12 karakter.');
  if (recoveryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) return fail('Email pemulihan tidak valid.');

  const email = recoveryEmail || `${fields.username}@login.bantarsari.invalid`;
  const { data: created, error: createError } = await auth.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fields.full_name },
  });
  if (createError || !created.user) return fail(createError?.message.includes('already been registered') ? 'Username atau email sudah dipakai.' : 'Akun login gagal dibuat.', 400);

  const { error: profileError } = await auth.admin.from('profiles').insert({
    id: created.user.id,
    ...fields,
    active: true,
  });
  if (profileError) {
    await auth.admin.auth.admin.deleteUser(created.user.id);
    return fail(profileError.code === '23505' ? 'Username sudah dipakai.' : 'Profil petugas gagal dibuat; akun login dibatalkan.', 400);
  }

  return NextResponse.json({ success: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthorizedAdmin(request);
  if (!auth.ok) return fail(auth.error, auth.status);

  let body: UserInput;
  try { body = await request.json(); } catch { return fail('Data akun tidak valid.'); }
  const id = text(body.id, 64);
  if (!id) return fail('Akun tidak ditemukan.');
  let fields: ReturnType<typeof profileFields>;
  try { fields = profileFields(body); } catch (error) { return fail(error instanceof Error ? error.message : 'Data akun tidak valid.'); }
  if (typeof body.active !== 'boolean') return fail('Status akun tidak valid.');
  const password = typeof body.password === 'string' ? body.password : '';
  if (password && (password.length < 12 || password.length > 128)) return fail('Kata sandi baru harus terdiri dari minimal 12 karakter.');

  const { data: target } = await auth.admin.from('profiles').select('id, role, active').eq('id', id).maybeSingle();
  if (!target) return fail('Akun tidak ditemukan.', 404);
  if (id === auth.userId && (!body.active || fields.role !== 'admin')) {
    return fail('Akun administrator yang sedang digunakan tidak dapat dinonaktifkan atau diturunkan perannya.');
  }
  if (target.active && target.role === 'admin' && (!body.active || fields.role !== 'admin')) {
    const { count } = await auth.admin.from('profiles').select('id', { count: 'exact', head: true }).eq('active', true).eq('role', 'admin');
    if ((count || 0) <= 1) return fail('Desa harus memiliki minimal satu administrator aktif.');
  }

  const { error: updateError } = await auth.admin.from('profiles').update({ ...fields, active: body.active }).eq('id', id);
  if (updateError) return fail(updateError.code === '23505' ? 'Username sudah dipakai.' : 'Perubahan akun gagal disimpan.', 400);

  if (password) {
    const { error } = await auth.admin.auth.admin.updateUserById(id, { password });
    if (error) return fail('Profil tersimpan, tetapi kata sandi gagal diubah.', 400);
  }

  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}
