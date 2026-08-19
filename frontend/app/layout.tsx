import type { Metadata } from 'next';
//@ts-ignore
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  title: 'OneWeb - Home Service Marketplace',
  description: 'Book trusted home services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
        {children}
        </Providers>
      </body>
    </html>
  );
}