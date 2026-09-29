export interface PropertyCategory {
  id: string;
  name: string;
  icon: string; // Feather icon name
  count?: string;
  tagline?: string;
}

export const PropertyCategories: PropertyCategory[] = [
  {
    id: 'apartments',
    name: 'Apartments',
    icon: 'grid',
    tagline: 'Modern 1-4 BHK flats & penthouses',
  },
  {
    id: 'houses',
    name: 'Houses',
    icon: 'home',
    tagline: 'Independent homes & row houses',
  },
  {
    id: 'villas',
    name: 'Villas',
    icon: 'compass',
    tagline: 'Gated luxury villas & estates',
  },
  {
    id: 'plots',
    name: 'Plots',
    icon: 'maximize',
    tagline: 'Residential NA & gated plots',
  },
  {
    id: 'land',
    name: 'Land',
    icon: 'map',
    tagline: 'Agricultural & development parcels',
  },
  {
    id: 'offices',
    name: 'Offices',
    icon: 'briefcase',
    tagline: 'Grade-A IT parks & commercial suites',
  },
  {
    id: 'shops',
    name: 'Shops',
    icon: 'shopping-bag',
    tagline: 'High-street retail & showrooms',
  },
  {
    id: 'commercial',
    name: 'Commercial',
    icon: 'layers',
    tagline: 'Warehouses, hubs & flex spaces',
  },
];
