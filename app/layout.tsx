import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider, ThemeScript } from '@/lib/theme';
import { ToastProvider } from '@/modules/shared';
import 'simplebar-react/dist/simplebar.min.css';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pulse CRM',
  description: 'Gestion des leads - Rapide, Fiable, Sécurisé',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-white dark:bg-dark text-link dark:text-darklink`}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
