'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  FolderTree,
  HeartHandshake,
  Users,
  MessageSquarePlus,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface QuickActionBarProps {
  onOpenNoteModal: () => void;
  isAdmin?: boolean;
  onOpenAddKKModal?: () => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onOpenNoteModal,
  isAdmin,
  onOpenAddKKModal,
}) => {
  const actions = [
    {
      label: 'Cari NIK',
      icon: Search,
      href: '/warga?focus=search',
      color: 'bg-blue-500 text-white',
    },
    {
      label: 'Daftar KK',
      icon: FolderTree,
      href: '/kk',
      color: 'bg-blue-500 text-white',
    },
    {
      label: 'Bansos KPM',
      icon: HeartHandshake,
      href: '/kk?filter=bansos',
      color: 'bg-emerald-500 text-white',
    },
    {
      label: 'Tabel Warga',
      icon: Users,
      href: '/warga',
      color: 'bg-indigo-500 text-white',
    },
    {
      label: 'Exp / Imp',
      icon: FileSpreadsheet,
      href: '/data',
      color: 'bg-teal-500 text-white',
    },
    {
      label: 'Buat Catatan',
      icon: MessageSquarePlus,
      onClick: onOpenNoteModal,
      color: 'bg-amber-500 text-white',
    },
  ];

  return (
    <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-800 tracking-tight">
          Aksi Cepat Menu Wilayah
        </span>
        {isAdmin && onOpenAddKKModal && (
          <button
            onClick={onOpenAddKKModal}
            className="inline-flex items-center text-[10px] sm:text-[11px] font-bold text-sky-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
          >
            <PlusCircle className="w-3 h-3 mr-1" />
            Tambah KK Baru
          </button>
        )}
      </div>

      {/* Responsive 3x2 grid on phones, 6x1 on tablet/desktop so nothing is cut off */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {actions.map((act, index) => {
          const Icon = act.icon;
          if (act.href) {
            return (
              <Link
                key={index}
                href={act.href}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-50 group focus:outline-none transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-2xl ${act.color} flex items-center justify-center shadow-sm group-hover:scale-105 active:scale-95 transition-all`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-semibold text-slate-700 mt-1 text-center leading-tight">
                  {act.label}
                </span>
              </Link>
            );
          }

          return (
            <button
              key={index}
              onClick={act.onClick}
              className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-slate-50 group focus:outline-none transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-2xl ${act.color} flex items-center justify-center shadow-sm group-hover:scale-105 active:scale-95 transition-all`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-semibold text-slate-700 mt-1 text-center leading-tight">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
