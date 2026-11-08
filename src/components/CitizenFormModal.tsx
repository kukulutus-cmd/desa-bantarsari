'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { Citizen, Family, GenderType, BpjsType, MaritalStatus } from '@/lib/types';
import {
  getCitizenMaritalStatus,
  getCitizenBloodType,
  getCitizenMarriageDate,
  getCitizenParents,
} from '@/lib/dataUtils';
import { UserPlus, Edit3, X, AlertCircle, Save } from 'lucide-react';

interface CitizenFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCitizen?: Citizen | null;
  defaultFamilyId?: string;
}

export const CitizenFormModal: React.FC<CitizenFormModalProps> = ({
  isOpen,
  onClose,
  editCitizen,
  defaultFamilyId,
}) => {
  const { visibleFamilies, addCitizen, updateCitizen } = useApp();

  const [familyId, setFamilyId] = useState('');
  const [nik, setNik] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [hubungan, setHubungan] = useState('Anak');
  const [statusPerkawinan, setStatusPerkawinan] = useState<MaritalStatus>('Belum Kawin');
  const [gender, setGender] = useState<GenderType>('L');
  const [tempatLahir, setTempatLahir] = useState('Bekasi');
  const [tanggalLahir, setTanggalLahir] = useState('2000-01-01');
  const [golonganDarah, setGolonganDarah] = useState('O');
  const [tanggalPerkawinan, setTanggalPerkawinan] = useState('');
  const [namaAyah, setNamaAyah] = useState('');
  const [namaIbu, setNamaIbu] = useState('');
  const [agama, setAgama] = useState('Islam');
  const [pendidikan, setPendidikan] = useState('SMA / Sederajat');
  const [pekerjaan, setPekerjaan] = useState('Karyawan Swasta');
  const [bpjs, setBpjs] = useState<BpjsType>('kis');
  const [disabilitas, setDisabilitas] = useState('tidak');
  const [isTki, setIsTki] = useState(false);
  const [aktaLahir, setAktaLahir] = useState(true);
  const [aktaNikah, setAktaNikah] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (editCitizen) {
        const marital = getCitizenMaritalStatus(editCitizen);
        const mDate = getCitizenMarriageDate(editCitizen);
        const parents = getCitizenParents(editCitizen);
        setFamilyId(editCitizen.family_id);
        setNik(editCitizen.nik);
        setNamaLengkap(editCitizen.nama_lengkap);
        setHubungan(editCitizen.hubungan_keluarga || 'Anggota Keluarga');
        setStatusPerkawinan(marital);
        setGender(editCitizen.jenis_kelamin || 'L');
        setTempatLahir(editCitizen.tempat_lahir || 'Bekasi');
        setTanggalLahir(editCitizen.tanggal_lahir || '2000-01-01');
        setGolonganDarah(getCitizenBloodType(editCitizen));
        setTanggalPerkawinan(mDate !== '-' ? mDate : '');
        setNamaAyah(parents.ayah !== '-' ? parents.ayah : '');
        setNamaIbu(parents.ibu !== '-' ? parents.ibu : '');
        setAgama(editCitizen.agama || 'Islam');
        setPendidikan(editCitizen.pendidikan_terakhir || 'SMA / Sederajat');
        setPekerjaan(editCitizen.pekerjaan || 'Belum / Tidak Bekerja');
        setBpjs(editCitizen.bpjs_kesehatan || 'kis');
        setDisabilitas(editCitizen.disabilitas || 'tidak');
        setIsTki(Boolean(editCitizen.status_tki));
        setAktaLahir(editCitizen.akta_kelahiran !== false);
        setAktaNikah(Boolean(editCitizen.akta_nikah));
      } else {
        setFamilyId(defaultFamilyId || visibleFamilies[0]?.id || '');
        setNik('');
        setNamaLengkap('');
        setHubungan('Anak');
        setStatusPerkawinan('Belum Kawin');
        setGender('L');
        setTempatLahir('Bekasi');
        setTanggalLahir('2000-01-01');
        setGolonganDarah('O');
        setTanggalPerkawinan('');
        setNamaAyah('');
        setNamaIbu('');
        setAgama('Islam');
        setPendidikan('SMA / Sederajat');
        setPekerjaan('Belum / Tidak Bekerja');
        setBpjs('kis');
        setDisabilitas('tidak');
        setIsTki(false);
        setAktaLahir(true);
        setAktaNikah(false);
      }
    }
  }, [isOpen, editCitizen, defaultFamilyId, visibleFamilies]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId) {
      setError('Silakan pilih Kartu Keluarga terlebih dahulu.');
      return;
    }
    if (!nik || nik.length !== 16) {
      setError('NIK harus tepat 16 digit angka.');
      return;
    }
    if (!namaLengkap.trim()) {
      setError('Nama lengkap warga wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      family_id: familyId,
      nik,
      nama_lengkap: namaLengkap.trim().toUpperCase(),
      hubungan_keluarga: hubungan,
      status_perkawinan: statusPerkawinan,
      tanggal_perkawinan:
        statusPerkawinan === 'Belum Kawin'
          ? '-'
          : tanggalPerkawinan.trim() || '-',
      jenis_kelamin: gender,
      tempat_lahir: tempatLahir.trim() || 'Bekasi',
      tanggal_lahir: tanggalLahir,
      golongan_darah: golonganDarah || 'O',
      nama_ayah: namaAyah.trim().toUpperCase() || '-',
      nama_ibu: namaIbu.trim().toUpperCase() || '-',
      agama,
      pendidikan_terakhir: pendidikan,
      pekerjaan: pekerjaan.trim() || 'Belum / Tidak Bekerja',
      bpjs_kesehatan: bpjs,
      disabilitas,
      status_tki: isTki,
      akta_kelahiran: aktaLahir,
      akta_nikah: aktaNikah,
    };

    const res = editCitizen
      ? await updateCitizen(editCitizen.id, payload)
      : await addCitizen(payload);

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Gagal menyimpan data warga.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90dvh] flex flex-col overflow-hidden animate-slide-up">
        {/* Fixed Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0 bg-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-sky-600 flex items-center justify-center">
              {editCitizen ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {editCitizen ? 'Edit Data Warga' : 'Tambah Warga Baru (NIK)'}
              </h3>
              <p className="text-[11px] text-slate-500">Sinkron otomatis dengan Supabase Cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
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

          {/* Kartu Keluarga Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kartu Keluarga (No. KK - Kepala Keluarga)
            </label>
            <select
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="">-- Pilih Kartu Keluarga --</option>
              {visibleFamilies.map((f: Family) => (
                <option key={f.id} value={f.id}>
                  {f.no_kk} - {f.kepala_keluarga} (RT {f.rt}/RW {f.rw})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIK (16 Digit)
              </label>
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                placeholder="9999990000000001 (contoh)"
                className="w-full p-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                placeholder="NAMA LENGKAP"
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none uppercase focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hubungan</label>
              <select
                value={hubungan}
                onChange={(e) => setHubungan(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="Kepala Keluarga">Kepala Keluarga</option>
                <option value="Istri">Istri</option>
                <option value="Anak">Anak</option>
                <option value="Orang Tua">Orang Tua</option>
                <option value="Mertua">Mertua</option>
                <option value="Famili Lain">Famili Lain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as GenderType)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Nikah</label>
              <select
                value={statusPerkawinan}
                onChange={(e) => setStatusPerkawinan(e.target.value as MaritalStatus)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="Belum Kawin">Belum Kawin</option>
                <option value="Kawin">Kawin</option>
                <option value="Cerai Hidup">Cerai Hidup</option>
                <option value="Cerai Mati">Cerai Mati</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
                required
              />
            </div>
          </div>

          {/* Golongan Darah & Tanggal Perkawinan */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Golongan Darah</label>
              <select
                value={golonganDarah}
                onChange={(e) => setGolonganDarah(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none font-semibold"
              >
                <option value="O">O</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="Tidak Tahu">Tidak Tahu</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Perkawinan
              </label>
              <input
                type="date"
                value={statusPerkawinan === 'Belum Kawin' ? '' : tanggalPerkawinan}
                onChange={(e) => setTanggalPerkawinan(e.target.value)}
                disabled={statusPerkawinan === 'Belum Kawin'}
                placeholder="-"
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Nama Orang Tua (Nama Ayah & Nama Ibu) */}
          <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-200/80 space-y-2">
            <span className="block text-[11px] font-extrabold text-sky-900 uppercase tracking-wider">
              Nama Orang Tua Kandung
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Ayah
                </label>
                <input
                  type="text"
                  value={namaAyah}
                  onChange={(e) => setNamaAyah(e.target.value)}
                  placeholder="NAMA LENGKAP AYAH"
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 outline-none uppercase focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Ibu
                </label>
                <input
                  type="text"
                  value={namaIbu}
                  onChange={(e) => setNamaIbu(e.target.value)}
                  placeholder="NAMA LENGKAP IBU"
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 outline-none uppercase focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Agama</label>
              <select
                value={agama}
                onChange={(e) => setAgama(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="Islam">Islam</option>
                <option value="Kristen">Kristen</option>
                <option value="Katolik">Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Konghucu">Konghucu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pendidikan</label>
              <select
                value={pendidikan}
                onChange={(e) => setPendidikan(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="Tidak / Belum Sekolah">Tidak / Belum Sekolah</option>
                <option value="SD / Sederajat">SD / Sederajat</option>
                <option value="SMP / Sederajat">SMP / Sederajat</option>
                <option value="SMA / Sederajat">SMA / Sederajat</option>
                <option value="SMK / Sederajat">SMK / Sederajat</option>
                <option value="D3 Kebidanan">Diploma (D1-D3)</option>
                <option value="S1 Ekonomi">Sarjana (S1)</option>
                <option value="Magister (S2)">Magister (S2)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan</label>
              <input
                type="text"
                value={pekerjaan}
                onChange={(e) => setPekerjaan(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">BPJS Kesehatan</label>
              <select
                value={bpjs}
                onChange={(e) => setBpjs(e.target.value as BpjsType)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="kis">BPJS KIS / PBI</option>
                <option value="mandiri">BPJS Mandiri</option>
                <option value="tidak">Tidak Ada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Disabilitas</label>
              <select
                value={disabilitas}
                onChange={(e) => setDisabilitas(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="tidak">Tidak Ada</option>
                <option value="daksa">Disabilitas Daksa</option>
                <option value="tunanetra">Tunanetra</option>
                <option value="tunarungu">Tunarungu / Wicara</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status TKI</label>
              <select
                value={isTki ? 'true' : 'false'}
                onChange={(e) => setIsTki(e.target.value === 'true')}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
              >
                <option value="false">Bukan TKI</option>
                <option value="true">TKI Luar Negeri</option>
              </select>
            </div>
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
              <span>{isSubmitting ? 'Menyimpan...' : editCitizen ? 'Simpan Perubahan' : 'Simpan Warga'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

