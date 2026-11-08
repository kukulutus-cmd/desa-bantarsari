'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { Family, Citizen } from '@/lib/types';
import {
  MessageSquarePlus,
  Send,
  X,
  FileText,
  User,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFamily?: Family | null;
  initialCitizen?: Citizen | null;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  initialFamily,
  initialCitizen,
}) => {
  const { visibleFamilies, getCitizensByFamilyId, addNote, currentProfile, villageConfig } = useApp();

  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [selectedCitizenId, setSelectedCitizenId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialFamily) {
      setSelectedFamilyId(initialFamily.id);
    } else if (visibleFamilies.length > 0) {
      setSelectedFamilyId(visibleFamilies[0].id);
    }

    if (initialCitizen) {
      setSelectedCitizenId(initialCitizen.id);
    } else {
      setSelectedCitizenId('');
    }
  }, [initialFamily, initialCitizen, visibleFamilies]);

  if (!isOpen) return null;

  const currentFamily = visibleFamilies.find((f) => f.id === selectedFamilyId);
  const availableCitizens = selectedFamilyId ? getCitizensByFamilyId(selectedFamilyId) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('Isi catatan atau laporan tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const targetFamily = visibleFamilies.find((f) => f.id === selectedFamilyId);
    const targetCitizen = availableCitizens.find((c) => c.id === selectedCitizenId);

    const result = await addNote({
      family_id: targetFamily?.id || null,
      citizen_id: targetCitizen?.id || null,
      family_no_kk: targetFamily?.no_kk,
      citizen_name: targetCitizen?.nama_lengkap,
      citizen_nik: targetCitizen?.nik,
      message: message.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccessNotice(`Catatan berhasil dikirim ke Admin ${villageConfig.nama_desa}!`);
      setMessage('');
      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
      }, 1400);
    } else {
      setErrorMessage(result.error || 'Gagal mengirim catatan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-sky-600 flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Kirim Catatan Data
              </h3>
              <p className="text-xs text-slate-500">
                Laporan perubahan warga ke Admin Desa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {successNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-semibold">{successNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="text-xs font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Target Kartu Keluarga */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kartu Keluarga Sasaran
            </label>
            <div className="relative">
              <select
                value={selectedFamilyId}
                onChange={(e) => {
                  setSelectedFamilyId(e.target.value);
                  setSelectedCitizenId('');
                }}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                <option value="">-- Pilih KK (Atau Umum Wilayah) --</option>
                {visibleFamilies.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    KK: {fam.no_kk} - {fam.kepala_keluarga} (RT {fam.rt}/{fam.rw})
                  </option>
                ))}
              </select>
              <FileText className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Target Citizen (Optional) */}
          {selectedFamilyId && availableCitizens.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Anggota Keluarga (Opsional)
              </label>
              <div className="relative">
                <select
                  value={selectedCitizenId}
                  onChange={(e) => setSelectedCitizenId(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                >
                  <option value="">-- Seluruh Anggota Keluarga --</option>
                  {availableCitizens.map((cit) => (
                    <option key={cit.id} value={cit.id}>
                      {cit.nama_lengkap} ({cit.hubungan_keluarga}) - NIK {cit.nik}
                    </option>
                  ))}
                </select>
                <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Message Text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Isi Catatan / Perubahan Data
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contoh: Warga pindah domisili, perbaikan NIK/tanggal lahir, permohonan bantuan sosial KPM, atau status kematian..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Catatan akan berstatus <strong className="text-amber-600">Pending</strong> hingga diperiksa Admin {villageConfig.nama_desa}.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Catatan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
