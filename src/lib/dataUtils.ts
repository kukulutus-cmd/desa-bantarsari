import type { Citizen, Family, MaritalStatus } from './types';

export function calculateCitizenAge(value: string | Pick<Citizen, 'tanggal_lahir'>, now = new Date()): number {
  const birth = new Date(typeof value === 'string' ? value : value.tanggal_lahir);
  if (Number.isNaN(birth.getTime())) return 0;
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return Math.max(0, age);
}

export function getFamilyHouseNumber(family?: Pick<Family, 'no_rumah'> | null): string {
  return family?.no_rumah || '01';
}

const MARITAL_STATUSES: MaritalStatus[] = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];

export function getCitizenMaritalStatus(citizen: Pick<Citizen, 'status_perkawinan'>): MaritalStatus {
  const value = citizen.status_perkawinan;
  return value && MARITAL_STATUSES.includes(value) ? value : 'Belum Kawin';
}

export function getCitizenBloodType(citizen: Pick<Citizen, 'golongan_darah'>): string {
  return citizen.golongan_darah || 'Tidak Tahu';
}

export function getCitizenMarriageDate(citizen: Pick<Citizen, 'tanggal_perkawinan'>): string {
  return citizen.tanggal_perkawinan || '-';
}

export function getCitizenParents(citizen: Pick<Citizen, 'nama_ayah' | 'nama_ibu'>) {
  return { ayah: citizen.nama_ayah || '-', ibu: citizen.nama_ibu || '-' };
}
