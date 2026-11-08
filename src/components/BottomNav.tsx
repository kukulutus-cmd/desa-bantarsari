'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import {
  Home,
  FolderTree,
  Users,
  MessageSquareText,
  UserCheck,
  Settings,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { visibleNotes, currentProfile } = useApp();

  const pendingNotesCount = visibleNotes.filter((n) => n.status === 'pending').length;
  const isAdmin = currentProfile?.role === 'admin';

  const navItems = [
    {
      label: 'Beranda',
      href: '/dashboard',
      icon: Home,
      exact: true,
    },
    {
      label: 'Data KK',
      href: '/kk',
      icon: FolderTree,
      exact: false,
    },
    {
      label: 'Warga',
      href: '/warga',
      icon: Users,
      exact: false,
    },
    {
      label: 'Catatan',
      href: '/catatan',
      icon: MessageSquareText,
      exact: false,
      badge: pendingNotesCount > 0 ? pendingNotesCount : undefined,
    },
    ...(isAdmin
      ? [
          {
            label: 'Pengaturan',
            href: '/pengaturan',
            icon: Settings,
            exact: false,
          },
        ]
      : []),
    {
      label: 'Profil',
      href: '/profil',
      icon: UserCheck,
      exact: false,
    },
  ];

  return (
    <nav className="w-full bg-gradient-to-r from-blue-900 via-sky-800 to-cyan-800 border-t border-white/15 shadow-[0_-4px_20px_rgba(0,0,0,0.18)] pb-[env(safe-area-inset-bottom)] select-none">
      <div
        className={`grid ${
          isAdmin ? 'grid-cols-6' : 'grid-cols-5'
        } h-14 sm:h-16 md:h-[72px] items-center px-0.5 md:px-4`}
      >
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-all group relative ${
                isActive
                  ? 'text-cyan-100 font-bold'
                  : 'text-white/75 hover:text-white font-medium'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 md:w-[22px] md:h-[22px] transition-colors ${
                      isActive ? 'text-cyan-100 stroke-[2.4]' : 'text-white/75'
                    }`}
                  />
                </div>

                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[9px] font-extrabold px-1 rounded-full min-w-[15px] text-center border-2 border-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[9px] sm:text-[10px] md:text-[11px] leading-tight mt-0.5 tracking-tight whitespace-nowrap transition-all ${
                  isActive ? 'text-cyan-100 font-bold' : 'text-white/75'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
