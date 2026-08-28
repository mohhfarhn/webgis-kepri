import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: 'Peta Cagar Budaya — WebGIS Kepulauan Riau',
  description: 'Sistem Informasi Geografis pemetaan situs cagar budaya di seluruh wilayah Kepulauan Riau.',
};

import { cookies } from 'next/headers';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'light';
  
  return (
    <html lang="id" className={plusJakartaSans.variable} data-theme={theme}>
      <body style={{ margin: 0, padding: 0 }}>
        <a href="#main-content" className="skip-link">
          Langsung ke konten
        </a>
        {children}
      </body>
    </html>
  );
}