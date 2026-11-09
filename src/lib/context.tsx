'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient, hasSupabaseConfig } from '@/lib/supabase/client';
import type { Profile, Family, Citizen, Note, NoteStatus, VillageStats, VillageConfig } from './types';

const supabase = hasSupabaseConfig() ? createClient() : null;
const EMPTY_VILLAGE: VillageConfig = {
  nama_desa: 'Desa Bantarsari',
  kepala_desa: '',
  alamat_desa: '',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
  kode_pos: '',
};

type Result = { success: boolean; error?: string };
type AppContextType = {
  currentProfile: Profile | null;
  allProfiles: Profile[];
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  villageConfig: VillageConfig;
  updateVillageConfig: (partial: Partial<VillageConfig>) => Promise<Result>;
  addProfile: (data: Omit<Profile, 'id' | 'created_at'>) => Promise<Result>;
  updateProfile: (id: string, data: Partial<Profile>) => Promise<Result>;
  deleteProfile: (id: string) => Promise<Result>;
  families: Family[];
  citizens: Citizen[];
  notes: Note[];
  visibleFamilies: Family[];
  visibleCitizens: Citizen[];
  visibleNotes: Note[];
  stats: VillageStats;
  isOnline: boolean;
  isSyncingWithSupabase: boolean;
  lastSyncedAt: string | null;
  refreshFromSupabase: () => Promise<void>;
  addNote: (note: { family_id?: string | null; citizen_id?: string | null; message: string; family_no_kk?: string; citizen_name?: string; citizen_nik?: string }) => Promise<Result>;
  updateNoteStatus: (id: string, status: NoteStatus) => Promise<void>;
  deleteNote: (id: string) => Promise<Result>;
  addFamily: (family: Omit<Family, 'id' | 'created_at'>) => Promise<{ success: boolean; data?: Family; error?: string }>;
  updateFamily: (id: string, partial: Partial<Family>) => Promise<Result>;
  deleteFamily: (id: string) => Promise<Result>;
  addCitizen: (citizen: Omit<Citizen, 'id' | 'created_at'>) => Promise<{ success: boolean; data?: Citizen; error?: string }>;
  updateCitizen: (id: string, partial: Partial<Citizen>) => Promise<Result>;
  deleteCitizen: (id: string) => Promise<Result>;
  importBulkData: (families: Family[], citizens: Citizen[]) => Promise<{ success: boolean; familiesCount: number; citizensCount: number; error?: string }>;
  syncToSupabase: () => Promise<{ success: boolean; message: string }>;
  fetchFromSupabase: () => Promise<{ success: boolean; message: string; count: number }>;
  isSupabaseConnected: boolean;
  getFamilyById: (id: string) => Family | undefined;
  getCitizensByFamilyId: (id: string) => Citizen[];
};

const AppContext = createContext<AppContextType | undefined>(undefined);
const emptyStats: VillageStats = {
  totalRumah: 0, totalKK: 0, totalJiwa: 0, lakiLaki: 0, perempuan: 0,
  wajibKtp: 0, lansia: 0, bpjsKis: 0, bpjsMandiri: 0, bpjsNone: 0,
  bansosBpnt: 0, bansosPkh: 0, bansosKip: 0, bansosBlt: 0, disabilitas: 0,
  tki: 0, pendingNotes: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [villageConfig, setVillageConfig] = useState<VillageConfig>(EMPTY_VILLAGE);
  const [families, setFamilies] = useState<Family[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncingWithSupabase, setIsSyncingWithSupabase] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const clearData = useCallback(() => {
    setCurrentProfile(null);
    setIsAuthenticated(false);
    setFamilies([]);
    setCitizens([]);
    setNotes([]);
  }, []);

  const refreshFromSupabase = useCallback(async () => {
    if (!supabase) {
      clearData();
      setVillageConfig(EMPTY_VILLAGE);
      setIsLoading(false);
      return;
    }
    setIsSyncingWithSupabase(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData.user;
      if (userError || !user) {
        clearData();
        setVillageConfig(EMPTY_VILLAGE);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('id,username,full_name,role,assigned_dusun,assigned_rw,assigned_rt,phone,created_at')
        .eq('id', user.id).eq('active', true).maybeSingle();
      if (profileError || !profile) {
        clearData();
        return;
      }

      setCurrentProfile(profile as Profile);
      setIsAuthenticated(true);

      const [villageRes, familiesRes, citizensRes, notesRes] = await Promise.all([
        supabase.from('village_config').select('*').eq('id', true).maybeSingle(),
        supabase.from('families').select('*').order('created_at', { ascending: false }),
        supabase.from('citizens').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
      ]);
      if (familiesRes.error) throw familiesRes.error;
      if (citizensRes.error) throw citizensRes.error;
      if (notesRes.error) throw notesRes.error;
      setVillageConfig(villageRes.data ? { ...EMPTY_VILLAGE, ...villageRes.data } : EMPTY_VILLAGE);
      setFamilies((familiesRes.data || []) as Family[]);
      setCitizens((citizensRes.data || []) as Citizen[]);
      setNotes((notesRes.data || []) as Note[]);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      console.error('Gagal memuat data aplikasi.');
      clearData();
    } finally {
      setIsSyncingWithSupabase(false);
      setIsLoading(false);
    }
  }, [clearData]);

  useEffect(() => {
    void refreshFromSupabase();
    const authListener = supabase?.auth.onAuthStateChange(() => {
      queueMicrotask(() => void refreshFromSupabase());
    });
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      authListener?.data.subscription.unsubscribe();
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, [refreshFromSupabase]);

  const currentTerritory = useCallback((dusun?: string | null, rw?: string | null, rt?: string | null) => {
    if (currentProfile?.role === 'admin') return Boolean(dusun && rw && rt);
    return Boolean(
      currentProfile?.assigned_dusun &&
      currentProfile.assigned_dusun === dusun &&
      (currentProfile.role === 'kadus' || currentProfile.assigned_rw === rw) &&
      (currentProfile.role !== 'rt' || currentProfile.assigned_rt === rt)
    );
  }, [currentProfile]);

  const stats = useMemo<VillageStats>(() => {
    const ages = citizens.map((c) => {
      const born = new Date(c.tanggal_lahir);
      return Number.isNaN(born.getTime()) ? 0 : Math.floor((Date.now() - born.getTime()) / 31557600000);
    });
    return {
      ...emptyStats,
      totalRumah: new Set(families.map((f) => [f.dusun, f.rw, f.rt, f.no_rumah].join('|'))).size,
      totalKK: families.length,
      totalJiwa: citizens.length,
      lakiLaki: citizens.filter((c) => c.jenis_kelamin === 'L').length,
      perempuan: citizens.filter((c) => c.jenis_kelamin === 'P').length,
      wajibKtp: ages.filter((age) => age >= 17).length,
      lansia: ages.filter((age) => age >= 60).length,
      bpjsKis: citizens.filter((c) => c.bpjs_kesehatan === 'kis').length,
      bpjsMandiri: citizens.filter((c) => c.bpjs_kesehatan === 'mandiri').length,
      bpjsNone: citizens.filter((c) => c.bpjs_kesehatan === 'tidak').length,
      bansosBpnt: families.filter((f) => f.bantuan_sosial === 'bpnt').length,
      bansosPkh: families.filter((f) => f.bantuan_sosial === 'pkh').length,
      bansosKip: families.filter((f) => f.bantuan_sosial === 'kip').length,
      bansosBlt: families.filter((f) => f.bantuan_sosial === 'blt').length,
      disabilitas: citizens.filter((c) => c.disabilitas && c.disabilitas !== 'tidak').length,
      tki: citizens.filter((c) => c.status_tki).length,
      pendingNotes: notes.filter((n) => n.status === 'pending').length,
    };
  }, [families, citizens, notes]);

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    clearData();
  };

  const updateVillageConfig = async (partial: Partial<VillageConfig>): Promise<Result> => {
    if (!supabase) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };
    if (currentProfile?.role !== 'admin') return { success: false, error: 'Akses admin diperlukan.' };
    const payload = { ...villageConfig, ...partial, id: true, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('village_config').upsert(payload, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    setVillageConfig({ ...EMPTY_VILLAGE, ...payload });
    return { success: true };
  };

  const blockedAccountChange = async (): Promise<Result> => ({
    success: false,
    error: 'Buat akun melalui Supabase Auth, lalu pasangkan profil wilayah melalui prosedur admin yang disetujui.',
  });
  const addProfile = async (_data: Omit<Profile, 'id' | 'created_at'>) => blockedAccountChange();
  const updateProfile = async (_id: string, _data: Partial<Profile>) => blockedAccountChange();
  const deleteProfile = async (_id: string) => blockedAccountChange();

  const addFamily = async (input: Omit<Family, 'id' | 'created_at'>) => {
    if (!supabase) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };
    if (currentProfile?.role !== 'admin') return { success: false, error: 'Akses admin diperlukan.' };
    const { members, members_count, ...row } = input;
    const { data, error } = await supabase.from('families').insert(row).select('*').single();
    if (error) return { success: false, error: error.message };
    await refreshFromSupabase();
    return { success: true, data: data as Family };
  };

  const updateFamily = async (id: string, partial: Partial<Family>): Promise<Result> => {
    if (!supabase) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };
    if (currentProfile?.role !== 'admin') return { success: false, error: 'Akses admin diperlukan.' };
    const { members, members_count, ...row } = partial;
    const { error } = await supabase.from('families').update(row).eq('id', id);
    if (error) return { success: false, error: error.message };
    await refreshFromSupabase();
    return { success: true };
  };
  const deleteFamily = async (id: string): Promise<Result> => {
    if (!supabase) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };
    if (currentProfile?.role !== 'admin') return { success: false, error: 'Akses admin diperlukan.' };
    const { error } = await supabase.from('families').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    await refreshFromSupabase();
    return { success: true };
  };
  const addCitizen = async (input: Omit<Citizen, 'id' | 'created_at'>) => {
    if (!supabase) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };
    if (currentProfile?.role !== 'admin') return { success: false, error: 'Akses admin diperlukan.' };
    const { family, ...row } = input;
    const { data, error } = await supabase.from('citizens').insert(row).select('*').single();
    if (error) return { success: false, error: error.message };
    await refreshFromSupabase();
    return { success: true, data: data as Citizen };
  };
  const updateCitizen = async (id: string, partial: Partial<Citizen>): Promise<Result> => {
    if (!supabase) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };
    if (currentProfile?.role !== 'admin') return { success: false, error: 'Akses admin diperlukan.' };
    const { family, ...row } = partial;
    const { error } = await supabase.from('citizens').update(row).eq('id', id);
    if (error) return { success: false, error: error.message };
    await refreshFromSupabase();
    return { success: true };
  };
  const deleteCitizen = async (id: string): Promise<Result> => {
    if (!supabase) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };
    if (currentProfile?.role !== 'admin') return { success: false, error: 'Akses admin diperlukan.' };
    const { error } = await supabase.from('citizens').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    await refreshFromSupabase();
    return { success: true };
  };

  const addNote = async (input: { family_id?: string | null; citizen_id?: string | null; message: string; family_no_kk?: string; citizen_name?: string; citizen_nik?: string }): Promise<Result> => {
    if (!supabase) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };
    if (!currentProfile) return { success: false, error: 'Silakan masuk kembali.' };
    let territory = {
      dusun: currentProfile.assigned_dusun || '',
      rw: currentProfile.assigned_rw || '',
      rt: currentProfile.assigned_rt || '',
    };
    if (input.family_id) {
      const family = families.find((item) => item.id === input.family_id);
      if (family) territory = { dusun: family.dusun, rw: family.rw, rt: family.rt };
    }
    if (!territory.dusun || !territory.rw || !territory.rt || !currentTerritory(territory.dusun,territory.rw,territory.rt)) {
      return { success: false, error: 'Pilih wilayah tugas yang valid.' };
    }
    const { error } = await supabase.from('notes').insert({
      family_id: input.family_id || null,
      citizen_id: input.citizen_id || null,
      message: input.message.trim(),
      ...territory,
      author_id: currentProfile.id,
    });
    if (error) return { success: false, error: error.message };
    await refreshFromSupabase();
    return { success: true };
  };
  const updateNoteStatus = async (id: string, status: NoteStatus) => {
    if (!supabase) return;
    await supabase.from('notes').update({ status }).eq('id', id);
    await refreshFromSupabase();
  };
  const deleteNote = async (id: string): Promise<Result> => {
    if (!supabase) return { success: false, error: 'Koneksi Supabase belum dikonfigurasi.' };
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    await refreshFromSupabase();
    return { success: true };
  };

  const importBulkData = async (inputFamilies: Family[], inputCitizens: Citizen[]) => {
    if (!supabase) return { success: false, familiesCount: 0, citizensCount: 0, error: 'Koneksi Supabase belum dikonfigurasi.' };
    if (currentProfile?.role !== 'admin') return { success: false, familiesCount: 0, citizensCount: 0, error: 'Akses admin diperlukan.' };
    if (!inputFamilies.length || !inputCitizens.length) return { success: false, familiesCount: 0, citizensCount: 0, error: 'Tidak ada data untuk diimpor.' };

    const familiesPayload = inputFamilies.map((family) => ({
      id: family.id,
      no_kk: family.no_kk,
      kepala_keluarga: family.kepala_keluarga,
      alamat: family.alamat,
      no_rumah: family.no_rumah || '01',
      dusun: family.dusun,
      rw: family.rw,
      rt: family.rt,
      status_barcode: family.status_barcode ?? true,
      status_update: family.status_update ?? true,
      penerangan: family.penerangan || 'meteran',
      fasilitas_mck: family.fasilitas_mck || 'sendiri',
      bantuan_sosial: family.bantuan_sosial || 'none',
    }));
    const citizensPayload = inputCitizens.map((citizen) => ({
      id: citizen.id,
      family_id: citizen.family_id,
      nik: citizen.nik,
      nama_lengkap: citizen.nama_lengkap,
      hubungan_keluarga: citizen.hubungan_keluarga,
      jenis_kelamin: citizen.jenis_kelamin,
      tempat_lahir: citizen.tempat_lahir,
      tanggal_lahir: citizen.tanggal_lahir,
      golongan_darah: citizen.golongan_darah || 'Tidak Tahu',
      agama: citizen.agama || 'Islam',
      pendidikan_terakhir: citizen.pendidikan_terakhir,
      pekerjaan: citizen.pekerjaan,
      status_perkawinan: citizen.status_perkawinan || 'Belum Kawin',
      tanggal_perkawinan: citizen.tanggal_perkawinan || '-',
      nama_ayah: citizen.nama_ayah || '-',
      nama_ibu: citizen.nama_ibu || '-',
      bpjs_kesehatan: citizen.bpjs_kesehatan || 'tidak',
      disabilitas: citizen.disabilitas || 'tidak',
      status_tki: citizen.status_tki ?? false,
      akta_kelahiran: citizen.akta_kelahiran ?? false,
      akta_nikah: citizen.akta_nikah ?? false,
    }));

    const { error } = await supabase.rpc('import_population_batch', {
      p_families: familiesPayload,
      p_citizens: citizensPayload,
    });
    if (error) return { success: false, familiesCount: 0, citizensCount: 0, error: 'Impor dibatalkan. Tidak ada data yang ditambahkan. Periksa duplikasi dan konfigurasi database.' };

    await refreshFromSupabase();
    return { success: true, familiesCount: inputFamilies.length, citizensCount: inputCitizens.length };
  };
  const syncToSupabase = async () => {
    if (!supabase) return { success: false, message: 'Supabase belum dikonfigurasi.' };
    await refreshFromSupabase();
    return { success: true, message: 'Data dimuat ulang dari database dengan pembatasan akses akun.' };
  };
  const fetchFromSupabase = async () => {
    if (!supabase) return { success: false, message: 'Supabase belum dikonfigurasi.', count: 0 };
    await refreshFromSupabase();
    return { success: true, message: 'Data dimuat ulang dari database.', count: families.length + citizens.length };
  };

  const value: AppContextType = {
    currentProfile, allProfiles: currentProfile ? [currentProfile] : [],
    isAuthenticated, isLoading, logout, villageConfig, updateVillageConfig, addProfile, updateProfile, deleteProfile,
    families, citizens, notes, visibleFamilies: families, visibleCitizens: citizens, visibleNotes: notes, stats,
    isOnline, isSyncingWithSupabase, lastSyncedAt, refreshFromSupabase,
    addNote, updateNoteStatus, deleteNote, addFamily, updateFamily, deleteFamily,
    addCitizen, updateCitizen, deleteCitizen, importBulkData, syncToSupabase, fetchFromSupabase,
    isSupabaseConnected: Boolean(supabase),
    getFamilyById: (id) => families.find((f) => f.id === id),
    getCitizensByFamilyId: (id) => citizens.filter((c) => c.family_id === id),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used within AppProvider');
  return value;
}
