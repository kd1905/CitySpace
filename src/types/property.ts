export type ListingType = 'buy' | 'rent' | 'sold';

export type PropertyCategoryType =
  | 'apartment'
  | 'apartments'
  | 'flat'
  | 'houses'
  | 'house'
  | 'villas'
  | 'villa'
  | 'bungalow'
  | 'plots'
  | 'plot'
  | 'residential_plot'
  | 'commercial_plot'
  | 'land'
  | 'agricultural_land'
  | 'farm_land'
  | 'offices'
  | 'office'
  | 'shops'
  | 'shop'
  | 'showroom'
  | 'warehouse'
  | 'industrial'
  | 'commercial'
  | 'commercial_building'
  | 'penthouse'
  | 'waterfront'
  | 'studio'
  | 'historic'
  | 'all';

export type PropertyStatus = 'draft' | 'pending_approval' | 'published' | 'unpublished' | 'sold' | 'rented';

export type PropertyGroup = 'residential' | 'land' | 'commercial';

export type FurnishingStatus = 'unfurnished' | 'semi-furnished' | 'fully-furnished';

export interface PropertyAgent {
  id: string;
  name: string;
  agency: string;
  avatar?: string;
  phone: string;
  email: string;
  designation?: string;
  propertiesHandled?: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
}

export type LocationVisibility = 'PUBLIC_EXACT' | 'PUBLIC_APPROXIMATE' | 'HIDDEN';

export interface PropertyAmenity {
  id: string;
  name: string;
  icon: string; // Feather icon name
}

export interface PropertyLocation {
  address: string;
  neighborhood: string;
  locality?: string;
  city: string;
  state?: string;
  pincode?: string;
  country: string;
  name?: string;
  placeName?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  googlePlaceId?: string;
}

export interface PropertySpecs {
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  lotSizeSqFt?: number;
  yearBuilt: number;
  parkingSpaces: number;
  furnishing?: FurnishingStatus;
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  price: number;
  currency: string;
  type: ListingType;
  category: PropertyCategoryType;
  categoryLabel: string;
  status: PropertyStatus;
  featured: boolean;
  verified: boolean;
  verificationStatus?: 'draft' | 'submitted' | 'under_review' | 'verified' | 'rejected';
  verificationNotes?: string;
  rejectionReason?: string;
  isNew: boolean;
  specs: PropertySpecs;
  location: PropertyLocation;

  // Extended top-level location fields
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  placeName?: string;
  locationVisibility?: LocationVisibility;

  images: string[];
  amenities: PropertyAmenity[];
  agent: PropertyAgent;
  assignedAgentId?: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  virtualTourUrl?: string;
  hoaMonthly?: number;
  taxAnnual?: number;
}
