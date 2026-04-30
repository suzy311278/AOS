import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';
import CarbonMarketClient from './_components/CarbonMarketClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList } from '@/lib/seo/schema';
import { SITE_ORIGIN } from '@/lib/site';

const CARBON_MARKET_BREADCRUMBS = breadcrumbList([
  { name: 'Home', url: '/' },
  { name: 'Carbon Market Intelligence' },
]);

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Carbon Market Intelligence',
  description:
    'Search 12,234 carbon credit projects from Verra VCS, CCB, PWRP, Gold Standard, American Carbon Registry (ACR), Climate Action Reserve (CAR), and ART TREES. Filter by methodology, country, vintage, and certification. Updated nightly.',
  alternates: { canonical: '/carbon/market' },
  openGraph: {
    title: 'Carbon Market Intelligence',
    description:
      'A live index of 12,234 voluntary and compliance carbon market projects across Verra, Gold Standard, ACR, CAR, and ART TREES.',
    url: '/carbon/market',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carbon Market Intelligence',
    description:
      'A live index of 12,234 carbon market projects across Verra, Gold Standard, ACR, CAR, and ART TREES.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Greentryst Carbon Market Index',
  description:
    'Normalized catalogue of voluntary and compliance carbon market projects from Verra VCS, Verra CCB, Verra PWRP, Gold Standard, American Carbon Registry (ACR), Climate Action Reserve (CAR) including CAR Compliance (ARB / Ecology), and ART TREES.',
  url: `${SITE_ORIGIN}/carbon/market`,
  creator: { '@type': 'Organization', name: 'Greentryst' },
  distribution: [
    {
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: `${SITE_ORIGIN}/carbon-market-index.json`,
    },
  ],
  variableMeasured: [
    'Projects registered',
    'VCUs issued',
    'VCUs retired',
    'Buffer pool credits',
  ],
  isAccessibleForFree: true,
};

export default function CarbonMarketPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JsonLd data={CARBON_MARKET_BREADCRUMBS} />
      <Nav tone="dark" />
      <h1 className="sr-only">Carbon Market Intelligence</h1>
      <Suspense fallback={null}>
      <CarbonMarketClient />
      </Suspense>
      <RedesignFooter />
    </>
  );
}
