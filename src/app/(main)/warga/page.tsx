'use client';

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context';
import { Citizen, MaritalStatus } from '@/lib/types';
import {
  getCitizenMaritalStatus,
  getFamilyHouseNumber,
  calculateCitizenAge,
  getCitizenBloodType,
  getCitizenMarriageDate,
  getCitizenParents,
} from '@/lib/dataUtils';
import { NoteModal } from '@/components/NoteModal';
import { CitizenFormModal } from '@/components/CitizenFormModal';
import {
  Users,
  Search,
  Briefcase,
  MessageSquarePlus,
  FileText,
  Home,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  X,
  ExternalLink,
  UserPlus,
  Edit3,
  Trash2,
} from 'lucide-react';

function WargaListContent() {
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    visibleCitizens,
    visibleFamilies,
    getFamilyById,
    currentProfile,
    deleteCitizen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [maritalFilter, setMaritalFilter] = useState<'all' | MaritalStatus>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | 'ktp' | 'lansia' | 'anak'>('all');
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [houseFilter, setHouseFilter] = useState<string>('all');

  // Pagination & Display settings (default 15 rows for compact table)
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [selectedCitizenForNote, setSelectedCitizenForNote] = useState<Citizen | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedCitizenForDetail, setSelectedCitizenForDetail] = useState<Citizen | null>(null);
  const [isCitizenFormOpen, setIsCitizenFormOpen] = useState(false);
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null);

  // Copied NIK feedback
  const [copiedNik, setCopiedNik] = useState<string | null>(null);

  const isAdmin = currentProfile?.role === 'admin';

  // Sync URL query params (?focus=search, ?age=ktp, ?age=lansia, ?kk=...)
  useEffect(() => {
    const focusParam = searchParams.get('focus');
    const ageParam = searchParams.get('age');
    const kkParam = searchParams.get('kk');

    if (focusParam === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    if (ageParam === 'ktp' || ageParam === 'lansia' || ageParam === 'anak') {
      setAgeFilter(ageParam);
    }
    if (kkParam) {
      setFamilyFilter(kkParam);
    }
  }, [searchParams]);

  const handleCopyNik = (nik: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(nik);
      setCopiedNik(nik);
      setTimeout(() => setCopiedNik(null), 1800);
    }
  };

  // Available unique house numbers within visible scope
  const availableHouseNumbers = useMemo(() => {
    const set = new Set<string>();
    visibleFamilies.forEach((f) => {
      const num = getFamilyHouseNumber(f);
      if (num && num !== '-') set.add(num);
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [visibleFamilies]);

  // Filter logic
  const filteredCitizens = useMemo(() => {
    return visibleCitizens.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const family = getFamilyById(c.family_id);
      const parents = getCitizenParents(c);
      const matchSearch =
        !q ||
        c.nik.toLowerCase().includes(q) ||
        c.nama_lengkap.toLowerCase().includes(q) ||
        c.pekerjaan.toLowerCase().includes(q) ||
        parents.ayah.toLowerCase().includes(q) ||
        parents.ibu.toLowerCase().includes(q) ||
        (family?.no_kk || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      const maritalStatus = getCitizenMaritalStatus(c);
      const houseNumber = getFamilyHouseNumber(family);
      const age = calculateCitizenAge(c.tanggal_lahir);

      if (maritalFilter !== 'all' && maritalStatus !== maritalFilter) {
        return false;
      }

      if (ageFilter === 'ktp' && age < 17) return false;
      if (ageFilter === 'lansia' && age < 60) return false;
      if (ageFilter === 'anak' && age >= 17) return false;

      if (familyFilter !== 'all' && c.family_id !== familyFilter) {
        return false;
      }

      if (houseFilter !== 'all' && houseNumber !== houseFilter) {
        return false;
      }

      return true;
    });
  }, [visibleCitizens, searchQuery, maritalFilter, ageFilter, familyFilter, houseFilter, getFamilyById]);

  // Pagination calculation
  const totalItems = filteredCitizens.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const safePage = Math.min(Math.max(currentPage, 1), totalPages || 1);

  const paginatedCitizens = useMemo(() => {
    if (pageSize === 0) return filteredCitizens;
    const startIndex = (safePage - 1) * pageSize;
    return filteredCitizens.slice(startIndex, startIndex + pageSize);
  }, [filteredCitizens, safePage, pageSize]);

  const isAnyFilterActive =
    maritalFilter !== 'all' ||
    ageFilter !== 'all' ||
    familyFilter !== 'all' ||
    houseFilter !== 'all' ||
    searchQuery !== '';

  const handleResetFilters = () => {
    setMaritalFilter('all');
    setAgeFilter('all');
    setFamilyFilter('all');
    setHouseFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const getMaritalBadgeStyle = (status: MaritalStatus) => {
    switch (status) {
      case 'Kawin':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Belum Kawin':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Cerai Hidup':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cerai Mati':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getBpjsBadgeStyle = (bpjs: string) => {
    switch (bpjs) {
      case 'kis':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'mandiri':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ===================================================================== */}
      {/* FIXED TOP HEAD BAR (Tidak ikut scrolling, ringkas & hemat ruang)      */}
      {/* ===================================================================== */}
      <div className="flex-shrink-0 px-3 sm:px-5 md:px-8 xl:px-10 pt-2.5 pb-2 bg-slate-50 border-b border-slate-200/80 z-10 space-y-2">
        {/* Row 1: Title, Summary Counts & Add Citizen Button */}
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center flex-wrap gap-1.5 min-w-0">
            <Users className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
              Tabel Data Warga
            </h1>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                {filteredCitizens.length}/{visibleCitizens.length} Jiwa
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                {visibleCitizens.filter((c) => c.jenis_kelamin === 'L').length} L
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                {visibleCitizens.filter((c) => c.jenis_kelamin === 'P').length} P
              </span>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setEditingCitizen(null);
                setIsCitizenFormOpen(true);
              }}
              className="inline-flex items-center text-[11px] font-bold bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1 rounded-lg shadow-sm transition-all active:scale-95 flex-shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              <span>+ Warga</span>
            </button>
          )}
        </div>

        {/* Row 2: Search Input + Reset */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari NIK, Nama, No KK, Pekerjaan..."
              className="w-full pl-7 pr-6 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-1 focus:ring-sky-500 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-slate-400 hover:text-slate-600 absolute right-2 top-1.5 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-sky-600 hover:bg-blue-100 border border-blue-200 font-bold flex items-center gap-1 text-[11px] flex-shrink-0"
              title="Reset Semua Filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Row 3: Precision 2x2 Mobile / 4x1 Desktop Filter Dropdowns (No cut-off text) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <select
            value={maritalFilter}
            onChange={(e) => {
              setMaritalFilter(e.target.value as 'all' | MaritalStatus);
              setCurrentPage(1);
            }}
            className="w-full py-1.5 px-2 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium outline-none focus:ring-1 focus:ring-sky-500"
            title="Filter Status Perkawinan"
          >
            <option value="all">Semua Status</option>
            <option value="Kawin">Kawin</option>
            <option value="Belum Kawin">Belum Kawin</option>
            <option value="Cerai Hidup">Cerai Hidup</option>
            <option value="Cerai Mati">Cerai Mati</option>
          </select>

          <select
            value={ageFilter}
            onChange={(e) => {
              setAgeFilter(e.target.value as 'all' | 'ktp' | 'lansia' | 'anak');
              setCurrentPage(1);
            }}
            className="w-full py-1.5 px-2 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium outline-none focus:ring-1 focus:ring-sky-500"
            title="Filter Kategori Usia"
          >
            <option value="all">Semua Usia</option>
            <option value="ktp">Wajib KTP (17+)</option>
            <option value="lansia">Lansia (60+)</option>
            <option value="anak">Anak (&lt;17)</option>
          </select>

          <select
            value={familyFilter}
            onChange={(e) => {
              setFamilyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-1.5 px-2 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium outline-none focus:ring-1 focus:ring-sky-500"
            title="Filter Kartu Keluarga"
          >
            <option value="all">Semua KK ({visibleFamilies.length})</option>
            {visibleFamilies.map((f) => (
              <option key={f.id} value={f.id}>
                {f.kepala_keluarga} ({f.no_kk.slice(-4)})
              </option>
            ))}
          </select>

          <select
            value={houseFilter}
            onChange={(e) => {
              setHouseFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-1.5 px-2 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium outline-none focus:ring-1 focus:ring-sky-500"
            title="Filter Nomor Rumah"
          >
            <option value="all">Semua Rumah</option>
            {availableHouseNumbers.map((no) => (
              <option key={no} value={no}>
                Rumah No. {no}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FULL-HEIGHT SCROLLABLE DATA TABLE AREA (Hanya isi tabel yang scroll)  */}
      {/* ===================================================================== */}
      <div className="flex-1 min-h-0 px-3.5 sm:px-5 md:px-8 xl:px-10 py-2.5 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Table Scroll Wrapper */}
          <div className="flex-1 min-h-0 overflow-auto overscroll-contain">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider shadow-[0_1px_0_rgba(226,232,240,1)]">
                <tr>
                  <th className="py-2 px-2.5 text-center w-9 whitespace-nowrap">No</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Rumah & Wilayah</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">NIK</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">No. KK & Kepala</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Nama Lengkap</th>
                  <th className="py-2 px-2 text-center whitespace-nowrap">L/P</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Hubungan</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Usia / Tgl Lahir</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Status & Tgl Kawin</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Nama Orang Tua (Ayah & Ibu)</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Pekerjaan</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Alamat</th>
                  <th className="py-2 px-2 text-center whitespace-nowrap">BPJS</th>
                  <th className="py-2 px-2 text-center whitespace-nowrap">Gol. Darah</th>
                  <th className="py-2 px-2.5 text-center whitespace-nowrap sm:sticky sm:right-0 bg-slate-100 sm:shadow-[-1px_0_0_rgba(226,232,240,1)]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCitizens.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 px-4 text-center">
                      <Users className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">Warga tidak ditemukan</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tidak ada data warga yang cocok dengan filter atau pencarian Anda.
                      </p>
                      {isAnyFilterActive && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1 bg-sky-500 text-white rounded-lg text-[11px] font-semibold hover:bg-sky-600"
                        >
                          Reset Filter
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedCitizens.map((citizen, idx) => {
                    const family = getFamilyById(citizen.family_id);
                    const age = calculateCitizenAge(citizen.tanggal_lahir);
                    const maritalStatus = getCitizenMaritalStatus(citizen);
                    const marriageDate = getCitizenMarriageDate(citizen);
                    const bloodType = getCitizenBloodType(citizen);
                    const parents = getCitizenParents(citizen);
                    const houseNumber = getFamilyHouseNumber(family);
                    const rowNumber = pageSize === 0 ? idx + 1 : (safePage - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={citizen.id}
                        onClick={() => setSelectedCitizenForDetail(citizen)}
                        className="even:bg-slate-50/50 hover:bg-blue-50/60 cursor-pointer transition-colors group"
                      >
                        {/* 1. No */}
                        <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          {rowNumber}
                        </td>

                        {/* 2. Rumah & Wilayah */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-700">
                          <span className="font-semibold text-slate-800">No.{houseNumber}</span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            • RT {family?.rt || '-'}/{family?.rw || '-'} ({family?.dusun || '-'})
                          </span>
                        </td>

                        {/* 2. NIK */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-slate-800 tracking-tight">
                              {citizen.nik}
                            </span>
                            <button
                              onClick={(e) => handleCopyNik(citizen.nik, e)}
                              className="p-0.5 text-slate-400 hover:text-sky-600 rounded"
                              title="Salin NIK"
                            >
                              {copiedNik === citizen.nik ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 3. Kartu Keluarga */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          {family ? (
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/kk/${family.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-mono text-[10px] font-bold text-sky-600 hover:underline inline-flex items-center gap-0.5"
                                title={`KK: ${family.kepala_keluarga}`}
                              >
                                <span>{family.no_kk}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                              <span className="text-[10px] text-slate-400">
                                ({family.kepala_keluarga})
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* 3. Nama Lengkap */}
                        <td className="py-1.5 px-2.5 font-bold text-slate-900 uppercase whitespace-nowrap">
                          {citizen.nama_lengkap}
                        </td>

                        {/* 4. L/P */}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                              citizen.jenis_kelamin === 'L'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {citizen.jenis_kelamin}
                          </span>
                        </td>

                        {/* 6. Hubungan */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <span className="text-[10px] font-semibold text-slate-700">
                            {citizen.hubungan_keluarga}
                          </span>
                        </td>

                        {/* 7. Usia & Tgl Lahir */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-700">
                          <span className="font-bold text-slate-900">{age} Thn</span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({citizen.tanggal_lahir})
                          </span>
                        </td>

                        {/* 8. Status & Tanggal Perkawinan */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span
                              className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${getMaritalBadgeStyle(
                                maritalStatus
                              )}`}
                            >
                              {maritalStatus}
                            </span>
                            {marriageDate !== '-' && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({marriageDate})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 9. Nama Orang Tua (Ayah & Ibu) */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-[10px] text-slate-700">
                          <span className="font-semibold text-slate-800">
                            Ayah: {parents.ayah}
                          </span>
                          <span className="text-slate-300 mx-1">•</span>
                          <span className="font-semibold text-slate-700">
                            Ibu: {parents.ibu}
                          </span>
                        </td>

                        {/* 10. Pekerjaan */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-700">
                          {citizen.pekerjaan}
                        </td>

                        {/* Alamat */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-700">
                          {family?.alamat || '-'}
                        </td>

                        {/* 11. BPJS */}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getBpjsBadgeStyle(
                              citizen.bpjs_kesehatan
                            )}`}
                          >
                            {citizen.bpjs_kesehatan}
                          </span>
                        </td>

                        {/* Golongan Darah */}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {bloodType}
                          </span>
                        </td>

                        {/* 12. Aksi */}
                        <td
                          className="py-1 px-2 text-center whitespace-nowrap sm:sticky sm:right-0 bg-white group-even:bg-slate-50 group-hover:bg-blue-50/90 sm:shadow-[-1px_0_0_rgba(241,245,249,1)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedCitizenForDetail(citizen)}
                              className="p-1 text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-800 rounded border border-slate-200 transition-colors"
                              title="Detail Warga"
                            >
                              <Eye className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCitizenForNote(citizen);
                                setIsNoteModalOpen(true);
                              }}
                              className="p-1 text-sky-600 hover:text-white bg-blue-50 hover:bg-sky-500 rounded border border-blue-200 transition-colors"
                              title="Kirim Catatan"
                            >
                              <MessageSquarePlus className="w-3 h-3" />
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingCitizen(citizen);
                                    setIsCitizenFormOpen(true);
                                  }}
                                  className="p-1 text-sky-600 hover:text-white bg-blue-50 hover:bg-sky-500 rounded border border-blue-200 transition-colors"
                                  title="Edit Warga"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus data warga ${citizen.nama_lengkap} (NIK: ${citizen.nik})?`)) {
                                      deleteCitizen(citizen.id);
                                    }
                                  }}
                                  className="p-1 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded border border-rose-200 transition-colors"
                                  title="Hapus Warga"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ================================================================= */}
          {/* FIXED TABLE FOOTER (Pagination & Row Size)                        */}
          {/* ================================================================= */}
          <div className="flex-shrink-0 px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Menampilkan{' '}
                <strong className="text-slate-900">
                  {totalItems === 0
                    ? 0
                    : pageSize === 0
                    ? `1 - ${totalItems}`
                    : `${(safePage - 1) * pageSize + 1} - ${Math.min(safePage * pageSize, totalItems)}`}
                </strong>{' '}
                dari <strong className="text-slate-900">{totalItems}</strong>
              </span>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-0.5 px-1.5 text-[10px] bg-white border border-slate-200 rounded font-semibold text-slate-700 outline-none"
                title="Baris per halaman"
              >
                <option value={15}>15 baris</option>
                <option value={25}>25 baris</option>
                <option value={50}>50 baris</option>
                <option value={0}>Semua</option>
              </select>
            </div>

            {pageSize !== 0 && totalPages > 1 && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safePage === 1}
                  className="p-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 font-bold text-[11px] text-slate-800">
                  {safePage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={safePage === totalPages}
                  className="p-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal for Citizen */}
      {selectedCitizenForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[88dvh] flex flex-col overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sky-500 to-cyan-500 p-4 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center font-bold text-base flex-shrink-0">
                  {selectedCitizenForDetail.jenis_kelamin === 'L' ? 'L' : 'P'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm break-words uppercase leading-snug">
                    {selectedCitizenForDetail.nama_lengkap}
                  </h3>
                  <p className="font-mono text-xs text-blue-100">
                    NIK: {selectedCitizenForDetail.nik}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCitizenForDetail(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  {selectedCitizenForDetail.hubungan_keluarga}
                </span>
                <span
                  className={`font-bold px-2.5 py-1 rounded-full border ${getMaritalBadgeStyle(
                    getCitizenMaritalStatus(selectedCitizenForDetail)
                  )}`}
                >
                  {getCitizenMaritalStatus(selectedCitizenForDetail)}
                </span>
                <span className="font-extrabold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Gol. Darah: {getCitizenBloodType(selectedCitizenForDetail)}
                </span>
                <span
                  className={`font-bold px-2.5 py-1 rounded-full border uppercase ${getBpjsBadgeStyle(
                    selectedCitizenForDetail.bpjs_kesehatan
                  )}`}
                >
                  BPJS: {selectedCitizenForDetail.bpjs_kesehatan}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  Identitas Pribadi & Orang Tua
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Tempat, Tanggal Lahir:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCitizenForDetail.tempat_lahir}, {selectedCitizenForDetail.tanggal_lahir}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Usia & Gol. Darah:</span>
                    <span className="font-semibold text-slate-800">
                      {calculateCitizenAge(selectedCitizenForDetail.tanggal_lahir)} Tahun • Gol.{' '}
                      {getCitizenBloodType(selectedCitizenForDetail)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Agama:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCitizenForDetail.agama}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Jenis Kelamin:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCitizenForDetail.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status Perkawinan:</span>
                    <span className="font-semibold text-slate-800">
                      {getCitizenMaritalStatus(selectedCitizenForDetail)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tanggal Perkawinan:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {getCitizenMarriageDate(selectedCitizenForDetail)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Nama Ayah Kandung:</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {getCitizenParents(selectedCitizenForDetail).ayah}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Nama Ibu Kandung:</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {getCitizenParents(selectedCitizenForDetail).ibu}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                  Pendidikan & Pekerjaan
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Pendidikan Terakhir:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCitizenForDetail.pendidikan_terakhir}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pekerjaan:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCitizenForDetail.pekerjaan}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status TKI / Migran:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCitizenForDetail.status_tki ? 'Ya (TKI Luar Negeri)' : 'Bukan TKI'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Disabilitas:</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selectedCitizenForDetail.disabilitas}
                    </span>
                  </div>
                </div>
              </div>

              {(() => {
                const fam = getFamilyById(selectedCitizenForDetail.family_id);
                return (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-emerald-600" />
                      Data Keluarga & Domisili
                    </h4>
                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <span className="text-slate-400">Nomor Kartu Keluarga: </span>
                        <span className="font-mono font-bold text-slate-800">
                          {fam?.no_kk || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Kepala Keluarga: </span>
                        <span className="font-bold text-slate-800">
                          {fam?.kepala_keluarga || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Alamat: </span>
                        <span className="font-medium text-slate-800">
                          {fam?.alamat || '-'} (Rumah No. {getFamilyHouseNumber(fam)})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Wilayah: </span>
                        <span className="font-semibold text-slate-800">
                          RT {fam?.rt || '-'}/RW {fam?.rw || '-'} • {fam?.dusun || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
              {(() => {
                const fam = getFamilyById(selectedCitizenForDetail.family_id);
                return fam ? (
                  <Link
                    href={`/kk/${fam.id}`}
                    className="inline-flex items-center text-xs font-bold text-slate-700 hover:text-sky-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1 text-sky-600" />
                    Buka Kartu Keluarga
                  </Link>
                ) : (
                  <span />
                );
              })()}

              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <button
                    onClick={() => {
                      const target = selectedCitizenForDetail;
                      setSelectedCitizenForDetail(null);
                      setEditingCitizen(target);
                      setIsCitizenFormOpen(true);
                    }}
                    className="inline-flex items-center text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-xl shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCitizenForNote(selectedCitizenForDetail);
                    setSelectedCitizenForDetail(null);
                    setIsNoteModalOpen(true);
                  }}
                  className="inline-flex items-center text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-xl shadow-sm"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 mr-1" />
                  Buat Catatan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setSelectedCitizenForNote(null);
        }}
        initialCitizen={selectedCitizenForNote}
        initialFamily={selectedCitizenForNote ? getFamilyById(selectedCitizenForNote.family_id) : null}
      />

      {/* Add / Edit Citizen Modal for Admin */}
      {isAdmin && (
        <CitizenFormModal
          isOpen={isCitizenFormOpen}
          onClose={() => {
            setIsCitizenFormOpen(false);
            setEditingCitizen(null);
          }}
          editCitizen={editingCitizen}
        />
      )}
    </div>
  );
}

export default function WargaListPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Memuat tabel data warga...
        </div>
      }
    >
      <WargaListContent />
    </Suspense>
  );
}
