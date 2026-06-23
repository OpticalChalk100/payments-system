import type { Metadata } from 'next';
import './globals.css';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';

import Script from 'next/script';

export const metadata: Metadata = {
  title: 'FinTech Digital Wallet / Unseen Studio',
  description: 'Secure interactive ledger built with high-performance animations and visual mechanics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased scroll-smooth">
      <body className="bg-bg-main text-accent-cream selection:bg-accent-cream selection:text-bg-main">
        <Script src="https://unpkg.com/html5-qrcode" strategy="afterInteractive" />
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
