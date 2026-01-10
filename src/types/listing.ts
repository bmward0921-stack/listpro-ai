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
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  costPrice: number;
  sku?: string;
  quantity: number;
  platforms: PlatformListing[];
  userId: string;
}

export interface ListingFormData {
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  costPrice: number;
  sku?: string;
  quantity: number;
  platforms: PlatformListing[];
}

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
