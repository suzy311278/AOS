import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { RedesignFooter } from '@/components/redesign';
import RetirementsClient from './_components/RetirementsClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { datasetSchema, breadcrumbList } from '@/lib/seo/schema';
import { SITE_ORIGIN } from '@/lib/site';

const RETIREMENTS_DATASET = datasetSchema({
  url: `${SITE_ORIGIN}/carbon/retirements`,
  name: 'Greentryst Carbon Retirement Leaderboard',
  description:
    'Aggregated carbon credit retirement volumes by beneficiary across Verra, Gold Standard, ACR, CAR, ART TREES, and other major registries. Updated nightly. Use to verify corporate net-zero claims against the public record.',
  keywords: [
    'carbon credit retirements',
    'voluntary carbon market',
    'VCU retirements',
    'corporate net zero',
    'Verra retirements',
    'Gold Standard retirements',
    'ACR retirements',
    'CAR retirements',
  ],
  variableMeasured: [
    'Credits retired per beneficiary',
    'Retirements by registry',
    'Retirements by methodology',
    'Retirements by vintage',
  ],
  distributionUrl: `${SITE_ORIGIN}/carbon-market-retirements.json`,
  distributionFormat: 'application/json',
  license: `${SITE_ORIGIN}/fair-use`,
});
const RETIREMENTS_BREADCRUMBS = breadcrumbList([
  { name: 'Home', url: '/' },
  { name: 'Carbon', url: '/carbon/market' },
  { name: 'Retirement Leaderboard' },
]);

export const metadata: Metadata = {
  title: 'Carbon Retirement Leaderboard',
  description:
    'Who retired the most carbon credits across Verra, Gold Standard, ACR, CAR, and other registries. Search by beneficiary, filter by registry, and verify corporate net zero claims against the public record.',
  alternates: { canonical: '/carbon/retirements' },
  openGraph: {
    title: 'Carbon Retirement Leaderboard',
    description:
      'Corporate retirement intelligence across 11 carbon registries. Search 2,700+ beneficiaries, see verified retirement volumes.',
    url: '/carbon/retirements',
  },
};

export const dynamic = 'force-static';

export default function Page() {
  return (
    <>
      <JsonLd data={RETIREMENTS_DATASET} />
      <JsonLd data={RETIREMENTS_BREADCRUMBS} />
      <Nav />
      <h1 className="sr-only">Carbon Retirement Leaderboard</h1>
      <RetirementsClient />
      <RedesignFooter />
    </>
  );
}
