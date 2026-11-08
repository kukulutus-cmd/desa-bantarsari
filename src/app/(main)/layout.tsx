'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { NoteModal } from '@/components/NoteModal';
import { AddKKModal } from '@/components/AddKKModal';
import { useApp } from '@/lib/context';
import { MessageSquarePlus, Plus, KeyRound } from 'lucide-react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentProfile, isAuthenticated, isLoading } = useApp();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isAddKKModalOpen, setIsAddKKModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!currentProfile || !isAuthenticated)) {
      router.replace('/login');
    }
  }, [isLoading, currentProfile, isAuthenticated, router]);

  if (isLoading || !currentProfile || !isAuthenticated) {
    return (
      <div className="fixed inset-0 h-[100dvh] w-full bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center shadow-xl max-w-xs w-full space-y-2">
          <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto animate-pulse">
            <KeyRound className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">
            Memverifikasi sesi akun...
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = currentProfile?.role === 'admin';
  const appFrameWidth = isAdmin
    ? 'w-full max-w-none 2xl:max-w-[1600px]'
    : 'w-full max-w-md md:max-w-3xl lg:max-w-5xl';
  const hideFab =
    pathname.startsWith('/warga') ||
    pathname.startsWith('/kk') ||
    pathname.startsWith('/data') ||
    pathname.startsWith('/pengaturan');

  return (
    <div className={`fixed inset-0 h-[100dvh] w-full ${isAdmin ? 'bg-slate-100' : 'bg-slate-900'} flex justify-center overflow-hidden`}>
      {/* Admin uses the full desktop workspace; other roles keep the compact app frame. */}
      <div className={`${appFrameWidth} bg-slate-50 h-full flex flex-col relative shadow-2xl overflow-hidden border-x border-slate-200/50`}>
        {/* Top App Header - Locked at Top (Never scrolls) */}
        <div className="flex-shrink-0 z-30">
          <Header />
        </div>

        {/* Main Workspace - Flex Column so each tab can lock its own top head and scroll only its inner content */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          {children}
        </main>

        {/* Global Floating Action Button for RT/RW/Kadus (Catatan) or Admin (Tambah KK) */}
        {!hideFab && (
          <div className="absolute bottom-20 right-4 z-30 flex flex-col items-end gap-2 pointer-events-none">
            <div className="pointer-events-auto">
              {isAdmin ? (
                <button
                  onClick={() => setIsAddKKModalOpen(true)}
                  className="p-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg hover:shadow-sky-500/40 active:scale-90 transition-all flex items-center justify-center group"
                  title="Tambah Kartu Keluarga Baru"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pl-0 group-hover:pl-1.5">
                    Tambah KK
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setIsNoteModalOpen(true)}
                  className="p-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg hover:shadow-sky-500/40 active:scale-90 transition-all flex items-center justify-center group"
                  title="Kirim Catatan Data Wilayah"
                >
                  <MessageSquarePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pl-0 group-hover:pl-1.5">
                    Catat Data
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation - Locked at Bottom (Never scrolls) */}
        <div className="flex-shrink-0 z-30 w-full">
          <BottomNav />
        </div>

        {/* Global Note Modal */}
        <NoteModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
        />

        {/* Global Add KK Modal for Admin */}
        {isAdmin && (
          <AddKKModal
            isOpen={isAddKKModalOpen}
            onClose={() => setIsAddKKModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
