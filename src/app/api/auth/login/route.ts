import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return request.method === 'GET' || request.method === 'HEAD';
  return new URL(origin).host === request.headers.get('host');
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 403 });

  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password || username.length > 254 || password.length > 256) {
    return NextResponse.json({ error: 'Username atau kata sandi tidak cocok.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('id, active')
      .eq('username', username)
      .maybeSingle();

    if (!profile?.active) {
      return NextResponse.json({ error: 'Username atau kata sandi tidak cocok.' }, { status: 401 });
    }

    const { data: authUser, error: lookupError } = await admin.auth.admin.getUserById(profile.id);
    if (lookupError || !authUser.user?.email) {
      return NextResponse.json({ error: 'Username atau kata sandi tidak cocok.' }, { status: 401 });
    }

    const sessionClient = await createClient();
    const { error } = await sessionClient.auth.signInWithPassword({ email: authUser.user.email, password });
    if (error) {
      return NextResponse.json({ error: 'Username atau kata sandi tidak cocok.' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login username belum siap dikonfigurasi.', error);
    return NextResponse.json({ error: 'Login username belum siap. Minta admin memeriksa konfigurasi akun.' }, { status: 503 });
  }
}
