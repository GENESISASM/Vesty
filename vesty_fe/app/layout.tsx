import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth_context';
import { Poppins, Quicksand } from 'next/font/google';

const geist = Geist({ subsets: ['latin'] });

const poppins = Poppins({ 
  weight: ['400', '600', '700'], 
  subsets: ['latin'],
  variable: '--font-poppins',
});

const quicksand = Quicksand({ 
  weight: ['500', '700'], 
  subsets: ['latin'],
  variable: '--font-quicksand',
});

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
      <body className={`${geist.className} ${poppins.variable} ${quicksand.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}