import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/components/providers/ReduxProvider';

export const metadata: Metadata = {
  title: 'PharmaCare — Full-Stack Pharmacy Management System',
  description: 'Enterprise grade modern pharmacy inventory, billing, expiry and staff management system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}

