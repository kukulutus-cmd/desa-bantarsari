import type { BansosType, BloodType, BpjsType, Citizen, Family, MaritalStatus, MckType, PeneranganType } from '@/lib/types';

export type ImportPreview = {
  families: Family[];
  citizens: Citizen[];
  errors: string[];
};

const bloodTypes: BloodType[] = ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak Tahu'];
const socialAidTypes: BansosType[] = ['none', 'blt', 'pkh', 'bpnt', 'kip'];

function cell(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim().replace(/^="([\s\S]*)"$/, '$1').replace(/^'(.*)$/, '$1');
    }
  }
  return '';
}

function normalizeDate(input: string) {
  const value = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function boolValue(input: string, fallback: boolean) {
  if (!input) return fallback;
  const normalized = input.toLowerCase();
  if (['ya', 'yes', '1', 'true', 'aktif'].includes(normalized)) return true;
  if (['tidak', 'no', '0', 'false', 'nonaktif'].includes(normalized)) return false;
  return null;
}

function normalizeGender(input: string) {
  const normalized = input.trim().toLowerCase();
  if (['l', 'laki-laki', 'laki laki', 'pria'].includes(normalized)) return 'L' as const;
  if (['p', 'perempuan', 'wanita'].includes(normalized)) return 'P' as const;
  return null;
}

function normalizeMarital(input: string): MaritalStatus | null {
  const value = input.trim().toLowerCase();
  if (!value || ['belum kawin', 'belum menikah', 'lajang'].includes(value)) return 'Belum Kawin';
  if (['kawin', 'menikah'].includes(value)) return 'Kawin';
  if (['cerai hidup'].includes(value)) return 'Cerai Hidup';
  if (['cerai mati', 'duda', 'janda'].includes(value)) return 'Cerai Mati';
  return null;
}

function normalizeBpjs(input: string): BpjsType | null {
  const value = input.trim().toLowerCase();
  if (!value || ['tidak', 'tidak ada', 'none'].includes(value)) return 'tidak';
  if (value === 'mandiri') return 'mandiri';
  if (['kis', 'bpjs', 'pbi'].includes(value)) return 'kis';
  return null;
}

function isAllowed<T extends string>(value: string, choices: readonly T[]) {
  return choices.includes(value as T);
}

export function preparePopulationImport(
  rows: Record<string, string>[],
  existingFamilies: Family[],
  existingCitizens: Citizen[],
): ImportPreview {
  const errors: string[] = [];
  const familyByKk = new Map<string, Family>();
  const citizens: Citizen[] = [];
  const seenNik = new Set<string>();
  const existingKk = new Set(existingFamilies.map((family) => family.no_kk));
  const existingNik = new Set(existingCitizens.map((citizen) => citizen.nik));
  const maximumRows = 5000;

  if (!rows.length) return { families: [], citizens: [], errors: ['Berkas tidak memiliki baris data.'] };
  if (rows.length > maximumRows) return { families: [], citizens: [], errors: [`Maksimal ${maximumRows.toLocaleString('id-ID')} warga per proses impor.`] };

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const noKk = cell(row, 'no_kk', 'nomor_kartu_keluarga', 'kartu_keluarga').replace(/\D/g, '');
    const nik = cell(row, 'nik', 'nomor_induk_kependudukan_nik').replace(/\D/g, '');
    const fullName = cell(row, 'nama_lengkap', 'nama_lengkap_warga', 'nama');
    const headName = cell(row, 'kepala_keluarga', 'nama_kepala_keluarga');
    const address = cell(row, 'alamat', 'alamat_lengkap');
    const dusun = cell(row, 'dusun');
    const rw = cell(row, 'rw');
    const rt = cell(row, 'rt');
    const relation = cell(row, 'hubungan_keluarga', 'hubungan');
    const gender = normalizeGender(cell(row, 'jenis_kelamin', 'gender'));
    const placeOfBirth = cell(row, 'tempat_lahir');
    const dateOfBirth = normalizeDate(cell(row, 'tanggal_lahir', 'tgl_lahir'));
    const education = cell(row, 'pendidikan_terakhir', 'pendidikan');
    const occupation = cell(row, 'pekerjaan');

    const required: Array<[string, string]> = [
      ['Nomor KK', noKk], ['Nama kepala keluarga', headName], ['Alamat', address],
      ['Dusun', dusun], ['RW', rw], ['RT', rt], ['NIK', nik], ['Nama warga', fullName],
      ['Hubungan keluarga', relation], ['Jenis kelamin', gender || ''],
      ['Tempat lahir', placeOfBirth], ['Tanggal lahir', dateOfBirth],
      ['Pendidikan', education], ['Pekerjaan', occupation],
    ];
    const missing = required.filter(([, value]) => !value).map(([label]) => label);
    if (missing.length) {
      if (errors.length < 50) errors.push(`Baris ${rowNumber}: kolom wajib belum valid (${missing.join(', ')}).`);
      return;
    }
    if (noKk.length !== 16 || nik.length !== 16) {
      if (errors.length < 50) errors.push(`Baris ${rowNumber}: Nomor KK dan NIK harus masing-masing 16 digit.`);
      return;
    }
    if (seenNik.has(nik) || existingNik.has(nik)) {
      if (errors.length < 50) errors.push(`Baris ${rowNumber}: NIK ${nik} duplikat di file atau sudah ada.`);
      return;
    }

    const marital = normalizeMarital(cell(row, 'status_perkawinan'));
    const bpjs = normalizeBpjs(cell(row, 'bpjs_kesehatan', 'bpjs'));
    const bloodType = cell(row, 'golongan_darah', 'gol_darah') || 'Tidak Tahu';
    if (!marital || !bpjs || !isAllowed(bloodType, bloodTypes)) {
      if (errors.length < 50) errors.push(`Baris ${rowNumber}: status perkawinan, BPJS, atau golongan darah tidak dikenali.`);
      return;
    }

    if (!gender) {
      if (errors.length < 50) errors.push(`Baris ${rowNumber}: jenis kelamin harus L atau P.`);
      return;
    }
    const familyKey = noKk;
    let family = familyByKk.get(familyKey);
    if (!family) {
      if (existingKk.has(noKk)) {
        if (errors.length < 50) errors.push(`Baris ${rowNumber}: Nomor KK ${noKk} sudah ada di database.`);
        return;
      }
      const penerangan = (cell(row, 'penerangan', 'penerangan_listrik') || 'meteran').toLowerCase() as PeneranganType;
      const mck = (cell(row, 'fasilitas_mck') || 'sendiri').toLowerCase() as MckType;
      const bantuan = (cell(row, 'bantuan_sosial') || 'none').toLowerCase() as BansosType;
      const barcode = boolValue(cell(row, 'status_barcode'), true);
      const statusUpdate = boolValue(cell(row, 'status_update', 'status_validasi'), true);
      if (barcode === null || statusUpdate === null) {
        if (errors.length < 50) errors.push(`Baris ${rowNumber}: status barcode dan validasi harus Ya atau Tidak.`);
        return;
      }
      const newFamily: Family = {
        id: crypto.randomUUID(),
        no_kk: noKk,
        kepala_keluarga: headName,
        alamat: address,
        no_rumah: cell(row, 'no_rumah', 'nomor_rumah') || '01',
        dusun,
        rw: rw.padStart(3, '0'),
        rt: rt.padStart(3, '0'),
        status_barcode: barcode,
        status_update: statusUpdate,
        penerangan,
        fasilitas_mck: mck,
        bantuan_sosial: bantuan,
      };
      if (!isAllowed(newFamily.penerangan, ['meteran', 'tetangga', 'tanpa_meteran'] as const)
        || !isAllowed(newFamily.fasilitas_mck, ['sendiri', 'kelompok', 'umum', 'tidak_ada'] as const)
        || !socialAidTypes.includes(newFamily.bantuan_sosial)) {
        if (errors.length < 50) errors.push(`Baris ${rowNumber}: penerangan, MCK, atau bantuan sosial tidak dikenali.`);
        return;
      }
      family = newFamily;
      familyByKk.set(familyKey, family);
    } else if (family.kepala_keluarga !== headName || family.alamat !== address || family.dusun !== dusun || family.rw !== rw.padStart(3, '0') || family.rt !== rt.padStart(3, '0')) {
      if (errors.length < 50) errors.push(`Baris ${rowNumber}: data KK ${noKk} berbeda antaranggota keluarga.`);
      return;
    }

    const marriageDate = cell(row, 'tanggal_perkawinan', 'tgl_perkawinan', 'tanggal_nikah') || '-';
    const tki = boolValue(cell(row, 'status_tki', 'tki'), false);
    const disability = cell(row, 'disabilitas') || 'tidak';
    if (tki === null) {
      if (errors.length < 50) errors.push(`Baris ${rowNumber}: status TKI harus Ya atau Tidak.`);
      return;
    }

    citizens.push({
      id: crypto.randomUUID(),
      family_id: family.id,
      nik,
      nama_lengkap: fullName,
      hubungan_keluarga: relation,
      jenis_kelamin: gender,
      tempat_lahir: placeOfBirth,
      tanggal_lahir: dateOfBirth,
      golongan_darah: bloodType,
      agama: cell(row, 'agama') || 'Islam',
      pendidikan_terakhir: education,
      pekerjaan: occupation,
      status_perkawinan: marital,
      tanggal_perkawinan: marriageDate,
      nama_ayah: cell(row, 'nama_ayah') || '-',
      nama_ibu: cell(row, 'nama_ibu') || '-',
      bpjs_kesehatan: bpjs,
      disabilitas: disability,
      status_tki: tki,
      akta_kelahiran: boolValue(cell(row, 'akta_kelahiran'), false) ?? false,
      akta_nikah: boolValue(cell(row, 'akta_nikah'), marital === 'Kawin') ?? false,
    });
    seenNik.add(nik);
  });

  if (errors.length >= 50) errors.push('Masih ada kesalahan lain. Perbaiki data lalu unggah ulang untuk melihat pemeriksaan berikutnya.');
  const families = Array.from(familyByKk.values());
  if (citizens.length !== rows.length) {
    return { families: [], citizens: [], errors: errors.length ? errors : ['Sebagian baris tidak dapat diproses.'] };
  }
  return { families, citizens, errors };
}

export type PopulationImportPayload = {
  families: Omit<Family, 'members' | 'members_count'>[];
  citizens: Omit<Citizen, 'family'>[];
};

export function toPopulationImportPayload(families: Family[], citizens: Citizen[]): PopulationImportPayload {
  return {
    families: families.map(({ members, members_count, ...family }) => family),
    citizens: citizens.map(({ family, ...citizen }) => citizen),
  };
}

