import * as XLSX from 'xlsx';
import { Family, Citizen, MaritalStatus, GenderType, PeneranganType, MckType, BansosType } from './types';
import {
  getCitizenMaritalStatus,
  getFamilyHouseNumber,
  getCitizenBloodType,
  getCitizenMarriageDate,
  getCitizenParents,
} from './dataUtils';

export interface ExportRow {
  no_urut: number | string;
  no_rumah: string;
  no_urut_kk: number | string;
  no_kk: string;
  kepala_keluarga: string;
  nik: string;
  nama_lengkap: string;
  hubungan_keluarga: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  golongan_darah: string;
  status_perkawinan: string;
  tanggal_perkawinan: string;
  nama_ayah: string;
  nama_ibu: string;
  agama: string;
  pendidikan_terakhir: string;
  pekerjaan: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  status_barcode: string;
  status_update: string;
  penerangan: string;
  fasilitas_mck: string;
  bantuan_sosial: string;
}

// Convert internal data to unified flat rows for spreadsheet
export function prepareSpreadsheetRows(
  citizens: Citizen[],
  families: Family[]
): ExportRow[] {
  const familyMap = new Map<string, Family>();
  families.forEach((f) => familyMap.set(f.id, f));

  // Urutkan anggota keluarga: Kepala Keluarga terlebih dahulu, kemudian Istri, Anak, dst.
  const hierarchyRank = (rel: string): number => {
    const r = (rel || '').toLowerCase();
    if (r.includes('kepala')) return 1;
    if (r.includes('istri')) return 2;
    if (r.includes('anak')) return 3;
    if (r.includes('orang tua') || r.includes('mertua')) return 4;
    return 5;
  };

  // Group citizens by family so members of the same family stay contiguous
  const groupedCitizens = [...citizens].sort((a, b) => {
    if (a.family_id !== b.family_id) {
      return a.family_id.localeCompare(b.family_id);
    }
    return hierarchyRank(a.hubungan_keluarga) - hierarchyRank(b.hubungan_keluarga);
  });

  // Track sequence number for each unique family
  const familySequenceMap = new Map<string, number>();
  let currentKkSeq = 0;

  return groupedCitizens.map((c, index) => {
    const f = familyMap.get(c.family_id);
    const houseNumber = getFamilyHouseNumber(f);
    const marital = getCitizenMaritalStatus(c);
    const bloodType = getCitizenBloodType(c);
    const marriageDate = getCitizenMarriageDate(c);
    const parents = getCitizenParents(c);

    // Nomor Urut KK tracking
    const familyKey = c.family_id || (f?.no_kk ?? `unknown-${index}`);
    if (!familySequenceMap.has(familyKey)) {
      currentKkSeq++;
      familySequenceMap.set(familyKey, currentKkSeq);
    }
    const noUrutKk = familySequenceMap.get(familyKey)!;

    // Jenis Kelamin tanpa singkatan (Laki-laki / Perempuan)
    let gender = 'Laki-laki';
    const rawGender = String(c.jenis_kelamin || '').trim().toUpperCase();
    if (rawGender === 'P' || rawGender.startsWith('PEREMPUAN') || rawGender.startsWith('PEREM')) {
      gender = 'Perempuan';
    } else {
      gender = 'Laki-laki';
    }

    return {
      no_urut: index + 1,
      no_rumah: houseNumber,
      no_urut_kk: noUrutKk,
      no_kk: f?.no_kk || '',
      kepala_keluarga: f?.kepala_keluarga || '',
      nik: c.nik,
      nama_lengkap: c.nama_lengkap,
      hubungan_keluarga: c.hubungan_keluarga,
      jenis_kelamin: gender,
      tempat_lahir: c.tempat_lahir,
      tanggal_lahir: c.tanggal_lahir,
      golongan_darah: bloodType,
      status_perkawinan: marital,
      tanggal_perkawinan: marriageDate,
      nama_ayah: parents.ayah,
      nama_ibu: parents.ibu,
      agama: c.agama || 'Islam',
      pendidikan_terakhir: c.pendidikan_terakhir,
      pekerjaan: c.pekerjaan,
      alamat: f?.alamat || '',
      rt: f?.rt || '',
      rw: f?.rw || '',
      dusun: f?.dusun || '',
      status_barcode: f?.status_barcode ? 'Ya' : 'Tidak',
      status_update: f?.status_update ? 'Ya' : 'Tidak',
      penerangan: f?.penerangan || 'meteran',
      fasilitas_mck: f?.fasilitas_mck || 'sendiri',
      bantuan_sosial: f?.bantuan_sosial || 'none',
    };
  });
}

// Indonesian Header Labels for Excel Table
// Sesuai permintaan: 1. Nomor Urut, 2. Nomor Rumah, 3. Nomor Urut KK, lalu sisa kolomnya
export const SPREADSHEET_COLUMNS = [
  { key: 'no_urut', label: 'Nomor Urut' },
  { key: 'no_rumah', label: 'Nomor Rumah' },
  { key: 'no_urut_kk', label: 'Nomor Urut KK' },
  { key: 'no_kk', label: 'Nomor Kartu Keluarga' },
  { key: 'kepala_keluarga', label: 'Nama Kepala Keluarga' },
  { key: 'nik', label: 'Nomor Induk Kependudukan (NIK)' },
  { key: 'nama_lengkap', label: 'Nama Lengkap Warga' },
  { key: 'hubungan_keluarga', label: 'Hubungan Keluarga' },
  { key: 'jenis_kelamin', label: 'Jenis Kelamin' },
  { key: 'tempat_lahir', label: 'Tempat Lahir' },
  { key: 'tanggal_lahir', label: 'Tanggal Lahir' },
  { key: 'golongan_darah', label: 'Golongan Darah' },
  { key: 'status_perkawinan', label: 'Status Perkawinan' },
  { key: 'tanggal_perkawinan', label: 'Tanggal Perkawinan' },
  { key: 'nama_ayah', label: 'Nama Ayah' },
  { key: 'nama_ibu', label: 'Nama Ibu' },
  { key: 'agama', label: 'Agama' },
  { key: 'pendidikan_terakhir', label: 'Pendidikan Terakhir' },
  { key: 'pekerjaan', label: 'Pekerjaan' },
  { key: 'alamat', label: 'Alamat Lengkap' },
  { key: 'rt', label: 'RT' },
  { key: 'rw', label: 'RW' },
  { key: 'dusun', label: 'Dusun' },
  { key: 'status_barcode', label: 'Status Barcode' },
  { key: 'status_update', label: 'Status Validasi' },
  { key: 'penerangan', label: 'Penerangan Listrik' },
  { key: 'fasilitas_mck', label: 'Fasilitas MCK' },
  { key: 'bantuan_sosial', label: 'Bantuan Sosial' },
] as const;

// Helper to format rows into ordered display dictionary
function mapRowsToOrderedDict(rows: ExportRow[]) {
  return rows.map((r) => {
    const item: Record<string, any> = {};
    SPREADSHEET_COLUMNS.forEach((col) => {
      item[col.label] = (r as any)[col.key] ?? '';
    });
    return item;
  });
}

/**
 * 1. NATIVE EXCEL (.xlsx) EXPORTER
 * Menghasilkan file Excel asli (.xlsx) dengan kolom rapi terpisah,
 * Urutan kolom: 1. Nomor Urut, 2. Nomor Rumah, 3. Nomor Urut KK, dst.
 * Jenis Kelamin: "Laki-laki" / "Perempuan",
 * NIK & KK bertipe teks (tidak terpotong jadi notasi ilmiah 3.21608E+15),
 * dan lebar kolom otomatis disesuaikan.
 */
export function exportToExcel(rows: ExportRow[], fileName: string) {
  const formattedData = mapRowsToOrderedDict(rows);
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Auto calculate column widths
  const colWidths = SPREADSHEET_COLUMNS.map((col) => {
    let maxLen = col.label.length;
    rows.forEach((r) => {
      const val = String((r as any)[col.key] || '');
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
  });
  worksheet['!cols'] = colWidths;

  // Set explicit string type for NIK, No KK, Nomor Rumah, RT, RW so Excel preserves exact text
  const colIndexMap = new Map<string, number>();
  SPREADSHEET_COLUMNS.forEach((col, idx) => colIndexMap.set(col.key, idx));

  const textKeys = ['no_rumah', 'no_kk', 'nik', 'rt', 'rw'];
  const textColIndices = textKeys
    .map((k) => colIndexMap.get(k))
    .filter((idx): idx is number => idx !== undefined);

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    for (const c of textColIndices) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c })];
      if (cell) {
        cell.t = 's';
        cell.z = '@';
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Kependudukan');

  // Trigger download as .xlsx
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

/**
 * 2. INDONESIAN REGIONAL CSV EXPORTER
 * Menggunakan separator titik-koma (;) dan instruksi `sep=;`
 * agar saat dibuka di Microsoft Excel versi Indonesia langsung terbagi per kolom!
 */
export function generateCsvIndonesia(rows: ExportRow[]): string {
  const delimiter = ';';
  const headers = SPREADSHEET_COLUMNS.map((col) => col.label);

  const lines: string[] = [];
  // sep=; explicitly informs Excel to split columns using semicolon
  lines.push(`sep=${delimiter}`);
  lines.push(headers.map((h) => `"${h}"`).join(delimiter));

  rows.forEach((row) => {
    const line = SPREADSHEET_COLUMNS.map((col) => {
      const val = String((row as any)[col.key] ?? '');
      // Format 16-digit numbers with ="..." so Excel preserves full text
      if (col.key === 'no_kk' || col.key === 'nik' || col.key === 'no_rumah') {
        return `="${val}"`;
      }
      return `"${val.replace(/"/g, '""')}"`;
    });
    lines.push(line.join(delimiter));
  });

  // UTF-8 BOM (\uFEFF)
  return '\uFEFF' + lines.join('\r\n');
}

/**
 * 3. STANDARD CSV EXPORTER (COMMA)
 */
export function generateCsv(rows: ExportRow[]): string {
  return generateCsvIndonesia(rows);
}

// Download file trigger helper
export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 4. UNIVERSAL SPREADSHEET PARSER (.xlsx, .xls, .csv)
 * Mampu membaca baik berkas Excel binary maupun file CSV dengan separator apapun.
 */
export async function parseSpreadsheetFile(file: File): Promise<Record<string, string>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse rows as raw objects with header
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    raw: false, // get formatted string values
    defval: '',
  });

  // Normalize header keys into snake_case
  return rawRows.map((raw) => {
    const normalized: Record<string, string> = {};
    Object.keys(raw).forEach((origKey) => {
      const cleanKey = origKey
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/^_+|_+$/g, '');

      let mappedKey = cleanKey;
      if (cleanKey.includes('kartu_keluarga') || cleanKey === 'no_kk') mappedKey = 'no_kk';
      else if (cleanKey.includes('kepala_keluarga')) mappedKey = 'kepala_keluarga';
      else if (cleanKey.includes('nik') || cleanKey.includes('ktp')) mappedKey = 'nik';
      else if (cleanKey.includes('nama_lengkap') || cleanKey === 'nama') mappedKey = 'nama_lengkap';
      else if (cleanKey.includes('hubungan')) mappedKey = 'hubungan_keluarga';
      else if (cleanKey.includes('jenis_kelamin') || cleanKey === 'gender') {
        mappedKey = 'jenis_kelamin';
        const gVal = String(raw[origKey] || '').toLowerCase();
        normalized['jenis_kelamin'] = gVal.includes('p') || gVal.includes('perempuan') ? 'P' : 'L';
      } else if (cleanKey.includes('tanggal_perkawinan') || cleanKey.includes('tgl_perkawinan') || cleanKey.includes('tgl_kawin') || cleanKey.includes('tanggal_nikah')) {
        mappedKey = 'tanggal_perkawinan';
      } else if (cleanKey.includes('perkawinan') || cleanKey.includes('nikah')) {
        mappedKey = 'status_perkawinan';
      } else if (cleanKey.includes('golongan_darah') || cleanKey.includes('gol_darah')) {
        mappedKey = 'golongan_darah';
      } else if (cleanKey.includes('ayah') || cleanKey.includes('bapak')) {
        mappedKey = 'nama_ayah';
      } else if (cleanKey.includes('ibu')) {
        mappedKey = 'nama_ibu';
      } else if (cleanKey.includes('rumah')) mappedKey = 'no_rumah';
      else if (cleanKey.includes('alamat')) mappedKey = 'alamat';

      normalized[mappedKey] = String(raw[origKey] || '').trim();
      normalized[cleanKey] = String(raw[origKey] || '').trim();
    });
    return normalized;
  });
}

// Fallback CSV text parser
export function parseCsv(csvText: string): Record<string, string>[] {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    raw: false,
    defval: '',
  });

  return rawRows.map((raw) => {
    const normalized: Record<string, string> = {};
    Object.keys(raw).forEach((k) => {
      const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
      normalized[cleanKey] = String(raw[k] || '').trim();
    });
    return normalized;
  });
}

// Generate template Excel file for download
export function generateSampleTemplateWorkbook(): void {
  const sampleRows: ExportRow[] = [
    {
      no_urut: 1,
      no_rumah: '01',
      no_urut_kk: 1,
      no_kk: '9999990000000001',
      kepala_keluarga: 'SAMSUDIN',
      nik: '9999990000000101',
      nama_lengkap: 'SAMSUDIN',
      hubungan_keluarga: 'Kepala Keluarga',
      jenis_kelamin: 'Laki-laki',
      tempat_lahir: 'Bekasi',
      tanggal_lahir: '1978-05-12',
      golongan_darah: 'O',
      status_perkawinan: 'Kawin',
      tanggal_perkawinan: '1999-06-15',
      nama_ayah: 'H. ABDUL KARIM',
      nama_ibu: 'HJ. MAEMUNAH',
      agama: 'Islam',
      pendidikan_terakhir: 'SMA / Sederajat',
      pekerjaan: 'Buruh Harian Lepas',
      alamat: 'Kp. Teko RT 001 / RW 001',
      rt: '001',
      rw: '001',
      dusun: 'Dusun I',
      status_barcode: 'Ya',
      status_update: 'Ya',
      penerangan: 'meteran',
      fasilitas_mck: 'sendiri',
      bantuan_sosial: 'pkh',
    },
    {
      no_urut: 2,
      no_rumah: '01',
      no_urut_kk: 1,
      no_kk: '9999990000000001',
      kepala_keluarga: 'SAMSUDIN',
      nik: '9999990000000102',
      nama_lengkap: 'SITI AMINAH',
      hubungan_keluarga: 'Istri',
      jenis_kelamin: 'Perempuan',
      tempat_lahir: 'Bekasi',
      tanggal_lahir: '1982-08-15',
      golongan_darah: 'A',
      status_perkawinan: 'Kawin',
      tanggal_perkawinan: '1999-06-15',
      nama_ayah: 'SANUSI',
      nama_ibu: 'ROKAYA',
      agama: 'Islam',
      pendidikan_terakhir: 'SMP / Sederajat',
      pekerjaan: 'Mengurus Rumah Tangga',
      alamat: 'Kp. Teko RT 001 / RW 001',
      rt: '001',
      rw: '001',
      dusun: 'Dusun I',
      status_barcode: 'Ya',
      status_update: 'Ya',
      penerangan: 'meteran',
      fasilitas_mck: 'sendiri',
      bantuan_sosial: 'pkh',
    },
    {
      no_urut: 3,
      no_rumah: '01',
      no_urut_kk: 1,
      no_kk: '9999990000000001',
      kepala_keluarga: 'SAMSUDIN',
      nik: '9999990000000103',
      nama_lengkap: 'RIZKY RAMADHAN',
      hubungan_keluarga: 'Anak',
      jenis_kelamin: 'Laki-laki',
      tempat_lahir: 'Bekasi',
      tanggal_lahir: '2005-02-14',
      golongan_darah: 'O',
      status_perkawinan: 'Belum Kawin',
      tanggal_perkawinan: '-',
      nama_ayah: 'SAMSUDIN',
      nama_ibu: 'SITI AMINAH',
      agama: 'Islam',
      pendidikan_terakhir: 'SMA / Sederajat',
      pekerjaan: 'Pelajar / Mahasiswa',
      alamat: 'Kp. Teko RT 001 / RW 001',
      rt: '001',
      rw: '001',
      dusun: 'Dusun I',
      status_barcode: 'Ya',
      status_update: 'Ya',
      penerangan: 'meteran',
      fasilitas_mck: 'sendiri',
      bantuan_sosial: 'pkh',
    },
    {
      no_urut: 4,
      no_rumah: '14',
      no_urut_kk: 2,
      no_kk: '9999990000000002',
      kepala_keluarga: 'ACHMAD SUHANDI',
      nik: '9999990000000005',
      nama_lengkap: 'ACHMAD SUHANDI',
      hubungan_keluarga: 'Kepala Keluarga',
      jenis_kelamin: 'Laki-laki',
      tempat_lahir: 'Karawang',
      tanggal_lahir: '1975-07-24',
      golongan_darah: 'B',
      status_perkawinan: 'Kawin',
      tanggal_perkawinan: '2001-09-10',
      nama_ayah: 'SUHANDI',
      nama_ibu: 'MARYAM',
      agama: 'Islam',
      pendidikan_terakhir: 'SMK / Sederajat',
      pekerjaan: 'Karyawan Swasta',
      alamat: 'Kp. Teko RT 002 / RW 001',
      rt: '002',
      rw: '001',
      dusun: 'Dusun I',
      status_barcode: 'Ya',
      status_update: 'Tidak',
      penerangan: 'meteran',
      fasilitas_mck: 'sendiri',
      bantuan_sosial: 'bpnt',
    },
  ];

  exportToExcel(sampleRows, 'Template_Format_Data_Kependudukan_Bantarsari.xlsx');
}

export function generateSampleTemplate(): string {
  return generateCsvIndonesia([
    {
      no_urut: 1,
      no_rumah: '01',
      no_urut_kk: 1,
      no_kk: '9999990000000001',
      kepala_keluarga: 'SAMSUDIN',
      nik: '9999990000000101',
      nama_lengkap: 'SAMSUDIN',
      hubungan_keluarga: 'Kepala Keluarga',
      jenis_kelamin: 'Laki-laki',
      tempat_lahir: 'Bekasi',
      tanggal_lahir: '1978-05-12',
      golongan_darah: 'O',
      status_perkawinan: 'Kawin',
      tanggal_perkawinan: '1999-06-15',
      nama_ayah: 'H. ABDUL KARIM',
      nama_ibu: 'HJ. MAEMUNAH',
      agama: 'Islam',
      pendidikan_terakhir: 'SMA / Sederajat',
      pekerjaan: 'Buruh Harian Lepas',
      alamat: 'Kp. Teko RT 001 / RW 001',
      rt: '001',
      rw: '001',
      dusun: 'Dusun I',
      status_barcode: 'Ya',
      status_update: 'Ya',
      penerangan: 'meteran',
      fasilitas_mck: 'sendiri',
      bantuan_sosial: 'pkh',
    },
  ]);
}
