export type UserRole = 'admin' | 'kadus' | 'rw' | 'rt';
export type GenderType = 'L' | 'P';
export type BpjsType = 'mandiri' | 'kis' | 'tidak';
export type PeneranganType = 'meteran' | 'tetangga' | 'tanpa_meteran';
export type MckType = 'sendiri' | 'kelompok' | 'umum' | 'tidak_ada';
export type BansosType = 'none' | 'blt' | 'pkh' | 'bpnt' | 'kip';
export type NoteStatus = 'pending' | 'reviewed' | 'resolved';
export type MaritalStatus = 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati';
export type BloodType = 'A' | 'B' | 'AB' | 'O' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Tidak Tahu';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  assigned_dusun?: string | null; // e.g. 'Dusun I'
  assigned_rw?: string | null;    // e.g. '001'
  assigned_rt?: string | null;    // e.g. '001'
  created_at?: string;
  phone?: string;
  avatar_url?: string;
}

export interface VillageConfig {
  nama_desa: string;
  kepala_desa: string;
  alamat_desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kode_pos: string;
  telepon_desa?: string;
  email_desa?: string;
}

export interface Family {
  id: string;
  no_kk: string;
  kepala_keluarga: string;
  alamat: string;
  no_rumah?: string;
  dusun: string;
  rw: string;
  rt: string;
  status_barcode: boolean;
  status_update: boolean;
  penerangan: PeneranganType;
  fasilitas_mck: MckType;
  bantuan_sosial: BansosType;
  created_at?: string;
  // joined/computed
  members_count?: number;
  members?: Citizen[];
}

export interface Citizen {
  id: string;
  family_id: string;
  nik: string;
  nama_lengkap: string;
  hubungan_keluarga: string; // 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain'
  jenis_kelamin: GenderType;
  tempat_lahir: string;
  tanggal_lahir: string; // YYYY-MM-DD
  golongan_darah?: string; // 'A' | 'B' | 'AB' | 'O' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Tidak Tahu'
  agama: string;
  pendidikan_terakhir: string;
  pekerjaan: string;
  status_perkawinan?: MaritalStatus;
  tanggal_perkawinan?: string; // YYYY-MM-DD or '-'
  nama_ayah?: string;
  nama_ibu?: string;
  bpjs_kesehatan: BpjsType;
  disabilitas: string; // 'tidak' | 'tunanetra' | 'tunarungu' | 'daksa' etc.
  status_tki: boolean;
  akta_kelahiran: boolean;
  akta_nikah: boolean;
  created_at?: string;
  // joined
  family?: Family;
}

export interface Note {
  id: string;
  family_id?: string | null;
  citizen_id?: string | null;
  author_id: string;
  message: string;
  status: NoteStatus;
  created_at: string;
  // joined
  author?: Profile;
  family_no_kk?: string;
  citizen_name?: string;
  citizen_nik?: string;
  dusun?: string;
  rw?: string;
  rt?: string;
}

export interface VillageStats {
  totalRumah: number;
  totalKK: number;
  totalJiwa: number;
  lakiLaki: number;
  perempuan: number;
  wajibKtp: number;
  lansia: number;
  bpjsKis: number;
  bpjsMandiri: number;
  bpjsNone: number;
  bansosBpnt: number;
  bansosPkh: number;
  bansosKip: number;
  bansosBlt: number;
  disabilitas: number;
  tki: number;
  pendingNotes: number;
}
