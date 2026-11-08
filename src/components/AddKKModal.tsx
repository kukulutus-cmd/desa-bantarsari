'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { Family, PeneranganType, MckType, BansosType } from '@/lib/types';
import {
  DUSUN_NAMES,
  getAddressForTerritory,
  getRtTerritoriesForRw,
  getRwTerritoriesForDusun,
} from '@/lib/territory';
import { PlusCircle, X, AlertCircle, Save } from 'lucide-react';

interface AddKKModalProps {
  isOpen: boolean;
  onClose: () => void;
  editFamily?: Family | null;
}

export const AddKKModal: React.FC<AddKKModalProps> = ({
  isOpen,
  onClose,
  editFamily,
}) => {
  const { addFamily, updateFamily } = useApp();

  const [noKK, setNoKK] = useState('');
  const [kepalaKeluarga, setKepalaKeluarga] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noRumah, setNoRumah] = useState('');
  const [dusun, setDusun] = useState('Dusun I');
  const [rw, setRw] = useState('001');
  const [rt, setRt] = useState('001');
  const [statusBarcode, setStatusBarcode] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState(true);
  const [penerangan, setPenerangan] = useState<PeneranganType>('meteran');
  const [fasilitasMck, setFasilitasMck] = useState<MckType>('sendiri');
  const [bantuanSosial, setBantuanSosial] = useState<BansosType>('none');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rwOptions = getRwTerritoriesForDusun(dusun);
  const rtOptions = getRtTerritoriesForRw(rw);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (editFamily) {
        const nextDusun = DUSUN_NAMES.includes(editFamily.dusun)
          ? editFamily.dusun
          : DUSUN_NAMES[0];
        const nextRwOptions = getRwTerritoriesForDusun(nextDusun);
        const nextRw = nextRwOptions.some((item) => item.rw === editFamily.rw)
          ? editFamily.rw
          : nextRwOptions[0].rw;
        const nextRtOptions = getRtTerritoriesForRw(nextRw);
        setNoKK(editFamily.no_kk || '');
        setKepalaKeluarga(editFamily.kepala_keluarga || '');
        setAlamat(editFamily.alamat || '');
        setNoRumah(editFamily.no_rumah || '');
        setDusun(nextDusun);
        setRw(nextRw);
        setRt(
          nextRtOptions.some((item) => item.rt === editFamily.rt)
            ? editFamily.rt
            : nextRtOptions[0].rt
        );
        setStatusBarcode(editFamily.status_barcode);
        setStatusUpdate(editFamily.status_update);
        setPenerangan(editFamily.penerangan || 'meteran');
        setFasilitasMck(editFamily.fasilitas_mck || 'sendiri');
        setBantuanSosial(editFamily.bantuan_sosial || 'none');
      } else {
        setNoKK('');
        setKepalaKeluarga('');
        setAlamat('');
        setNoRumah('');
        setDusun('Dusun I');
        setRw('001');
        setRt('001');
        setStatusBarcode(true);
        setStatusUpdate(true);
        setPenerangan('meteran');
        setFasilitasMck('sendiri');
        setBantuanSosial('none');
      }
    }
  }, [editFamily, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noKK || noKK.length !== 16) {
      setError('Nomor KK harus tepat 16 digit angka.');
      return;
    }
    if (!kepalaKeluarga.trim()) {
      setError('Nama Kepala Keluarga wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      no_kk: noKK,
      kepala_keluarga: kepalaKeluarga.trim().toUpperCase(),
      alamat: alamat.trim(),
      no_rumah: noRumah.trim() || alamat.match(/No\.?\s*(\d+)/i)?.[1] || '01',
      dusun,
      rw,
      rt,
      status_barcode: statusBarcode,
      status_update: statusUpdate,
      penerangan,
      fasilitas_mck: fasilitasMck,
      bantuan_sosial: bantuanSosial,
    };

    const res = editFamily
      ? await updateFamily(editFamily.id, payload)
      : await addFamily(payload);

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Gagal menyimpan data KK');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90dvh] flex flex-col overflow-hidden animate-slide-up">
        {/* Fixed Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0 bg-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-sky-600 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {editFamily ? 'Edit Kartu Keluarga' : 'Tambah Kartu Keluarga Baru'}
              </h3>
              <p className="text-[11px] text-slate-500">Data disimpan ke database desa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Kartu Keluarga (16 Digit)
            </label>
            <input
              type="text"
              maxLength={16}
              value={noKK}
              onChange={(e) => setNoKK(e.target.value.replace(/\D/g, ''))}
                placeholder="9999990000000001 (contoh)"
              className="w-full p-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Kepala Keluarga
            </label>
            <input
              type="text"
              value={kepalaKeluarga}
              onChange={(e) => setKepalaKeluarga(e.target.value)}
                placeholder="Nama contoh"
              className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dusun</label>
              <select
                value={dusun}
                onChange={(e) => {
                  const nextDusun = e.target.value;
                  const nextRw = getRwTerritoriesForDusun(nextDusun)[0];
                  setDusun(nextDusun);
                  setRw(nextRw.rw);
                  setRt(nextRw.rts[0].rt);
                }}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                {DUSUN_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">RW</label>
              <select
                value={rw}
                onChange={(e) => {
                  const nextRw = e.target.value;
                  setRw(nextRw);
                  setRt(getRtTerritoriesForRw(nextRw)[0]?.rt || '001');
                }}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                {rwOptions.map((item) => (
                  <option key={item.rw} value={item.rw}>{item.rw}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">RT</label>
              <select
                value={rt}
                onChange={(e) => setRt(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                {rtOptions.map((item) => (
                  <option key={item.rt} value={item.rt}>{item.rt}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="-mt-2 text-[10px] text-sky-700">
            Wilayah contoh: {getAddressForTerritory(dusun, rw, rt)}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Lengkap / Jalan
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder={getAddressForTerritory(dusun, rw, rt)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. Rumah
              </label>
              <input
                type="text"
                value={noRumah}
                onChange={(e) => setNoRumah(e.target.value)}
                placeholder="01"
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bantuan Sosial</label>
              <select
                value={bantuanSosial}
                onChange={(e) => setBantuanSosial(e.target.value as BansosType)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="none">Non-Bansos</option>
                <option value="pkh">PKH</option>
                <option value="bpnt">BPNT</option>
                <option value="blt">BLT</option>
                <option value="kip">KIP</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Penerangan PLN</label>
              <select
                value={penerangan}
                onChange={(e) => setPenerangan(e.target.value as PeneranganType)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="meteran">Meteran Sendiri</option>
                <option value="tetangga">Sambung Tetangga</option>
                <option value="tanpa_meteran">Tanpa Meteran</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fasilitas MCK</label>
              <select
                value={fasilitasMck}
                onChange={(e) => setFasilitasMck(e.target.value as MckType)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="sendiri">Sendiri</option>
                <option value="kelompok">Kelompok / Bersama</option>
                <option value="umum">Umum</option>
                <option value="tidak_ada">Tidak Ada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Barcode</label>
              <select
                value={statusBarcode ? 'true' : 'false'}
                onChange={(e) => setStatusBarcode(e.target.value === 'true')}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="true">Sudah Barcode (Dukcapil)</option>
                <option value="false">Belum Barcode (Manual)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status Validasi Data</label>
            <select
              value={statusUpdate ? 'true' : 'false'}
              onChange={(e) => setStatusUpdate(e.target.value === 'true')}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
            >
              <option value="true">Valid / Sudah Update</option>
              <option value="false">Perlu Update Data</option>
            </select>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-sm flex items-center justify-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : editFamily ? 'Simpan Perubahan' : 'Tambah KK'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
