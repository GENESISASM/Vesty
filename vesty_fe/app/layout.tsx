import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth_context';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vesty',
  description: 'Aplikasi pencatatan keuangan & stok berdua',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}