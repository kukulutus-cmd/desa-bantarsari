'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context';
import { NoteModal } from '@/components/NoteModal';
import { AddKKModal } from '@/components/AddKKModal';
import { Family } from '@/lib/types';
import {
  getFamilyHouseNumber,
  calculateCitizenAge,
  getCitizenMaritalStatus,
  getCitizenBloodType,
  getCitizenMarriageDate,
  getCitizenParents,
} from '@/lib/dataUtils';
import {
  Search,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  QrCode,
  HeartHandshake,
  MapPin,
  Eye,
  MessageSquarePlus,
  Edit3,
  Trash2,
  X,
  Users,
  Zap,
  Droplet,
  CheckCircle2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

function KKListContent() {
  const searchParams = useSearchParams();
  const {
    visibleFamilies,
    getCitizensByFamilyId,
    currentProfile,
    deleteFamily,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'barcode' | 'non-barcode' | 'update' | 'bansos'
  >('all');
  const [rtFilter, setRtFilter] = useState<string>('all');

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [selectedFamilyForDetail, setSelectedFamilyForDetail] =
    useState<Family | null>(null);
  const [selectedFamilyForNote, setSelectedFamilyForNote] =
    useState<Family | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isAddKKModalOpen, setIsAddKKModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [copiedNoKK, setCopiedNoKK] = useState<string | null>(null);

  const isAdmin = currentProfile?.role === 'admin';

  // Sync URL query params (?filter=bansos, etc.)
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (
      filterParam === 'bansos' ||
      filterParam === 'barcode' ||
      filterParam === 'non-barcode' ||
      filterParam === 'update'
    ) {
      setActiveFilter(filterParam);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Keep detail modal synced if family data is edited
  const activeDetailFamily = useMemo(() => {
    if (!selectedFamilyForDetail) return null;
    return (
      visibleFamilies.find((f) => f.id === selectedFamilyForDetail.id) || null
    );
  }, [selectedFamilyForDetail, visibleFamilies]);

  // Available RTs within visible scope
  const availableRts = useMemo(() => {
    const set = new Set<string>();
    visibleFamilies.forEach((f) => set.add(f.rt));
    return Array.from(set).sort();
  }, [visibleFamilies]);

  // Filtered families based on search, status filter, and RT filter
  const filteredFamilies = useMemo(() => {
    return visibleFamilies.filter((fam) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        fam.no_kk.toLowerCase().includes(q) ||
        fam.kepala_keluarga.toLowerCase().includes(q) ||
        fam.alamat.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (activeFilter === 'barcode' && !fam.status_barcode) return false;
      if (activeFilter === 'non-barcode' && fam.status_barcode) return false;
      if (activeFilter === 'update' && fam.status_update) return false;
      if (activeFilter === 'bansos' && fam.bantuan_sosial === 'none')
        return false;

      if (rtFilter !== 'all' && fam.rt !== rtFilter) return false;

      return true;
    });
  }, [visibleFamilies, searchQuery, activeFilter, rtFilter]);

  // Pagination calculation
  const totalItems = filteredFamilies.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const safePage = Math.min(Math.max(currentPage, 1), totalPages || 1);

  const paginatedFamilies = useMemo(() => {
    if (pageSize === 0) return filteredFamilies;
    const startIndex = (safePage - 1) * pageSize;
    return filteredFamilies.slice(startIndex, startIndex + pageSize);
  }, [filteredFamilies, safePage, pageSize]);

  const isAnyFilterActive =
    searchQuery !== '' || activeFilter !== 'all' || rtFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setRtFilter('all');
    setCurrentPage(1);
  };

  const handleCopyNoKK = (noKK: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(noKK);
      setCopiedNoKK(noKK);
      setTimeout(() => setCopiedNoKK(null), 1800);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ===================================================================== */}
      {/* FIXED TOP HEAD BAR (Judul, Pencarian, & Filter - Tidak ikut scroll)   */}
      {/* ===================================================================== */}
      <div className="flex-shrink-0 px-3 sm:px-5 md:px-8 xl:px-10 pt-2.5 pb-2 bg-slate-50 border-b border-slate-200/80 z-10 space-y-2">
        {/* Title & Add KK */}
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center flex-wrap gap-1.5 min-w-0">
            <FileSpreadsheet className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
              Tabel Data KK
            </h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              {filteredFamilies.length}/{visibleFamilies.length} KK
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setEditingFamily(null);
                setIsAddKKModalOpen(true);
              }}
              className="inline-flex items-center text-[11px] font-bold bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1 rounded-lg shadow-sm transition-all active:scale-95 flex-shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>+ Tambah KK</span>
            </button>
          )}
        </div>

        {/* Search Input Box + Reset */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Nama Kepala Keluarga, No. KK, Alamat..."
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

        {/* Filter Pills + RT Sub-filter */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => {
              setActiveFilter('all');
              setCurrentPage(1);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
            }`}
          >
            Semua ({visibleFamilies.length})
          </button>

          <button
            onClick={() => {
              setActiveFilter('barcode');
              setCurrentPage(1);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 ${
              activeFilter === 'barcode'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
            }`}
          >
            <QrCode className="w-3 h-3" />
            <span>Barcode</span>
          </button>

          <button
            onClick={() => {
              setActiveFilter('non-barcode');
              setCurrentPage(1);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 ${
              activeFilter === 'non-barcode'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-rose-300'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Non-Barcode</span>
          </button>

          <button
            onClick={() => {
              setActiveFilter('update');
              setCurrentPage(1);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              activeFilter === 'update'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300'
            }`}
          >
            Perlu Update
          </button>

          <button
            onClick={() => {
              setActiveFilter('bansos');
              setCurrentPage(1);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 ${
              activeFilter === 'bansos'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
            }`}
          >
            <HeartHandshake className="w-3 h-3" />
            <span>KPM Bansos</span>
          </button>

          {availableRts.length > 1 && (
            <div className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <select
                value={rtFilter}
                onChange={(e) => {
                  setRtFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-1 px-2 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-700 outline-none"
              >
                <option value="all">Semua RT</option>
                {availableRts.map((rt) => (
                  <option key={rt} value={rt}>
                    RT {rt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FULL-HEIGHT SCROLLABLE TABLE AREA (Seperti Tabel Warga)               */}
      {/* ===================================================================== */}
      <div className="flex-1 min-h-0 px-3.5 sm:px-5 md:px-8 xl:px-10 py-2.5 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto overscroll-contain">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider shadow-[0_1px_0_rgba(226,232,240,1)]">
                <tr>
                  <th className="py-2 px-2.5 text-center w-9 whitespace-nowrap">
                    No
                  </th>
                  <th className="py-2 px-2.5 whitespace-nowrap">
                    Nama Kepala Keluarga
                  </th>
                  <th className="py-2 px-2.5 text-center whitespace-nowrap">
                    Anggota
                  </th>
                  <th className="py-2 px-2.5 whitespace-nowrap">No. KK</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">
                    Rumah & Wilayah
                  </th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Alamat</th>
                  <th className="py-2 px-2.5 text-center whitespace-nowrap">
                    Status KK
                  </th>
                  <th className="py-2 px-2.5 text-center whitespace-nowrap">
                    Bansos
                  </th>
                  <th className="py-2 px-2.5 whitespace-nowrap">
                    PLN & MCK
                  </th>
                  <th className="py-2 px-2.5 text-center whitespace-nowrap sm:sticky sm:right-0 bg-slate-100 sm:shadow-[-1px_0_0_rgba(226,232,240,1)]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedFamilies.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 px-4 text-center">
                      <FileSpreadsheet className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">
                        Data KK tidak ditemukan
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tidak ada Kartu Keluarga yang cocok dengan pencarian
                        atau filter.
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
                  paginatedFamilies.map((family, idx) => {
                    const rowNumber =
                      pageSize === 0
                        ? idx + 1
                        : (safePage - 1) * pageSize + idx + 1;
                    const members = getCitizensByFamilyId(family.id);
                    const maleCount = members.filter(
                      (m) => m.jenis_kelamin === 'L'
                    ).length;
                    const femaleCount = members.filter(
                      (m) => m.jenis_kelamin === 'P'
                    ).length;
                    const houseNo = getFamilyHouseNumber(family);

                    return (
                      <tr
                        key={family.id}
                        onClick={() => setSelectedFamilyForDetail(family)}
                        className="even:bg-slate-50/50 hover:bg-blue-50/60 cursor-pointer transition-colors group"
                      >
                        {/* 1. No */}
                        <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          {rowNumber}
                        </td>

                        {/* 2. Nama Kepala Keluarga + Badge Jumlah Anggota di sampingnya */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 uppercase">
                              {family.kepala_keluarga}
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Users className="w-2.5 h-2.5" />
                              {members.length} Jiwa
                            </span>
                          </div>
                        </td>

                        {/* 3. Detail Jumlah Anggota (L/P) */}
                        <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <span className="font-bold text-slate-800">
                              {members.length} Anggota
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({maleCount}L / {femaleCount}P)
                            </span>
                          </div>
                        </td>

                        {/* 4. Nomor KK */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-slate-800 tracking-tight">
                              {family.no_kk}
                            </span>
                            <button
                              onClick={(e) => handleCopyNoKK(family.no_kk, e)}
                              className="p-0.5 text-slate-400 hover:text-sky-600 rounded"
                              title="Salin No. KK"
                            >
                              {copiedNoKK === family.no_kk ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 5. Rumah & Wilayah */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-700">
                          <span className="font-semibold text-slate-800">
                            No.{houseNo}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            • RT {family.rt}/{family.rw} ({family.dusun})
                          </span>
                        </td>

                        {/* 6. Alamat */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-slate-600">
                          {family.alamat}
                        </td>

                        {/* 7. Status KK (Barcode & Verifikasi) */}
                        <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {family.status_barcode ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Barcode
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Non-Barcode
                              </span>
                            )}
                            {family.status_update ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Update
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 8. Bansos */}
                        <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                          {family.bantuan_sosial !== 'none' ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                              {family.bantuan_sosial}
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              Non-Bansos
                            </span>
                          )}
                        </td>

                        {/* 9. PLN & MCK */}
                        <td className="py-1.5 px-2.5 whitespace-nowrap text-[10px] text-slate-600">
                          <span className="font-semibold text-slate-700">
                            PLN: {family.penerangan}
                          </span>
                          <span className="text-slate-400 mx-1">•</span>
                          <span>MCK: {family.fasilitas_mck}</span>
                        </td>

                        {/* 10. Aksi */}
                        <td
                          className="py-1 px-2 text-center whitespace-nowrap sm:sticky sm:right-0 bg-white group-even:bg-slate-50 group-hover:bg-blue-50/90 sm:shadow-[-1px_0_0_rgba(241,245,249,1)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedFamilyForDetail(family)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-800 text-slate-700 hover:text-white border border-slate-200 transition-colors"
                              title="Lihat Detail Lengkap KK"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Detail</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedFamilyForNote(family);
                                setIsNoteModalOpen(true);
                              }}
                              className="p-1 text-sky-600 hover:text-white bg-blue-50 hover:bg-sky-500 rounded border border-blue-200 transition-colors"
                              title="Kirim Catatan KK"
                            >
                              <MessageSquarePlus className="w-3 h-3" />
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingFamily(family);
                                    setIsAddKKModalOpen(true);
                                  }}
                                  className="p-1 text-sky-600 hover:text-white bg-blue-50 hover:bg-sky-500 rounded border border-blue-200 transition-colors"
                                  title="Edit KK"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Hapus Kartu Keluarga ${family.kepala_keluarga} (No KK: ${family.no_kk}) beserta seluruh anggotanya?`
                                      )
                                    ) {
                                      deleteFamily(family.id);
                                    }
                                  }}
                                  className="p-1 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded border border-rose-200 transition-colors"
                                  title="Hapus KK"
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
                    : `${(safePage - 1) * pageSize + 1} - ${Math.min(
                        safePage * pageSize,
                        totalItems
                      )}`}
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
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

      {/* ===================================================================== */}
      {/* MODAL DETAIL LENGKAP KK (Muncul saat klik baris / tombol Detail)      */}
      {/* ===================================================================== */}
      {activeDetailFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3.5 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[88dvh] flex flex-col overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sky-500 to-cyan-500 p-4 text-white flex items-start justify-between gap-2 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100 block">
                  Detail Kartu Keluarga
                </span>
                <h3 className="font-extrabold text-sm sm:text-base uppercase break-words leading-snug mt-0.5">
                  {activeDetailFamily.kepala_keluarga}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-mono text-xs font-bold text-white/95">
                    NO. KK: {activeDetailFamily.no_kk}
                  </span>
                  <button
                    onClick={(e) => handleCopyNoKK(activeDetailFamily.no_kk, e)}
                    className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition-colors"
                    title="Salin Nomor KK"
                  >
                    {copiedNoKK === activeDetailFamily.no_kk ? (
                      <Check className="w-3 h-3 text-emerald-200" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedFamilyForDetail(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-3.5 sm:p-4 flex-1 min-h-0 overflow-y-auto space-y-3 text-xs">
              {/* Status Badges */}
              <div className="flex items-center flex-wrap gap-1.5">
                {activeDetailFamily.status_barcode ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <QrCode className="w-3 h-3 mr-1" />
                    Barcode Resmi
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Belum Barcode
                  </span>
                )}

                {activeDetailFamily.status_update ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Data Terverifikasi
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Perlu Update
                  </span>
                )}

                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Users className="w-3 h-3 mr-1" />
                  {getCitizensByFamilyId(activeDetailFamily.id).length} Jiwa
                </span>
              </div>

              {/* Wilayah & Domisili */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  Wilayah & Alamat Lengkap
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">RT / RW:</span>
                    <span className="font-bold text-slate-800">
                      RT {activeDetailFamily.rt} / RW {activeDetailFamily.rw}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Dusun & No. Rumah:</span>
                    <span className="font-bold text-slate-800">
                      {activeDetailFamily.dusun} • Rumah No.{' '}
                      {getFamilyHouseNumber(activeDetailFamily)}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] pt-1 border-t border-slate-200/70">
                  <span className="text-slate-400 block">Alamat Domisili:</span>
                  <span className="font-semibold text-slate-800 break-words">
                    {activeDetailFamily.alamat}
                  </span>
                </div>
              </div>

              {/* Fasilitas Rumah & Bantuan Sosial */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                  Fasilitas Rumah & Bantuan Sosial
                </h4>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block">
                      Penerangan
                    </span>
                    <span className="font-bold text-slate-800 inline-flex items-center gap-1 mt-0.5 capitalize">
                      <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      {activeDetailFamily.penerangan}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block">
                      Fasilitas MCK
                    </span>
                    <span className="font-bold text-slate-800 inline-flex items-center gap-1 mt-0.5 capitalize">
                      <Droplet className="w-3 h-3 text-sky-500 flex-shrink-0" />
                      {activeDetailFamily.fasilitas_mck}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block">
                      Program Bansos
                    </span>
                    <span className="font-extrabold text-emerald-700 inline-flex items-center gap-1 mt-0.5 uppercase">
                      {activeDetailFamily.bantuan_sosial === 'none'
                        ? 'Non-Bansos'
                        : activeDetailFamily.bantuan_sosial}
                    </span>
                  </div>
                </div>
              </div>

              {/* Daftar Anggota Keluarga */}
              {(() => {
                const members = getCitizensByFamilyId(activeDetailFamily.id);
                return (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-sky-600" />
                        Anggota Keluarga ({members.length} Jiwa)
                      </h4>
                      <Link
                        href={`/kk/${activeDetailFamily.id}`}
                        className="text-[10px] font-bold text-sky-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Kelola Anggota</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>

                    {members.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-2">
                        Belum ada anggota keluarga terdaftar.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {members.map((m, i) => (
                          <div
                            key={m.id}
                            className="bg-white p-2.5 rounded-lg border border-slate-200/90 flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center flex-wrap gap-1">
                                <span className="text-[10px] font-mono text-slate-400 font-bold">
                                  {i + 1}.
                                </span>
                                <span className="text-xs font-extrabold text-slate-900 uppercase break-words">
                                  {m.nama_lengkap}
                                </span>
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                                    m.jenis_kelamin === 'L'
                                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  {m.jenis_kelamin}
                                </span>
                              </div>
                              <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                NIK: {m.nik} • Gol. Darah: {getCitizenBloodType(m)}
                              </p>
                              <p className="text-[10px] text-slate-600 mt-0.5 break-words">
                                {calculateCitizenAge(m.tanggal_lahir)} Thn •{' '}
                                {getCitizenMaritalStatus(m)}
                                {getCitizenMarriageDate(m) !== '-'
                                  ? ` (${getCitizenMarriageDate(m)})`
                                  : ''}{' '}
                                • {m.pekerjaan} • BPJS: {m.bpjs_kesehatan.toUpperCase()}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5 break-words">
                                Orang Tua: Ayah <strong>{getCitizenParents(m).ayah}</strong> • Ibu{' '}
                                <strong>{getCitizenParents(m).ibu}</strong>
                              </p>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                              {m.hubungan_keluarga}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
              <Link
                href={`/kk/${activeDetailFamily.id}`}
                className="inline-flex items-center text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1 text-sky-600" />
                Halaman KK & Anggota
              </Link>

              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    const fam = activeDetailFamily;
                    setSelectedFamilyForDetail(null);
                    setSelectedFamilyForNote(fam);
                    setIsNoteModalOpen(true);
                  }}
                  className="inline-flex items-center text-[11px] font-bold bg-blue-50 hover:bg-sky-500 text-blue-700 hover:text-white border border-blue-200 px-2.5 py-1.5 rounded-xl transition-colors"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 mr-1" />
                  Catat KK
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        const fam = activeDetailFamily;
                        setEditingFamily(fam);
                        setIsAddKKModalOpen(true);
                      }}
                      className="inline-flex items-center text-[11px] font-bold bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1.5 rounded-xl transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Edit KK
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            `Hapus Kartu Keluarga ${activeDetailFamily.kepala_keluarga} (No KK: ${activeDetailFamily.no_kk}) beserta seluruh anggotanya?`
                          )
                        ) {
                          const idToDelete = activeDetailFamily.id;
                          setSelectedFamilyForDetail(null);
                          await deleteFamily(idToDelete);
                        }
                      }}
                      className="inline-flex items-center text-[11px] font-bold bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 px-2.5 py-1.5 rounded-xl transition-colors"
                      title="Hapus KK"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
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
          setSelectedFamilyForNote(null);
        }}
        initialFamily={selectedFamilyForNote}
      />

      {/* Add / Edit KK Modal (Admin) */}
      {isAdmin && (
        <AddKKModal
          isOpen={isAddKKModalOpen}
          onClose={() => {
            setIsAddKKModalOpen(false);
            setEditingFamily(null);
          }}
          editFamily={editingFamily}
        />
      )}
    </div>
  );
}

export default function KKListPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Memuat data Kartu Keluarga...
        </div>
      }
    >
      <KKListContent />
    </Suspense>
  );
}
