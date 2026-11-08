'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { QuickActionBar } from '@/components/QuickActionBar';
import { NoteModal } from '@/components/NoteModal';
import { AddKKModal } from '@/components/AddKKModal';
import { Citizen, Family } from '@/lib/types';
import { BANTARSARI_TERRITORY } from '@/lib/territory';
import { calculateCitizenAge, getFamilyHouseNumber } from '@/lib/dataUtils';
import {
  FileSpreadsheet,
  Users,
  Home,
  MessageSquareWarning,
  ArrowUpRight,
  TrendingUp,
  HeartHandshake,
  Clock,
  MapPin,
  Building2,
} from 'lucide-react';

const AGE_CATEGORIES = [
  { key: 'under3', label: '< 3 Thn', matches: (age: number) => age < 3 },
  { key: '3to6', label: '3 - 6 Thn', matches: (age: number) => age >= 3 && age <= 6 },
  { key: '7to12', label: '7 - 12 Thn', matches: (age: number) => age >= 7 && age <= 12 },
  { key: '13to15', label: '13 - 15 Thn', matches: (age: number) => age >= 13 && age <= 15 },
  { key: '16to18', label: '16 - 18 Thn', matches: (age: number) => age >= 16 && age <= 18 },
  { key: '19to59', label: '19 - 59 Thn', matches: (age: number) => age >= 19 && age <= 59 },
  { key: 'over59', label: '> 59 Thn', matches: (age: number) => age >= 60 },
] as const;

function summarizeCitizensByAge(citizens: Citizen[]) {
  return AGE_CATEGORIES.map((category) => {
    const matchingCitizens = citizens.filter((citizen) => category.matches(calculateCitizenAge(citizen.tanggal_lahir)));
    const lakiLaki = matchingCitizens.filter((citizen) => citizen.jenis_kelamin === 'L').length;
    const perempuan = matchingCitizens.filter((citizen) => citizen.jenis_kelamin === 'P').length;
    return { lakiLaki, perempuan, total: lakiLaki + perempuan };
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    currentProfile,
    villageConfig,
    visibleFamilies,
    visibleCitizens,
    visibleNotes,
    stats,
  } = useApp();

  const [selectedFamilyForNote, setSelectedFamilyForNote] =
    useState<Family | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isAddKKModalOpen, setIsAddKKModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState('all');

  const isAdmin = currentProfile?.role === 'admin';
  const accessibleTerritories = useMemo(
    () => BANTARSARI_TERRITORY.flatMap((dusun) =>
      dusun.rws.flatMap((rw) =>
        rw.rts.map((rt) => ({ dusun: dusun.dusun, rw: rw.rw, rt: rt.rt }))
      )
    ).filter((territory) => {
      if (currentProfile?.role === 'admin') return true;
      if (currentProfile?.role === 'kadus') return territory.dusun === currentProfile.assigned_dusun;
      if (currentProfile?.role === 'rw') {
        return territory.dusun === currentProfile.assigned_dusun && territory.rw === currentProfile.assigned_rw;
      }
      if (currentProfile?.role === 'rt') {
        return territory.dusun === currentProfile.assigned_dusun &&
          territory.rw === currentProfile.assigned_rw && territory.rt === currentProfile.assigned_rt;
      }
      return false;
    }),
    [currentProfile]
  );
  const accessibleDusun = Array.from(new Set(accessibleTerritories.map((territory) => territory.dusun)));
  const accessibleRws = Array.from(new Map(accessibleTerritories
    .map((territory) => [`${territory.dusun}|${territory.rw}`, territory] as const)).values());
  const accessibleRts = Array.from(new Map(accessibleTerritories
    .map((territory) => [`${territory.dusun}|${territory.rw}|${territory.rt}`, territory] as const)).values());
  const areaOptionValues = new Set([
    ...accessibleDusun.map((dusun) => `dusun|${dusun}`),
    ...accessibleRws.map((territory) => `rw|${territory.dusun}|${territory.rw}`),
    ...accessibleRts.map((territory) => `rt|${territory.dusun}|${territory.rw}|${territory.rt}`),
  ]);
  const activeArea = selectedArea === 'all' || areaOptionValues.has(selectedArea)
    ? selectedArea
    : 'all';
  const activeAreaParts = activeArea.split('|');
  const activeDusun = activeArea === 'all' ? 'all' : activeAreaParts[1];
  const activeRw = activeAreaParts[0] === 'rw' || activeAreaParts[0] === 'rt'
    ? activeAreaParts[2]
    : 'all';
  const activeRt = activeAreaParts[0] === 'rt'
    ? `${activeAreaParts[2]}|${activeAreaParts[3]}`
    : 'all';

  const handleOpenNote = (family?: Family) => {
    setSelectedFamilyForNote(family || null);
    setIsNoteModalOpen(true);
  };

  const familiesInSelectedRegion = visibleFamilies.filter((family) =>
    (activeDusun === 'all' || family.dusun === activeDusun) &&
    (activeRw === 'all' || family.rw === activeRw) &&
    (activeRt === 'all' || `${family.rw}|${family.rt}` === activeRt)
  );
  const selectedFamilyIds = new Set(familiesInSelectedRegion.map((family) => family.id));
  const citizensInSelectedRegion = visibleCitizens.filter((citizen) =>
    selectedFamilyIds.has(citizen.family_id)
  );
  const selectedCitizenIds = new Set(citizensInSelectedRegion.map((citizen) => citizen.id));
  const notesInSelectedRegion = visibleNotes.filter((note) => {
    if (note.family_id) return selectedFamilyIds.has(note.family_id);
    if (note.citizen_id) return selectedCitizenIds.has(note.citizen_id);
    return (activeDusun === 'all' || note.dusun === activeDusun) &&
      (activeRw === 'all' || note.rw === activeRw) &&
      (activeRt === 'all' || `${note.rw}|${note.rt}` === activeRt);
  });
  const pendingNotes = notesInSelectedRegion.filter((note) => note.status === 'pending');
  const kkBarcodeCount = familiesInSelectedRegion.filter((f) => f.status_barcode).length;
  const uniqueSelectedHouses = new Set(familiesInSelectedRegion.map((family) =>
    `${family.dusun}|${family.rw}|${family.rt}|${getFamilyHouseNumber(family)}`
  ));
  const plnMeteranCount = familiesInSelectedRegion.filter(
    (f) => f.penerangan === 'meteran'
  ).length;
  const mckSendiriCount = familiesInSelectedRegion.filter(
    (f) => f.fasilitas_mck === 'sendiri'
  ).length;
  const selectedNoteCount = pendingNotes.length;
  const selectedLakiLaki = citizensInSelectedRegion.filter(
    (citizen) => citizen.jenis_kelamin === 'L'
  ).length;
  const selectedPerempuan = citizensInSelectedRegion.filter(
    (citizen) => citizen.jenis_kelamin === 'P'
  ).length;

  const territorySummary = useMemo(() => {
    const territories = BANTARSARI_TERRITORY.flatMap((dusun) =>
      dusun.rws.flatMap((rw) =>
        rw.rts.map((rt) => ({ dusun: dusun.dusun, rw: rw.rw, ...rt }))
      )
    ).filter((territory) => {
      if (activeDusun !== 'all' && territory.dusun !== activeDusun) return false;
      if (activeRw !== 'all' && territory.rw !== activeRw) return false;
      if (activeRt !== 'all' && `${territory.rw}|${territory.rt}` !== activeRt) return false;
      if (currentProfile?.role === 'kadus') return territory.dusun === currentProfile.assigned_dusun;
      if (currentProfile?.role === 'rw') {
        return territory.dusun === currentProfile.assigned_dusun && territory.rw === currentProfile.assigned_rw;
      }
      if (currentProfile?.role === 'rt') {
        return territory.dusun === currentProfile.assigned_dusun &&
          territory.rw === currentProfile.assigned_rw && territory.rt === currentProfile.assigned_rt;
      }
      return currentProfile?.role === 'admin';
    });

    const rows = territories.map((territory) => {
      const families = visibleFamilies.filter((family) =>
        family.dusun === territory.dusun && family.rw === territory.rw && family.rt === territory.rt
      );
      const familyIds = new Set(families.map((family) => family.id));
      const citizens = visibleCitizens.filter((citizen) => familyIds.has(citizen.family_id));
      return {
        ...territory,
        rumah: new Set(families.map((family) => getFamilyHouseNumber(family))).size,
        kk: families.length,
        lakiLaki: citizens.filter((citizen) => citizen.jenis_kelamin === 'L').length,
        perempuan: citizens.filter((citizen) => citizen.jenis_kelamin === 'P').length,
        warga: citizens.length,
        usia: summarizeCitizensByAge(citizens),
      };
    });

    return rows.reduce(
      (summary, row) => ({
        rows,
        rumah: summary.rumah + row.rumah,
        kk: summary.kk + row.kk,
        warga: summary.warga + row.warga,
        lakiLaki: summary.lakiLaki + row.lakiLaki,
        perempuan: summary.perempuan + row.perempuan,
      }),
      { rows, rumah: 0, kk: 0, warga: 0, lakiLaki: 0, perempuan: 0 }
    );
  }, [activeDusun, activeRw, activeRt, currentProfile, visibleFamilies, visibleCitizens]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ===================================================================== */}
      {/* FIXED TOP HEAD BAR (Identitas Desa & Wilayah Otoritas - Biru Muda)    */}
      {/* ===================================================================== */}
      <div className="flex-shrink-0 px-3.5 sm:px-5 md:px-8 xl:px-10 pt-2.5 pb-2 bg-slate-50 border-b border-slate-200/80 z-10">
        <div className="bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-300 rounded-xl p-3 text-slate-950 shadow-sm flex items-center justify-between gap-2.5">
          <div className="w-12 h-12 rounded-xl bg-white/70 border border-white flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <Building2 className="w-6 h-6 text-sky-700" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-950 mt-0.5 leading-snug break-words">
              {currentProfile?.role === 'admin' &&
                'PEMERINTAH DESA BANTARSARI'}
              {currentProfile?.role === 'kadus' &&
                `Wilayah ${currentProfile.assigned_dusun} - ${villageConfig.nama_desa}`}
              {currentProfile?.role === 'rw' &&
                `Wilayah RW ${currentProfile.assigned_rw} (${currentProfile.assigned_dusun})`}
              {currentProfile?.role === 'rt' &&
                `Wilayah RT ${currentProfile.assigned_rt} / RW ${currentProfile.assigned_rw}`}
            </h2>
            {currentProfile?.role === 'admin' && (
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 mt-0.5 leading-snug break-words">
                {villageConfig.kepala_desa || 'Nama Kepala Desa'}
              </p>
            )}
            <p className="text-[10px] text-slate-800 mt-0.5 flex items-center gap-1 break-words">
              <MapPin className="w-2.5 h-2.5 text-slate-800 flex-shrink-0" />
              <span>{villageConfig.alamat_desa}</span>
            </p>
          </div>

          <div className="px-2.5 py-1.5 rounded-lg bg-white/60 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-slate-950 font-black text-xs border border-white/80">
            {currentProfile?.role === 'kadus'
              ? 'DUSUN'
              : currentProfile?.role?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SCROLLABLE PAGE CONTENT (Hanya isi halaman yang ikut scrolling)       */}
      {/* ===================================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 sm:px-5 md:px-8 xl:px-10 py-3 pb-20 space-y-3.5">
        {/* 1. DASHBOARD CARDS (SATU KOLOM, REAL-TIME DATABASE) */}
        <div>
          <div className="flex flex-col gap-1.5 mb-2 px-0.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
              Ringkasan Statistik Wilayah
            </span>
            <div className="grid w-full grid-cols-1 gap-1.5 sm:w-[260px]">
              <span className="text-right text-[10px] text-emerald-600 font-bold whitespace-nowrap">
                ● Real-time Database
              </span>
              <select
                id="dashboard-area-filter"
                aria-label="Filter Wilayah Binaan"
                value={activeArea}
                onChange={(event) => setSelectedArea(event.target.value)}
                className="w-full min-w-0 rounded-md border border-sky-200 bg-white px-2 py-1.5 text-[9px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 sm:text-[10px]"
              >
                <option value="all">Semua Wilayah Binaan</option>
                {accessibleDusun.map((dusun) => (
                  <option key={dusun} value={`dusun|${dusun}`}>
                    {dusun}
                  </option>
                ))}
                {accessibleRws.map((territory) => (
                  <option key={`${territory.dusun}|${territory.rw}`} value={`rw|${territory.dusun}|${territory.rw}`}>
                    RW. {territory.rw}
                  </option>
                ))}
                {accessibleRts.map((territory) => {
                  const key = `rt|${territory.dusun}|${territory.rw}|${territory.rt}`;
                  return (
                    <option key={key} value={key}>
                      RT. {territory.rt} RW. {territory.rw}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
              {[
                {
                  title: 'Total Kepala Keluarga',
                  value: familiesInSelectedRegion.length,
                  subtitle: `${kkBarcodeCount} Barcode · ${familiesInSelectedRegion.length - kkBarcodeCount} Belum`,
                  icon: FileSpreadsheet,
                  iconClass: 'bg-sky-100 text-sky-600',
                  badge: 'Dukcapil',
                  onClick: undefined,
                },
                {
                  title: 'Total Penduduk',
                  value: citizensInSelectedRegion.length,
                  subtitle: `${selectedLakiLaki.toLocaleString('id-ID')} L · ${selectedPerempuan.toLocaleString('id-ID')} P`,
                  icon: Users,
                  iconClass: 'bg-sky-100 text-sky-600',
                  badge: undefined,
                  onClick: () => router.push('/warga'),
                },
                {
                  title: 'Jumlah Rumah',
                  value: uniqueSelectedHouses.size,
                  subtitle: `PLN: ${plnMeteranCount} · MCK: ${mckSendiriCount}`,
                  icon: Home,
                  iconClass: 'bg-emerald-100 text-emerald-600',
                  badge: undefined,
                  onClick: () => router.push('/kk'),
                },
                {
                  title: 'Catatan / Laporan',
                  value: selectedNoteCount,
                  subtitle: selectedNoteCount > 0 ? 'Menunggu Verifikasi' : 'Semua Tervalidasi',
                  icon: MessageSquareWarning,
                  iconClass: 'bg-amber-100 text-amber-600',
                  badge: selectedNoteCount > 0 ? `${selectedNoteCount} Baru` : undefined,
                  onClick: () => router.push('/catatan'),
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={item.onClick}
                    disabled={!item.onClick}
                    className="group flex min-h-[82px] w-full items-center gap-2 p-2 text-left transition-colors hover:bg-slate-50/80 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 disabled:cursor-default disabled:opacity-100 sm:min-h-[104px] sm:flex-col sm:items-stretch sm:justify-between sm:gap-0 sm:p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2 sm:w-full sm:items-start sm:justify-between sm:gap-1.5">
                      <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${item.iconClass}`}>
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <p className="min-w-0 flex-1 text-[9px] font-bold leading-tight text-slate-700 sm:hidden">
                        {item.title}
                      </p>
                      {item.badge && (
                        <span className="hidden rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[8px] font-bold leading-tight text-rose-700 sm:inline">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 sm:mt-2 sm:flex-none">
                      <p className="hidden min-h-[28px] text-[10px] font-bold leading-snug text-slate-700 sm:block">
                        {item.title}
                      </p>
                      <div className="flex items-center justify-between gap-1 sm:mt-1 sm:items-end">
                        <div className="min-w-0">
                          <p className="text-base font-extrabold leading-none tracking-tight text-slate-900 tabular-nums sm:text-xl">
                            {item.value.toLocaleString('id-ID')}
                          </p>
                          <p className="mt-0.5 truncate text-[8px] font-medium leading-tight text-slate-500 sm:mt-1 sm:text-[9px]" title={item.subtitle}>
                            {item.subtitle}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {item.badge && <span className="rounded-full border border-rose-200 bg-rose-50 px-1 py-0.5 text-[7px] font-bold leading-tight text-rose-700 sm:hidden">{item.badge}</span>}
                          {item.onClick && <ArrowUpRight className="hidden h-3.5 w-3.5 flex-shrink-0 text-slate-400 group-hover:text-sky-600 sm:block" />}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-3 py-2">
              <h3 className="text-xs font-bold text-slate-800">Ringkasan per RT</h3>
              <p className="mt-0.5 text-[10px] text-slate-500">Jumlah rumah dihitung dari nomor rumah unik; data mengikuti wilayah akun Anda.</p>
            </div>
            <div className="max-h-72 lg:max-h-[420px] overflow-auto overscroll-contain">
              <table className="w-full min-w-[1660px] table-fixed border-collapse text-[11px]">
                <colgroup>
                  <col className="w-9" />
                  <col className="w-[190px]" />
                  <col className="w-16" />
                  <col className="w-[92px]" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  {AGE_CATEGORIES.flatMap((category) => [
                    <col key={`${category.key}-male`} className="w-12" />,
                    <col key={`${category.key}-female`} className="w-12" />,
                    <col key={`${category.key}-total`} className="w-12" />,
                  ])}
                </colgroup>
                <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th rowSpan={2} className="border-b border-slate-200 px-2 py-2 text-center">No</th>
                    <th rowSpan={2} className="border-b border-slate-200 px-2 py-2 text-left">Alamat</th>
                    <th rowSpan={2} className="whitespace-normal break-words border-b border-slate-200 px-1.5 py-2 text-center leading-tight">Jumlah Rumah</th>
                    <th rowSpan={2} className="whitespace-normal break-words border-b border-slate-200 px-1.5 py-2 text-center leading-tight">Kepala Keluarga</th>
                    <th colSpan={3} className="border-b border-slate-200 px-2 py-1 text-center">Jumlah Warga</th>
                    {AGE_CATEGORIES.map((category) => (
                      <th key={category.key} colSpan={3} className="border-b border-slate-200 px-1 py-1 text-center">{category.label}</th>
                    ))}
                  </tr>
                  <tr>
                    {Array.from({ length: AGE_CATEGORIES.length + 1 }, (_, index) => (
                      <React.Fragment key={index}>
                        <th className="whitespace-nowrap border-b border-slate-200 px-1 py-1 text-center">LK</th>
                        <th className="whitespace-nowrap border-b border-slate-200 px-1 py-1 text-center">PR</th>
                        <th className="whitespace-nowrap border-b border-slate-200 px-1 py-1 text-center">JML</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {territorySummary.rows.map((row, index) => (
                    <tr key={`${row.dusun}-${row.rw}-${row.rt}`} className="even:bg-slate-50/60">
                      <td className="px-2 py-1.5 text-center text-slate-400">{index + 1}</td>
                      <td className="px-2 py-1.5 font-medium text-slate-700">{row.alamat} RT. {row.rt} RW. {row.rw}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.rumah.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.kk.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.lakiLaki.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.perempuan.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.warga.toLocaleString('id-ID')}</td>
                      {row.usia.flatMap((ageGroup, groupIndex) => [
                        <td key={`${AGE_CATEGORIES[groupIndex].key}-male`} className="px-1.5 py-1.5 text-right tabular-nums">{ageGroup.lakiLaki.toLocaleString('id-ID')}</td>,
                        <td key={`${AGE_CATEGORIES[groupIndex].key}-female`} className="px-1.5 py-1.5 text-right tabular-nums">{ageGroup.perempuan.toLocaleString('id-ID')}</td>,
                        <td key={`${AGE_CATEGORIES[groupIndex].key}-total`} className="px-1.5 py-1.5 text-right tabular-nums">{ageGroup.total.toLocaleString('id-ID')}</td>,
                      ])}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-sky-50 font-extrabold text-slate-800">
                  <tr>
                    <td colSpan={2} className="whitespace-normal break-words border-t border-sky-100 px-2 py-2 leading-tight">TOTAL KESELURUHAN</td>
                    <td className="border-t border-sky-100 px-2 py-2 text-right tabular-nums">{territorySummary.rumah.toLocaleString('id-ID')}</td>
                    <td className="border-t border-sky-100 px-2 py-2 text-right tabular-nums">{territorySummary.kk.toLocaleString('id-ID')}</td>
                    <td className="border-t border-sky-100 px-2 py-2 text-right tabular-nums">{territorySummary.lakiLaki.toLocaleString('id-ID')}</td>
                    <td className="border-t border-sky-100 px-2 py-2 text-right tabular-nums">{territorySummary.perempuan.toLocaleString('id-ID')}</td>
                    <td className="border-t border-sky-100 px-2 py-2 text-right tabular-nums">{territorySummary.warga.toLocaleString('id-ID')}</td>
                    {AGE_CATEGORIES.map((_, groupIndex) => {
                      const totals = territorySummary.rows.reduce(
                        (total, row) => ({
                          lakiLaki: total.lakiLaki + row.usia[groupIndex].lakiLaki,
                          perempuan: total.perempuan + row.usia[groupIndex].perempuan,
                          jumlah: total.jumlah + row.usia[groupIndex].total,
                        }),
                        { lakiLaki: 0, perempuan: 0, jumlah: 0 }
                      );
                      return (
                        <React.Fragment key={AGE_CATEGORIES[groupIndex].key}>
                          <td className="border-t border-sky-100 px-1.5 py-2 text-right tabular-nums">{totals.lakiLaki.toLocaleString('id-ID')}</td>
                          <td className="border-t border-sky-100 px-1.5 py-2 text-right tabular-nums">{totals.perempuan.toLocaleString('id-ID')}</td>
                          <td className="border-t border-sky-100 px-1.5 py-2 text-right tabular-nums">{totals.jumlah.toLocaleString('id-ID')}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* 2. QUICK ACTION BAR */}
        <QuickActionBar
          onOpenNoteModal={() => handleOpenNote()}
          isAdmin={isAdmin}
          onOpenAddKKModal={() => setIsAddKKModalOpen(true)}
        />

        {/* 3. METRIK SOSIAL, USIA & KESEJAHTERAAN (100% REAL-TIME BREAKDOWN) */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <HeartHandshake className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-800">
                Demografi, Jaminan Kesehatan & Bansos
              </span>
            </div>
            <span className="text-[10px] text-sky-600 font-bold">
              Wajib KTP: {stats.wajibKtp} • Lansia: {stats.lansia}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="block text-[10px] font-semibold text-emerald-800">
                BPJS KIS / PBI
              </span>
              <span className="text-sm font-extrabold text-emerald-700">
                {stats.bpjsKis.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-sky-50 border border-sky-100">
              <span className="block text-[10px] font-semibold text-sky-800">
                BPJS Mandiri
              </span>
              <span className="text-sm font-extrabold text-sky-700">
                {stats.bpjsMandiri.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="block text-[10px] font-semibold text-slate-600">
                Disabilitas / TKI
              </span>
              <span className="text-sm font-extrabold text-slate-700">
                {stats.disabilitas} / {stats.tki}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600 flex-wrap gap-1">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px]">
                BPNT: {stats.bansosBpnt} KK
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                PKH: {stats.bansosPkh} KK
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                KIP: {stats.bansosKip} KK
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                BLT: {stats.bansosBlt} KK
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              Tanpa BPJS: {stats.bpjsNone} Jiwa
            </span>
          </div>
        </div>

        {/* 5. CATATAN & LAPORAN TERAKHIR */}
        {pendingNotes.length > 0 && (
          <div className="bg-amber-50/90 rounded-xl p-3.5 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">
                  Catatan Wilayah Butuh Verifikasi ({pendingNotes.length})
                </span>
              </div>
              <Link
                href="/catatan"
                className="text-[11px] font-bold text-amber-800 hover:underline"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-1.5">
              {pendingNotes.slice(0, 2).map((n) => (
                <div
                  key={n.id}
                  className="p-2 rounded-lg bg-white border border-amber-200 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span className="font-bold text-slate-700">
                      {n.citizen_name
                        ? `Warga: ${n.citizen_name}`
                        : `KK: ${n.family_no_kk || '-'}`}
                    </span>
                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                      RT {n.rt} / RW {n.rw}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs leading-snug break-words">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        initialFamily={selectedFamilyForNote}
      />

      {isAdmin && (
        <AddKKModal
          isOpen={isAddKKModalOpen}
          onClose={() => setIsAddKKModalOpen(false)}
        />
      )}
    </div>
  );
}
