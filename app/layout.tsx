import type { Metadata, Viewport } from 'next';
import { DM_Mono, Manrope } from 'next/font/google';
import './globals.css';

const sans = Manrope({ subsets: ['latin'], weight: ['400', '600', '800'], variable: '--font-sans' });
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Cron Explainer | APIVerve Template',
  description: 'Type a cron expression and read it in plain English, with its next run times. An APIVerve template.'
};

export const viewport: Viewport = {
  themeColor: '#101418'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
