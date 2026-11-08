-- Bantarsari production foundation. Review before applying to Supabase.
-- No seed accounts or resident records are included.
create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'kadus', 'rw', 'rt')),
  assigned_dusun text,
  assigned_rw text,
  assigned_rt text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint profiles_role_scope check (
    (role = 'admin' and assigned_dusun is null and assigned_rw is null and assigned_rt is null)
    or (role = 'kadus' and assigned_dusun is not null and assigned_rw is null and assigned_rt is null)
    or (role = 'rw' and assigned_dusun is not null and assigned_rw is not null and assigned_rt is null)
    or (role = 'rt' and assigned_dusun is not null and assigned_rw is not null and assigned_rt is not null)
  )
);

create table if not exists public.village_config (
  id boolean primary key default true check (id),
  nama_desa text not null,
  kepala_desa text not null default '',
  alamat_desa text not null default '',
  kecamatan text not null default '',
  kabupaten text not null default '',
  provinsi text not null default '',
  kode_pos text not null default '',
  telepon_desa text,
  email_desa text,
  updated_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  no_kk varchar(16) not null unique check (no_kk ~ '^[0-9]{16}$'),
  kepala_keluarga text not null,
  alamat text not null,
  no_rumah text not null default '01',
  dusun text not null,
  rw varchar(3) not null,
  rt varchar(3) not null,
  status_barcode boolean not null default true,
  status_update boolean not null default true,
  penerangan text not null default 'meteran' check (penerangan in ('meteran','tetangga','tanpa_meteran')),
  fasilitas_mck text not null default 'sendiri' check (fasilitas_mck in ('sendiri','kelompok','umum','tidak_ada')),
  bantuan_sosial text not null default 'none' check (bantuan_sosial in ('none','blt','pkh','bpnt','kip')),
  created_at timestamptz not null default now()
);

create table if not exists public.citizens (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  nik varchar(16) not null unique check (nik ~ '^[0-9]{16}$'),
  nama_lengkap text not null,
  hubungan_keluarga text not null,
  jenis_kelamin varchar(1) not null check (jenis_kelamin in ('L','P')),
  tempat_lahir text not null,
  tanggal_lahir date not null,
  golongan_darah text not null default 'Tidak Tahu',
  agama text not null,
  pendidikan_terakhir text not null,
  pekerjaan text not null,
  status_perkawinan text not null default 'Belum Kawin' check (status_perkawinan in ('Belum Kawin','Kawin','Cerai Hidup','Cerai Mati')),
  tanggal_perkawinan text not null default '-',
  nama_ayah text not null default '-',
  nama_ibu text not null default '-',
  bpjs_kesehatan text not null default 'tidak' check (bpjs_kesehatan in ('mandiri','kis','tidak')),
  disabilitas text not null default 'tidak',
  status_tki boolean not null default false,
  akta_kelahiran boolean not null default false,
  akta_nikah boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete set null,
  citizen_id uuid references public.citizens(id) on delete set null,
  author_id uuid not null references auth.users(id),
  dusun text not null,
  rw text not null,
  rt text not null,
  message text not null check (length(trim(message)) between 1 and 4000),
  status text not null default 'pending' check (status in ('pending','reviewed','resolved')),
  created_at timestamptz not null default now()
);

create or replace function private.is_active_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.active and p.role = 'admin'
  );
$$;

create or replace function private.can_access_territory(p_dusun text, p_rw text, p_rt text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.active
      and (
        p.role = 'admin'
        or (p.role = 'kadus' and p.assigned_dusun = p_dusun)
        or (p.role = 'rw' and p.assigned_dusun = p_dusun and p.assigned_rw = p_rw)
        or (p.role = 'rt' and p.assigned_dusun = p_dusun and p.assigned_rw = p_rw and p.assigned_rt = p_rt)
      )
  );
$$;

create or replace function private.note_references_in_scope(
  p_family_id uuid, p_citizen_id uuid, p_dusun text, p_rw text, p_rt text
)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select
    (select private.can_access_territory(p_dusun,p_rw,p_rt))
    and (
      p_family_id is null
      or exists (
        select 1 from public.families f
        where f.id = p_family_id
          and f.dusun = p_dusun and f.rw = p_rw and f.rt = p_rt
      )
    )
    and (
      p_citizen_id is null
      or exists (
        select 1
        from public.citizens c
        join public.families f on f.id = c.family_id
        where c.id = p_citizen_id
          and (p_family_id is null or c.family_id = p_family_id)
          and f.dusun = p_dusun and f.rw = p_rw and f.rt = p_rt
      )
    );
$$;

revoke all on function private.is_active_admin() from public, anon;
revoke all on function private.can_access_territory(text,text,text) from public, anon;
revoke all on function private.note_references_in_scope(uuid,uuid,text,text,text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_active_admin() to authenticated;
grant execute on function private.can_access_territory(text,text,text) to authenticated;
grant execute on function private.note_references_in_scope(uuid,uuid,text,text,text) to authenticated;

alter table public.profiles enable row level security;
alter table public.village_config enable row level security;
alter table public.families enable row level security;
alter table public.citizens enable row level security;
alter table public.notes enable row level security;

revoke all on public.profiles, public.village_config, public.families, public.citizens, public.notes from anon, authenticated;
grant select, insert, update, delete on public.profiles, public.village_config, public.families, public.citizens to authenticated;
grant select, insert, delete on public.notes to authenticated;
grant update (status) on public.notes to authenticated;

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_active_admin()));
drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles for insert to authenticated
with check ((select private.is_active_admin()));
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated
using ((select private.is_active_admin())) with check ((select private.is_active_admin()));
drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles for delete to authenticated
using ((select private.is_active_admin()));

drop policy if exists village_read_signed_in on public.village_config;
create policy village_read_signed_in on public.village_config for select to authenticated using (true);
drop policy if exists village_admin_write on public.village_config;
create policy village_admin_write on public.village_config for all to authenticated
using ((select private.is_active_admin())) with check ((select private.is_active_admin()));

drop policy if exists families_read_assigned_area on public.families;
create policy families_read_assigned_area on public.families for select to authenticated
using ((select private.can_access_territory(dusun,rw,rt)));
drop policy if exists families_admin_write on public.families;
create policy families_admin_write on public.families for all to authenticated
using ((select private.is_active_admin())) with check ((select private.is_active_admin()));

drop policy if exists citizens_read_assigned_area on public.citizens;
create policy citizens_read_assigned_area on public.citizens for select to authenticated
using (exists (
  select 1 from public.families f
  where f.id = citizens.family_id
    and (select private.can_access_territory(f.dusun,f.rw,f.rt))
));
drop policy if exists citizens_admin_write on public.citizens;
create policy citizens_admin_write on public.citizens for all to authenticated
using ((select private.is_active_admin())) with check ((select private.is_active_admin()));

drop policy if exists notes_read_assigned_area on public.notes;
create policy notes_read_assigned_area on public.notes for select to authenticated
using ((select private.can_access_territory(dusun,rw,rt)));
drop policy if exists notes_insert_assigned_area on public.notes;
create policy notes_insert_assigned_area on public.notes for insert to authenticated
with check (
  author_id = (select auth.uid())
  and (select private.can_access_territory(dusun,rw,rt))
  and (select private.note_references_in_scope(family_id,citizen_id,dusun,rw,rt))
);
drop policy if exists notes_update_author_or_admin on public.notes;
drop policy if exists notes_update_assigned_area on public.notes;
create policy notes_update_assigned_area on public.notes for update to authenticated
using ((select private.can_access_territory(dusun,rw,rt)))
with check (
  (select private.can_access_territory(dusun,rw,rt))
  and (select private.note_references_in_scope(family_id,citizen_id,dusun,rw,rt))
);
drop policy if exists notes_delete_author_or_admin on public.notes;
create policy notes_delete_author_or_admin on public.notes for delete to authenticated
using (
  (select private.can_access_territory(dusun,rw,rt))
  and (author_id = (select auth.uid()) or (select private.is_active_admin()))
);

create index if not exists families_territory_idx on public.families (dusun,rw,rt);
create index if not exists citizens_family_id_idx on public.citizens (family_id);
create index if not exists notes_territory_created_idx on public.notes (dusun,rw,rt,created_at desc);

comment on schema private is 'Non-exposed helper functions used by Bantarsari RLS policies.';
