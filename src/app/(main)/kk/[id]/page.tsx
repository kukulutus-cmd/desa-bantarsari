'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { NoteModal } from '@/components/NoteModal';
import { AddKKModal } from '@/components/AddKKModal';
import { CitizenFormModal } from '@/components/CitizenFormModal';
import { Citizen } from '@/lib/types';
import {
  getCitizenMaritalStatus,
  getFamilyHouseNumber,
  calculateCitizenAge,
  getCitizenBloodType,
  getCitizenMarriageDate,
  getCitizenParents,
} from '@/lib/dataUtils';
import {
  ArrowLeft,
  QrCode,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Users,
  Zap,
  Droplet,
  HeartHandshake,
  MessageSquarePlus,
  ShieldAlert,
  UserPlus,
  Edit3,
  Trash2,
} from 'lucide-react';

export default function KKDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    getFamilyById,
    getCitizensByFamilyId,
    visibleFamilies,
    currentProfile,
    villageConfig,
    deleteCitizen,
    deleteFamily,
  } = useApp();

  const familyId = params.id as string;
  const family = getFamilyById(familyId);
  const members = getCitizensByFamilyId(familyId);

  const isPermitted = visibleFamilies.some((f) => f.id === familyId);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedCitizenForNote, setSelectedCitizenForNote] = useState<Citizen | null>(null);
  const [isEditKKOpen, setIsEditKKOpen] = useState(false);
  const [isCitizenModalOpen, setIsCitizenModalOpen] = useState(false);
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null);

  const isAdmin = currentProfile?.role === 'admin';

  if (!family || !isPermitted) {
    return (
      <div className="p-5">
        <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">
            Akses Data Dibatasi (Batas Wilayah)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Kartu Keluarga ini tidak berada di dalam wilayah demo yang ditugaskan untuk Anda di {villageConfig.nama_desa}.
          </p>
          <button
            onClick={() => router.push('/kk')}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Kembali ke Daftar KK Anda
          </button>
        </div>
      </div>
    );
  }

  const handleDeleteFamily = async () => {
    if (
      confirm(
        `Hapus Kartu Keluarga ${family.kepala_keluarga} (No KK: ${family.no_kk}) beserta seluruh anggota keluarganya?`
      )
    ) {
      const res = await deleteFamily(family.id);
      if (res.success) {
        router.push('/kk');
      } else {
        alert(res.error || 'Gagal menghapus KK');
      }
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ===================================================================== */}
      {/* FIXED TOP HEAD BAR (Tidak ikut scrolling)                             */}
      {/* ===================================================================== */}
      <div className="flex-shrink-0 px-3.5 sm:px-5 md:px-8 xl:px-10 py-2.5 bg-slate-50 border-b border-slate-200/80 z-10 flex items-center justify-between gap-2">
        <Link
          href="/kk"
          className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Kembali ke KK
        </Link>

        <div className="flex items-center space-x-1.5">
          {isAdmin ? (
            <>
              <button
                onClick={() => setIsEditKKOpen(true)}
                className="inline-flex items-center text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-xl shadow-sm transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Edit KK
              </button>
              <button
                onClick={handleDeleteFamily}
                className="inline-flex items-center text-xs font-bold bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 px-2.5 py-1.5 rounded-xl transition-all"
                title="Hapus KK"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setSelectedCitizenForNote(null);
                setIsNoteModalOpen(true);
              }}
              className="inline-flex items-center text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1.5 rounded-xl shadow-sm transition-all"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 mr-1" />
              Kirim Catatan
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SCROLLABLE PAGE BODY (Hanya isi halaman yang scroll)                  */}
      {/* ===================================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 sm:px-5 md:px-8 xl:px-10 py-3 pb-20 space-y-3.5">
        {/* Main Family Card Header */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                KARTU KELUARGA DESA BANTARSARI
              </span>
              <h1 className="text-base font-extrabold text-slate-900 mt-0.5 uppercase">
                {family.kepala_keluarga}
              </h1>
              <p className="font-mono text-xs font-bold text-slate-600 mt-0.5">
                NO KK: {family.no_kk}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              {family.status_barcode ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <QrCode className="w-3 h-3 mr-1" />
                  Barcode Resmi
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Belum Barcode
                </span>
              )}

              {family.status_update ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Data Terverifikasi
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Perlu Update
                </span>
              )}
            </div>
          </div>

          {/* Info Grid: Alamat, Listrik, MCK, Bansos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-semibold">Wilayah & Alamat</span>
              <div className="flex items-center text-slate-800 font-bold mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600 mr-1 flex-shrink-0" />
                <span>
                  RT {family.rt} / RW {family.rw} • Rumah No. {getFamilyHouseNumber(family)} ({family.dusun})
                </span>
              </div>
              <p className="text-[11px] text-slate-600 italic mt-0.5">{family.alamat}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold">Fasilitas Rumah & Bansos</span>
                <div className="flex items-center flex-wrap gap-2 text-[11px] text-slate-700">
                  <span className="inline-flex items-center">
                    <Zap className="w-3 h-3 text-amber-500 mr-1" />
                    PLN: {family.penerangan}
                  </span>
                  <span className="inline-flex items-center">
                    <Droplet className="w-3 h-3 text-sky-500 mr-1" />
                    MCK: {family.fasilitas_mck}
                  </span>
                  <span className="inline-flex items-center font-bold text-emerald-700">
                    <HeartHandshake className="w-3 h-3 text-emerald-600 mr-1" />
                    Bansos: {family.bantuan_sosial.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Member Table Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                Tabel Anggota Keluarga ({members.length} Jiwa)
              </h2>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setEditingCitizen(null);
                  setIsCitizenModalOpen(true);
                }}
                className="inline-flex items-center text-[11px] font-bold bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1 rounded-lg transition-colors shadow-sm"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Tambah Anggota
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-2.5 text-center w-9 whitespace-nowrap">No</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">NIK</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Nama Lengkap</th>
                  <th className="py-2 px-2 text-center whitespace-nowrap">L/P</th>
                  <th className="py-2 px-2 text-center whitespace-nowrap">Gol. Darah</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Hubungan</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Tgl Lahir (Usia)</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Status & Tgl Kawin</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Nama Orang Tua (Ayah & Ibu)</th>
                  <th className="py-2 px-2.5 whitespace-nowrap">Pendidikan & Pekerjaan</th>
                  <th className="py-2 px-2 text-center whitespace-nowrap">BPJS</th>
                  <th className="py-2 px-2.5 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-xs text-slate-400">
                      Belum ada anggota keluarga terdaftar pada KK ini.
                    </td>
                  </tr>
                ) : (
                  members.map((member, idx) => {
                    const age = calculateCitizenAge(member.tanggal_lahir);
                    const marital = getCitizenMaritalStatus(member);
                    const marriageDate = getCitizenMarriageDate(member);
                    const bloodType = getCitizenBloodType(member);
                    const parents = getCitizenParents(member);

                    return (
                      <tr key={member.id} className="even:bg-slate-50/50 hover:bg-blue-50/50 transition-colors">
                        <td className="py-2 px-2.5 text-center font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {member.nik}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-900 uppercase whitespace-nowrap">
                          {member.nama_lengkap}
                        </td>
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                              member.jenis_kelamin === 'L'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {member.jenis_kelamin}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {bloodType}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {member.hubungan_keluarga}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap text-slate-700">
                          <span className="font-semibold text-slate-900">{age} Thn</span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({member.tempat_lahir}, {member.tanggal_lahir})
                          </span>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {marital}
                          </span>
                          {marriageDate !== '-' && (
                            <span className="text-[10px] text-slate-500 font-mono ml-1">
                              ({marriageDate})
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap text-[10px] text-slate-700">
                          <span className="font-semibold text-slate-800">
                            Ayah: {parents.ayah}
                          </span>
                          <span className="text-slate-300 mx-1">•</span>
                          <span className="font-semibold text-slate-700">
                            Ibu: {parents.ibu}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap text-slate-700">
                          <span className="font-medium text-slate-800">{member.pekerjaan}</span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            • {member.pendidikan_terakhir}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                              member.bpjs_kesehatan === 'kis'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : member.bpjs_kesehatan === 'mandiri'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                          >
                            {member.bpjs_kesehatan}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedCitizenForNote(member);
                                setIsNoteModalOpen(true);
                              }}
                              className="p-1 rounded bg-blue-50 hover:bg-sky-500 text-sky-600 hover:text-white border border-blue-200 transition-colors"
                              title="Catat Warga"
                            >
                              <MessageSquarePlus className="w-3 h-3" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingCitizen(member);
                                    setIsCitizenModalOpen(true);
                                  }}
                                  className="p-1 rounded bg-blue-50 hover:bg-sky-500 text-sky-600 hover:text-white border border-blue-200 transition-colors"
                                  title="Edit Anggota"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus anggota ${member.nama_lengkap} dari KK?`)) {
                                      deleteCitizen(member.id);
                                    }
                                  }}
                                  className="p-1 rounded bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition-colors"
                                  title="Hapus Anggota"
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
        </div>
      </div>

      {/* Add / Edit Member Modal (Admin) */}
      {isAdmin && (
        <CitizenFormModal
          isOpen={isCitizenModalOpen}
          onClose={() => {
            setIsCitizenModalOpen(false);
            setEditingCitizen(null);
          }}
          editCitizen={editingCitizen}
          defaultFamilyId={family.id}
        />
      )}

      {/* Note Modal */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setSelectedCitizenForNote(null);
        }}
        initialFamily={family}
        initialCitizen={selectedCitizenForNote}
      />

      {/* Edit KK Modal (Admin) */}
      {isAdmin && (
        <AddKKModal
          isOpen={isEditKKOpen}
          onClose={() => setIsEditKKOpen(false)}
          editFamily={family}
        />
      )}
    </div>
  );
}
