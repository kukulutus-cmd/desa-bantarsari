import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const familyCount = 125;
const residentsPerFamily = 4;
const citizens = [];
const families = [];
const religions = ['Islam', 'Islam', 'Islam', 'Kristen'];
const adultEducation = ['SD', 'SMP', 'SMA', 'SMK', 'D3', 'S1'];
const childEducation = ['Belum Sekolah', 'PAUD', 'SD', 'SMP', 'SMA'];

function idForFamily(number) {
  return `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
}

function fakeId(prefix, number) {
  return `${prefix}${String(number).padStart(14, '0')}`;
}

function birthDate(age, number) {
  const year = 2026 - age;
  const month = (number % 12) + 1;
  const day = (number % 27) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

for (let familyNumber = 1; familyNumber <= familyCount; familyNumber += 1) {
  const familyId = idForFamily(familyNumber);
  const headNumber = ((familyNumber - 1) * residentsPerFamily) + 1;
  const headName = `Data Uji ${String(headNumber).padStart(4, '0')}`;

  families.push({
    id: familyId,
    no_kk: fakeId('99', familyNumber + 5000),
    kepala_keluarga: headName,
    alamat: `Alamat Uji ${String(familyNumber).padStart(3, '0')}`,
    no_rumah: String(familyNumber).padStart(3, '0'),
    dusun: 'Belum diatur',
    rw: '000',
    rt: '000',
    status_barcode: true,
    status_update: true,
    penerangan: 'meteran',
    fasilitas_mck: 'sendiri',
    bantuan_sosial: 'none',
  });

  const household = [
    { relation: 'Kepala Keluarga', gender: 'L', age: 30 + (familyNumber % 25), job: 'Pekerja Uji', marital: 'Kawin' },
    { relation: 'Istri', gender: 'P', age: 28 + (familyNumber % 23), job: 'Ibu Rumah Tangga Uji', marital: 'Kawin' },
    { relation: 'Anak', gender: familyNumber % 2 ? 'L' : 'P', age: 3 + (familyNumber % 12), job: 'Pelajar Uji', marital: 'Belum Kawin' },
    { relation: 'Anak', gender: familyNumber % 2 ? 'P' : 'L', age: 5 + (familyNumber % 10), job: 'Pelajar Uji', marital: 'Belum Kawin' },
  ];

  household.forEach((person, index) => {
    const number = headNumber + index;
    const isAdult = person.age >= 18;
    const married = person.marital === 'Kawin';
    citizens.push({
      id: `10000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
      family_id: familyId,
      nik: fakeId('99', number),
      nama_lengkap: `Data Uji ${String(number).padStart(4, '0')}`,
      hubungan_keluarga: person.relation,
      jenis_kelamin: person.gender,
      tempat_lahir: 'Kota Uji',
      tanggal_lahir: birthDate(person.age, number),
      golongan_darah: 'Tidak Tahu',
      agama: religions[number % religions.length],
      pendidikan_terakhir: isAdult ? adultEducation[number % adultEducation.length] : childEducation[number % childEducation.length],
      pekerjaan: person.job,
      status_perkawinan: person.marital,
      tanggal_perkawinan: married ? `${2026 - person.age + 2}-06-15` : '-',
      nama_ayah: index >= 2 ? headName : '-',
      nama_ibu: index >= 2 ? `Data Uji ${String(headNumber + 1).padStart(4, '0')}` : '-',
      bpjs_kesehatan: ['tidak', 'mandiri', 'kis'][number % 3],
      disabilitas: 'tidak',
      status_tki: false,
      akta_kelahiran: !isAdult,
      akta_nikah: married,
    });
  });
}

const outputPath = resolve(process.argv[2] || 'supabase/fixtures/warga-uji-500.json');
const fixture = {
  metadata: {
    dataset: 'WARGA FIKTIF UNTUK PENGUJIAN',
    synthetic_only: true,
    warning: 'Jangan impor ke database produksi atau perlakukan sebagai data penduduk nyata.',
    citizens_count: citizens.length,
    families_count: families.length,
    fake_identifier_prefix: '99 (bukan NIK/KK nyata)',
    territory: 'Belum diatur / 000',
  },
  families,
  citizens,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
process.stdout.write(`Dibuat ${citizens.length} warga fiktif dalam ${families.length} keluarga: ${outputPath}\n`);
