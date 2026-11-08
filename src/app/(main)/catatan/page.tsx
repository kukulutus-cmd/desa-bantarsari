'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { NoteModal } from '@/components/NoteModal';
import {
  MessageSquareText,
  Clock,
  CheckCircle2,
  PlusCircle,
  FileText,
  User,
  MapPin,
  Check,
  RotateCcw,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export default function CatatanHubPage() {
  const { visibleNotes, currentProfile, updateNoteStatus, deleteNote } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const isAdmin = currentProfile?.role === 'admin';

  const filteredNotes = useMemo(() => {
    if (activeTab === 'all') return visibleNotes;
    return visibleNotes.filter((n) => n.status === activeTab);
  }, [visibleNotes, activeTab]);

  const countPending = visibleNotes.filter((n) => n.status === 'pending').length;
  const countReviewed = visibleNotes.filter((n) => n.status === 'reviewed').length;
  const countResolved = visibleNotes.filter((n) => n.status === 'resolved').length;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ===================================================================== */}
      {/* FIXED TOP HEAD BAR (Judul & Filter Tab - Tidak ikut scrolling)        */}
      {/* ===================================================================== */}
      <div className="flex-shrink-0 px-3.5 sm:px-5 md:px-8 xl:px-10 pt-2.5 pb-2.5 bg-slate-50 border-b border-slate-200/80 z-10 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <MessageSquareText className="w-4 h-4 text-sky-600" />
              <span>Catatan & Laporan Wilayah</span>
            </h1>
            <p className="text-[10px] text-slate-500">
              Pusat komunikasi data antara RT/RW/Kadus & Admin Desa
            </p>
          </div>

          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="inline-flex items-center text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1.5 rounded-xl shadow-sm transition-all active:scale-95 flex-shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Buat Catatan
          </button>
        </div>

        {/* Tabs Filter */}
        <div className="grid grid-cols-4 p-1 bg-slate-200/80 rounded-xl text-[10px] sm:text-xs font-bold gap-0.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-1.5 px-1 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({visibleNotes.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-1.5 px-1 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({countPending})
          </button>
          <button
            onClick={() => setActiveTab('reviewed')}
            className={`py-1.5 px-1 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'reviewed'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ditinjau ({countReviewed})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`py-1.5 px-1 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'resolved'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Selesai ({countResolved})
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SCROLLABLE NOTES CONTENT (Hanya isi daftar catatan yang scroll)       */}
      {/* ===================================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 sm:px-5 md:px-8 xl:px-10 py-3 pb-20 space-y-2.5">
        {isAdmin && (
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px] flex items-center justify-between">
            <span className="font-semibold">
              Sebagai <strong>Admin Desa</strong>, Anda berhak memverifikasi, menyelesaikan, atau menghapus catatan petugas.
            </span>
          </div>
        )}

        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
            <MessageSquareText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada catatan pada tab ini</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Gunakan tombol &quot;Buat Catatan&quot; untuk melaporkan perubahan kependudukan.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            let statusBadge = (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="w-2.5 h-2.5 mr-1" />
                Pending
              </span>
            );

            if (note.status === 'reviewed') {
              statusBadge = (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  <RotateCcw className="w-2.5 h-2.5 mr-1" />
                  Ditinjau
                </span>
              );
            } else if (note.status === 'resolved') {
              statusBadge = (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                  Selesai
                </span>
              );
            }

            return (
              <div
                key={note.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm hover:border-blue-200 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    {note.family_no_kk && (
                      <div className="flex items-center text-xs font-mono font-bold text-slate-800">
                        <FileText className="w-3.5 h-3.5 text-sky-600 mr-1" />
                        {note.family_id ? (
                          <Link
                            href={`/kk/${note.family_id}`}
                            className="hover:text-sky-600 hover:underline inline-flex items-center gap-1"
                          >
                            <span>KK: {note.family_no_kk}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        ) : (
                          <span>KK: {note.family_no_kk}</span>
                        )}
                      </div>
                    )}
                    {note.citizen_name && (
                      <div className="flex items-center text-xs font-semibold text-slate-700">
                        <User className="w-3.5 h-3.5 text-sky-600 mr-1" />
                        <span>{note.citizen_name}</span>
                        {note.citizen_nik && (
                          <span className="text-[10px] text-slate-400 font-mono ml-1">
                            ({note.citizen_nik})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center text-[10px] text-slate-400">
                      <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                      <span>
                        RT {note.rt} / RW {note.rw} • {note.dusun}
                      </span>
                    </div>
                  </div>

                  <div>{statusBadge}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed font-normal">
                  {note.message}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>Dilaporkan: {formatDate(note.created_at)}</span>

                  {isAdmin && (
                    <div className="flex items-center space-x-1">
                      {note.status !== 'reviewed' && (
                        <button
                          onClick={() => updateNoteStatus(note.id, 'reviewed')}
                          className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] border border-blue-200 transition-colors"
                        >
                          Tinjau
                        </button>
                      )}
                      {note.status !== 'resolved' && (
                        <button
                          onClick={() => updateNoteStatus(note.id, 'resolved')}
                          className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-200 transition-colors flex items-center gap-0.5"
                        >
                          <Check className="w-2.5 h-2.5" />
                          Selesaikan
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Hapus catatan laporan ini?')) {
                            deleteNote(note.id);
                          }
                        }}
                        className="p-1 rounded bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition-colors"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
      />
    </div>
  );
}
