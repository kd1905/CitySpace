export interface PopularCity {
  id: string;
  name: string;
  state: string;
  image: string;
  propertyCount?: string;
  featuredNeighborhood: string;
}

export const PopularLocations: PopularCity[] = [
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    featuredNeighborhood: 'Baner • Koregaon Park • Kothrud',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    featuredNeighborhood: 'Bandra West • Juhu • Worli',
  },
  {
    id: 'kolhapur',
    name: 'Kolhapur',
    state: 'Maharashtra',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    featuredNeighborhood: 'Tarabai Park • Rajarampuri • Nagala Park',
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    featuredNeighborhood: 'Indiranagar • Whitefield • HSR Layout',
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
    featuredNeighborhood: 'Jubilee Hills • Gachibowli • Hitec City',
  },
];
