'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Family } from '@/lib/types';
import { useApp } from '@/lib/context';
import { getFamilyHouseNumber } from '@/lib/dataUtils';
import {
  FileText,
  MapPin,
  Users,
  QrCode,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Zap,
  Droplet,
  HeartHandshake,
  MessageSquarePlus,
} from 'lucide-react';

interface KKCardProps {
  family: Family;
  onOpenNoteModal?: (family: Family) => void;
}

export const KKCard: React.FC<KKCardProps> = ({ family, onOpenNoteModal }) => {
  const { getCitizensByFamilyId } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const members = getCitizensByFamilyId(family.id);

  const bansosColors: Record<string, string> = {
    pkh: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bpnt: 'bg-blue-100 text-blue-800 border-blue-200',
    blt: 'bg-amber-100 text-amber-800 border-amber-200',
    kip: 'bg-purple-100 text-purple-800 border-purple-200',
    none: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Top Bar with KK Number & Barcode Tag */}
      <div className="px-3.5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between flex-wrap gap-1.5">
        <div className="flex items-center space-x-1.5">
          <FileText className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
          <span className="font-mono text-xs font-bold text-slate-800">
            {family.no_kk}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-1">
          {family.status_barcode ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <QrCode className="w-2.5 h-2.5 mr-1" />
              Barcode
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
              <AlertCircle className="w-2.5 h-2.5 mr-1" />
              Non-Barcode
            </span>
          )}

          {family.status_update ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
              Valid
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              Update
            </span>
          )}
        </div>
      </div>

      {/* Main Family Info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 uppercase break-words leading-snug">
              {family.kepala_keluarga}
            </h4>
            <div className="flex items-start text-xs text-slate-600 mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">
                RT {family.rt} / RW {family.rw} • Rumah No. {getFamilyHouseNumber(family)} • {family.dusun}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 italic leading-snug break-words">
              {family.alamat}
            </p>
          </div>

          <Link
            href={`/kk/${family.id}`}
            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-sky-600 transition-colors flex-shrink-0"
            title="Lihat Detail Kartu Keluarga"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tags / Indicators: Bansos, MCK, Listrik */}
        <div className="flex items-center flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
          <span
            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              bansosColors[family.bantuan_sosial] || bansosColors.none
            }`}
          >
            <HeartHandshake className="w-3 h-3 mr-1" />
            {family.bantuan_sosial === 'none'
              ? 'Non-Bansos'
              : `Bansos ${family.bantuan_sosial.toUpperCase()}`}
          </span>

          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Zap className="w-3 h-3 mr-1 text-amber-500" />
            PLN: {family.penerangan}
          </span>

          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Droplet className="w-3 h-3 mr-1 text-sky-500" />
            MCK: {family.fasilitas_mck}
          </span>

          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ml-auto">
            <Users className="w-3 h-3 mr-1" />
            {members.length} Jiwa
          </span>
        </div>

        {/* Quick Toggle Accordion for Family Members */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sky-600 hover:text-blue-700 font-semibold flex items-center gap-1 focus:outline-none"
          >
            <span>{isExpanded ? 'Sembunyikan Anggota' : 'Lihat Anggota Keluarga'}</span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>

          {onOpenNoteModal && (
            <button
              onClick={() => onOpenNoteModal(family)}
              className="inline-flex items-center text-[11px] font-semibold text-slate-700 hover:text-sky-600 bg-slate-100 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors border border-slate-200 flex-shrink-0"
            >
              <MessageSquarePlus className="w-3 h-3 mr-1 text-sky-600" />
              Catat KK
            </button>
          )}
        </div>

        {/* Expanded Members List */}
        {isExpanded && (
          <div className="mt-2.5 space-y-1.5 pt-2 border-t border-dashed border-slate-200 animate-slide-up">
            {members.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">Belum ada anggota terdaftar</p>
            ) : (
              members.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 break-words">
                        {m.nama_lengkap}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({m.jenis_kelamin})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 ml-5 font-mono break-all mt-0.5">
                      NIK: {m.nik} • {m.hubungan_keluarga}
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                      m.bpjs_kesehatan === 'kis'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : m.bpjs_kesehatan === 'mandiri'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-rose-100 text-rose-700 border-rose-200'
                    }`}
                  >
                    BPJS: {m.bpjs_kesehatan.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
