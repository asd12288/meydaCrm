import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider, ThemeScript } from '@/lib/theme';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Meyda - CRM Solution',
  description: 'Systeme de gestion des leads',
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
