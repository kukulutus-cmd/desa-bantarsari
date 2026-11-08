export interface RtTerritory { rt: string; alamat: string }
export interface RwTerritory { rw: string; rts: RtTerritory[] }
export interface DusunTerritory { dusun: string; alamat: string; rws: RwTerritory[] }

export const BANTARSARI_TERRITORY: DusunTerritory[] = [
  {
    dusun: 'Belum diatur',
    alamat: 'Belum diatur',
    rws: [{ rw: '000', rts: [{ rt: '000', alamat: 'Belum diatur' }] }],
  },
];

export const DUSUN_NAMES = BANTARSARI_TERRITORY.map((item) => item.dusun);
export const ALL_RW_TERRITORIES = BANTARSARI_TERRITORY.flatMap((dusun) =>
  dusun.rws.map((rw) => ({ dusun: dusun.dusun, alamat: dusun.alamat, ...rw }))
);
export function getRwTerritoriesForDusun(dusun: string) {
  return ALL_RW_TERRITORIES.filter((item) => item.dusun === dusun);
}
export function getRtTerritoriesForRw(rw: string) {
  return ALL_RW_TERRITORIES.find((item) => item.rw === rw)?.rts ?? [];
}
export function getDusunForRw(rw: string) {
  return ALL_RW_TERRITORIES.find((item) => item.rw === rw)?.dusun ?? DUSUN_NAMES[0];
}
export function getAddressForTerritory(dusun: string, rw: string, rt: string) {
  return ALL_RW_TERRITORIES.find((item) => item.dusun === dusun && item.rw === rw)?.rts
    .find((item) => item.rt === rt)?.alamat ?? 'Belum diatur';
}
