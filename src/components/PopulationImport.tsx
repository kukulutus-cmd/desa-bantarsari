'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useApp } from '@/lib/context';
import { downloadFile, parseSpreadsheetFile } from '@/lib/spreadsheet';
import { preparePopulationImport, toPopulationImportPayload } from '@/lib/importPopulation';

const TEMPLATE_HEADERS = [
  'Nomor Kartu Keluarga', 'Nama Kepala Keluarga', 'Nama Lengkap Warga', 'NIK',
  'Hubungan Keluarga', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir',
  'Pendidikan Terakhir', 'Pekerjaan', 'Alamat Lengkap', 'Dusun', 'RW', 'RT',
  'Status Perkawinan', 'BPJS Kesehatan', 'Golongan Darah', 'Agama',
  'Nomor Rumah', 'Penerangan Listrik', 'Fasilitas MCK', 'Bantuan Sosial',
];

export function PopulationImport() {
  const { currentProfile, families, citizens, importBulkData, isSupabaseConnected } = useApp();
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof preparePopulationImport> | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const synthetic = useMemo(() => Boolean(fileName.toLowerCase().includes('uji')
    || preview?.citizens.some((c) => c.nama_lengkap.startsWith('Data Uji ') || c.nik.startsWith('99'))), [fileName, preview]);

  if (currentProfile?.role !== 'admin') return null;

  async function selectFile(file?: File) {
    setMessage(''); setConfirmed(false); setPreview(null); setFileName(file?.name || '');
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setMessage('Ukuran berkas maksimal 10 MB.'); return; }
    try {
      const rows = await parseSpreadsheetFile(file);
      setPreview(preparePopulationImport(rows, families, citizens));
    } catch {
      setMessage('Berkas tidak bisa dibaca. Gunakan format CSV atau Excel (.xlsx/.xls).');
    }
  }

  async function runImport() {
    if (!preview || preview.errors.length || !confirmed || synthetic || !isSupabaseConnected) return;
    setBusy(true); setMessage('');
    const payload = toPopulationImportPayload(preview.families, preview.citizens);
    const result = await importBulkData(payload.families as never[], payload.citizens as never[]);
    setBusy(false);
    if (!result.success) { setMessage(result.error || 'Impor gagal. Tidak ada data yang disimpan.'); return; }
    setMessage(`Impor berhasil: ${result.familiesCount} KK dan ${result.citizensCount} warga ditambahkan.`);
    setPreview(null); setFileName(''); setConfirmed(false);
  }

  return (
    <section className="mx-auto mt-5 max-w-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-xl font-extrabold text-slate-900">Impor data warga</h2>
          <p className="mt-1 text-sm text-slate-600">Unggah CSV atau Excel. Data diperiksa dulu sebelum disimpan.</p></div>
        <FileSpreadsheet className="h-6 w-6 text-sky-700" />
      </div>
      <button type="button" onClick={() => downloadFile(`${TEMPLATE_HEADERS.join(',')}\r\n`, 'template-impor-warga.csv', 'text/csv;charset=utf-8')}
        className="mt-4 inline-flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700">
        <Download className="h-4 w-4" /> Unduh template kosong
      </button>
      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-slate-400 bg-slate-50 px-4 py-7 text-sm font-bold text-slate-700 hover:bg-slate-100">
        <Upload className="h-5 w-5" /> {fileName || 'Pilih berkas CSV atau Excel'}
        <input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={(event) => void selectFile(event.target.files?.[0])} />
      </label>
      {!isSupabaseConnected && <p className="mt-3 text-sm text-red-700">Database belum tersambung; impor tidak tersedia.</p>}
      {synthetic && <p className="mt-3 flex gap-2 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0" />Berkas ini tampak berisi data uji fiktif. Impor ke database desa produksi diblokir.</p>}
      {preview && <div className="mt-4 border border-slate-200 p-4">
        <p className="font-bold text-slate-900">Pratinjau: {preview.families.length} KK · {preview.citizens.length} warga</p>
        {preview.errors.length > 0 ? <div className="mt-3 text-sm text-red-700"><p className="font-bold">Perbaiki kesalahan berikut:</p><ul className="ml-5 list-disc">{preview.errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>
          : <p className="mt-2 flex items-center gap-2 text-sm text-green-800"><CheckCircle2 className="h-4 w-4" />Semua baris lolos pemeriksaan dasar. Data akan disimpan sekaligus.</p>}
        {preview.citizens.length > 0 && <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Nama</th><th className="p-2">NIK</th><th className="p-2">Nomor KK</th></tr></thead><tbody>{preview.citizens.slice(0, 5).map((citizen) => <tr key={citizen.id} className="border-t"><td className="p-2">{citizen.nama_lengkap}</td><td className="p-2">••••••••••••{citizen.nik.slice(-4)}</td><td className="p-2">••••••••••••{preview.families.find((f) => f.id === citizen.family_id)?.no_kk.slice(-4)}</td></tr>)}</tbody></table><p className="mt-1 text-slate-500">Maksimal 5 baris pratinjau; nomor identitas disamarkan.</p></div>}
        {preview.errors.length === 0 && !synthetic && <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />Saya sudah memastikan data ini benar dan memang milik Desa Bantarsari.</label>}
        <button type="button" onClick={() => void runImport()} disabled={busy || !confirmed || Boolean(preview.errors.length) || synthetic || !isSupabaseConnected}
          className="mt-4 bg-sky-800 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Mengimpor…' : 'Impor data'}</button>
      </div>}
      {message && <p role="status" className="mt-3 border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      <p className="mt-4 text-xs leading-relaxed text-slate-500">Berkas diproses di browser dan hanya data yang sudah ditinjau yang dikirim. NIK ditampilkan tersamar dalam pratinjau.</p>
    </section>
  );
}
