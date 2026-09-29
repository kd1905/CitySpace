import { ListingType, PropertyCategoryType, FurnishingStatus } from './property';

export type SortOption =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'size-desc';

export interface PropertyFilterState {
  query: string;
  type: ListingType;
  category: PropertyCategoryType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number | 'any';
  bathrooms?: number | 'any';
  minArea?: number;
  maxArea?: number;
  furnishing?: FurnishingStatus | 'any';
  parking?: number | 'any';
  verified?: boolean | 'all';
  featured?: boolean | 'all';
  amenities: string[];
  sortBy: SortOption;
}

export const defaultFilterState: PropertyFilterState = {
  query: '',
  type: 'buy',
  category: 'all',
  sortBy: 'featured',
  amenities: [],
};
