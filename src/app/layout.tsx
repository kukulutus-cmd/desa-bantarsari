import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context';
import { appName, villageName } from '@/lib/branding';

export const metadata: Metadata = {
  title: `${appName} | ${villageName}`,
  description: `${appName} untuk ${villageName}.`,
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slate-900 text-slate-800 antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
