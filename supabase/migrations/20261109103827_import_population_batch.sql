-- Import a batch in one Postgres transaction. RLS remains active because this
-- is SECURITY INVOKER; the private admin predicate is checked explicitly too.
create or replace function public.import_population_batch(p_families jsonb, p_citizens jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_family_count integer;
  v_citizen_count integer;
begin
  if not (select private.is_active_admin()) then
    raise exception 'Administrator aktif diperlukan.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_families) <> 'array' or jsonb_typeof(p_citizens) <> 'array' then
    raise exception 'Format impor tidak valid.' using errcode = '22023';
  end if;

  select count(*) into v_family_count from jsonb_array_elements(p_families);
  select count(*) into v_citizen_count from jsonb_array_elements(p_citizens);
  if v_family_count < 1 or v_citizen_count < 1 or v_citizen_count > 5000 or v_family_count > 5000 then
    raise exception 'Jumlah data impor di luar batas.' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(p_families) as x(no_kk text)
    where x.no_kk is null or x.no_kk !~ '^[0-9]{16}$'
  ) or exists (
    select 1 from jsonb_to_recordset(p_citizens) as x(nik text)
    where x.nik is null or x.nik !~ '^[0-9]{16}$'
  ) then
    raise exception 'NIK atau nomor KK harus tepat 16 digit.' using errcode = '22023';
  end if;

  if exists (select 1 from jsonb_to_recordset(p_families) as x(no_kk text) group by x.no_kk having count(*) > 1)
    or exists (select 1 from jsonb_to_recordset(p_citizens) as x(nik text) group by x.nik having count(*) > 1)
    or exists (select 1 from jsonb_to_recordset(p_families) as x(no_kk text) join public.families f on f.no_kk = x.no_kk)
    or exists (select 1 from jsonb_to_recordset(p_citizens) as x(nik text) join public.citizens c on c.nik = x.nik) then
    raise exception 'Ada NIK atau nomor KK duplikat. Tidak ada data yang diimpor.' using errcode = '23505';
  end if;

  insert into public.families (
    id, no_kk, kepala_keluarga, alamat, no_rumah, dusun, rw, rt,
    status_barcode, status_update, penerangan, fasilitas_mck, bantuan_sosial
  )
  select x.id, x.no_kk, x.kepala_keluarga, x.alamat, coalesce(x.no_rumah, '01'),
    x.dusun, x.rw, x.rt, coalesce(x.status_barcode, true), coalesce(x.status_update, true),
    coalesce(x.penerangan, 'meteran'), coalesce(x.fasilitas_mck, 'sendiri'), coalesce(x.bantuan_sosial, 'none')
  from jsonb_to_recordset(p_families) as x(
    id uuid, no_kk text, kepala_keluarga text, alamat text, no_rumah text,
    dusun text, rw text, rt text, status_barcode boolean, status_update boolean,
    penerangan text, fasilitas_mck text, bantuan_sosial text
  );

  insert into public.citizens (
    id, family_id, nik, nama_lengkap, hubungan_keluarga, jenis_kelamin,
    tempat_lahir, tanggal_lahir, golongan_darah, agama, pendidikan_terakhir,
    pekerjaan, status_perkawinan, tanggal_perkawinan, nama_ayah, nama_ibu,
    bpjs_kesehatan, disabilitas, status_tki, akta_kelahiran, akta_nikah
  )
  select x.id, x.family_id, x.nik, x.nama_lengkap, x.hubungan_keluarga, x.jenis_kelamin,
    x.tempat_lahir, x.tanggal_lahir, coalesce(x.golongan_darah, 'Tidak Tahu'), coalesce(x.agama, 'Islam'),
    x.pendidikan_terakhir, x.pekerjaan, coalesce(x.status_perkawinan, 'Belum Kawin'),
    coalesce(x.tanggal_perkawinan, '-'), coalesce(x.nama_ayah, '-'), coalesce(x.nama_ibu, '-'),
    coalesce(x.bpjs_kesehatan, 'tidak'), coalesce(x.disabilitas, 'tidak'), coalesce(x.status_tki, false),
    coalesce(x.akta_kelahiran, false), coalesce(x.akta_nikah, false)
  from jsonb_to_recordset(p_citizens) as x(
    id uuid, family_id uuid, nik text, nama_lengkap text, hubungan_keluarga text,
    jenis_kelamin text, tempat_lahir text, tanggal_lahir date, golongan_darah text,
    agama text, pendidikan_terakhir text, pekerjaan text, status_perkawinan text,
    tanggal_perkawinan text, nama_ayah text, nama_ibu text, bpjs_kesehatan text,
    disabilitas text, status_tki boolean, akta_kelahiran boolean, akta_nikah boolean
  );
end;
$$;

revoke all on function public.import_population_batch(jsonb, jsonb) from public, anon;
grant execute on function public.import_population_batch(jsonb, jsonb) to authenticated;
