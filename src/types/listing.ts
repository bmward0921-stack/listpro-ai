export type Platform = 'facebook' | 'poshmark' | 'squarespace';

export type ListingStatus = 'available' | 'sold' | 'reserved' | 'archived';

export interface PlatformListing {
  platform: Platform;
  price: number;
  url?: string;
  status: ListingStatus;
  listedAt?: string;
  soldAt?: string;
}

export interface Listing {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  costPrice: number;
  sku?: string;
  quantity: number;
  platforms: PlatformListing[];
  user_id: string;
}

export interface ListingFormData {
  title: string;
  description: string;
  images: string[];
  category: string;
  costPrice: number;
  sku?: string;
  quantity: number;
  platforms: PlatformListing[];
}

// Helper to get primary image (first image)
export const getPrimaryImage = (listing: Listing | ListingFormData): string | undefined => {
  if (listing.images && listing.images.length > 0) {
    return listing.images[0];
  }
  return undefined;
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: 'Facebook Marketplace',
  poshmark: 'Poshmark',
  squarespace: 'Squarespace',
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  available: 'Available',
  sold: 'Sold',
  reserved: 'Reserved',
  archived: 'Archived',
};

export const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Toys & Games',
  'Sports & Outdoors',
  'Books & Media',
  'Health & Beauty',
  'Automotive',
  'Collectibles',
  'Other',
];
