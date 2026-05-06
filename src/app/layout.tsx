import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import Script from 'next/script';
import MigrationBanner from '@/components/platform/MigrationBanner';
import { JsonLd } from '@/components/seo/JsonLd';
import { siteGraph } from '@/lib/seo/schema';
import { SITE_ORIGIN } from '@/lib/site';
import './globals.css';
import './redesign.css';

// Fonts for the redesign. CSS variables are referenced in tailwind.config.ts
// under fontFamily.redesign-sans and redesign-mono.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  // default is the homepage title. Leaf pages override via generateMetadata
  // or export const metadata = { title: '...' }, and title.template wraps
  // their bare title with ' | ArmorInnovate'. Do NOT append the suffix
  // manually in leaf pages — that produces ' | ArmorInnovate | ArmorInnovate'.
  title: {
    default: 'ArmorInnovate OS — IEC 62443 & ICS Pentesting Operating System',
    template: '%s | ArmorInnovate',
  },
  description:
    'The professional operating system for ICS / SCADA security: IEC 62443 certification, hands-on OT pentesting labs, and live vulnerability intelligence — in one disciplined platform.',
  keywords: [
    'IEC 62443', 'ICS security', 'OT security', 'SCADA', 'PLC pentesting',
    'industrial cybersecurity', 'Modbus', 'S7comm', 'EtherNet/IP', 'CISA ICS-CERT',
    'NIST SP 800-82', 'OT vulnerability intelligence', 'industrial control systems',
    'cybersecurity training', 'pentesting labs',
  ],
  // openGraph.siteName and locale are fine to set at root because they're
  // the same for every page. url, title, and description must be owned
  // by each page (see src/app/page.tsx for the homepage's own OG block).
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ArmorInnovate',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
  // NO root-level alternates.canonical. The root-level canonical leaked
  // into every child route that did not explicitly set its own, causing
  // 61 pages to canonicalise to the homepage. Every indexable page sets
  // its own canonical via buildPageMetadata({ path }) or an explicit
  // alternates: { canonical: '/its/path' } block.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <JsonLd data={siteGraph()} id="gt-site-graph" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SGMKCB3SRY"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SGMKCB3SRY');
          `}
        </Script>
      </head>
      <body className="gt-redesign-root min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
        <ClerkProvider>
          <MigrationBanner />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
