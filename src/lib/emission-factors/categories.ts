// Display names + Lucide icons for each emission factor category.
//
// Client-safe: icon components are re-exported so callers can render them.

import {
  Zap,
  Flame,
  Truck,
  Snowflake,
  Trash2,
  Droplets,
  Wheat,
  Trees,
  Hammer,
  Package,
  DollarSign,
  Thermometer,
  Shapes,
  type LucideIcon,
} from 'lucide-react';

import type { Category } from './types';

export interface CategoryMeta {
  id: Category;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  electricity: {
    id: 'electricity',
    label: 'Electricity',
    shortLabel: 'Electricity',
    description: 'Grid and supplier electricity factors (location and market based).',
    icon: Zap,
  },
  fuels: {
    id: 'fuels',
    label: 'Fuels',
    shortLabel: 'Fuels',
    description: 'Stationary and mobile fuel combustion (gas, oil, coal, biomass).',
    icon: Flame,
  },
  transport: {
    id: 'transport',
    label: 'Transport',
    shortLabel: 'Transport',
    description: 'Passenger, freight, air, sea, and road transport.',
    icon: Truck,
  },
  refrigerants: {
    id: 'refrigerants',
    label: 'Refrigerants',
    shortLabel: 'Refrigerants',
    description: 'HFCs, PFCs, SF6, and other fluorinated gases.',
    icon: Snowflake,
  },
  waste: {
    id: 'waste',
    label: 'Waste',
    shortLabel: 'Waste',
    description: 'Landfill, recycling, composting, and incineration.',
    icon: Trash2,
  },
  water: {
    id: 'water',
    label: 'Water',
    shortLabel: 'Water',
    description: 'Water supply and wastewater treatment.',
    icon: Droplets,
  },
  agriculture: {
    id: 'agriculture',
    label: 'Agriculture',
    shortLabel: 'Agriculture',
    description: 'Livestock, fertiliser, rice cultivation, and soil emissions.',
    icon: Wheat,
  },
  lulucf: {
    id: 'lulucf',
    label: 'Land use',
    shortLabel: 'LULUCF',
    description: 'Land use, land use change and forestry.',
    icon: Trees,
  },
  construction: {
    id: 'construction',
    label: 'Construction',
    shortLabel: 'Construction',
    description: 'Embodied carbon in buildings and infrastructure.',
    icon: Hammer,
  },
  materials: {
    id: 'materials',
    label: 'Materials',
    shortLabel: 'Materials',
    description: 'Cement, steel, plastics, and other production materials.',
    icon: Package,
  },
  sector_spend: {
    id: 'sector_spend',
    label: 'Sector spend (Scope 3)',
    shortLabel: 'Sector spend',
    description: 'EEIO spend-based factors for Scope 3 screening.',
    icon: DollarSign,
  },
  gwp: {
    id: 'gwp',
    label: 'Global Warming Potentials',
    shortLabel: 'GWPs',
    description: 'IPCC GWP values by assessment and horizon.',
    icon: Thermometer,
  },
  other: {
    id: 'other',
    label: 'Other',
    shortLabel: 'Other',
    description: 'Uncategorised or speciality factors.',
    icon: Shapes,
  },
};

export const ALL_CATEGORIES: Category[] = Object.keys(CATEGORY_META) as Category[];

// Business-sector label for each factor category. Used for the Sector column
// in the results table and cross-source sector filtering.
export const SECTOR_BY_CATEGORY: Record<Category, string> = {
  electricity: 'Energy',
  fuels: 'Energy',
  transport: 'Transport',
  refrigerants: 'Industry',
  waste: 'Waste',
  water: 'Water',
  agriculture: 'Agriculture',
  lulucf: 'Land Use',
  construction: 'Buildings',
  materials: 'Industry',
  sector_spend: 'Cross-sector',
  gwp: 'Methodology',
  other: 'Other',
};

export function getCategoryMeta(category: Category): CategoryMeta {
  return CATEGORY_META[category];
}

// Home page quick-start chip categories (6 most common).
export const QUICK_START_CATEGORIES: Category[] = [
  'electricity',
  'fuels',
  'transport',
  'refrigerants',
  'waste',
  'sector_spend',
];
