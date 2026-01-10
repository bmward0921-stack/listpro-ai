import { useState, useEffect, useCallback } from 'react';
import { Listing, ListingFormData, Platform, ListingStatus } from '@/types/listing';

// Mock data for demonstration - replace with Appwrite calls
const mockListings: Listing[] = [
  {
    $id: '1',
    $createdAt: '2024-01-15T10:00:00Z',
    $updatedAt: '2024-01-15T10:00:00Z',
    title: 'Vintage Leather Jacket',
    description: 'Classic brown leather jacket in excellent condition',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300',
    category: 'Clothing',
    costPrice: 45,
    sku: 'VLJ-001',
    quantity: 1,
    platforms: [
      { platform: 'facebook', price: 120, status: 'available', listedAt: '2024-01-15' },
      { platform: 'poshmark', price: 135, status: 'available', listedAt: '2024-01-15' },
    ],
    userId: 'user1',
  },
  {
    $id: '2',
    $createdAt: '2024-01-10T10:00:00Z',
    $updatedAt: '2024-01-18T10:00:00Z',
    title: 'Nintendo Switch Console',
    description: 'Barely used Nintendo Switch with original packaging',
    imageUrl: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=300',
    category: 'Electronics',
    costPrice: 180,
    sku: 'NSW-002',
    quantity: 1,
    platforms: [
      { platform: 'facebook', price: 250, status: 'sold', listedAt: '2024-01-10', soldAt: '2024-01-18' },
    ],
    userId: 'user1',
  },
  {
    $id: '3',
    $createdAt: '2024-01-12T10:00:00Z',
    $updatedAt: '2024-01-12T10:00:00Z',
    title: 'Handmade Ceramic Vase Set',
    description: 'Set of 3 artisan ceramic vases',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300',
    category: 'Home & Garden',
    costPrice: 30,
    quantity: 3,
    platforms: [
      { platform: 'squarespace', price: 89, status: 'available', listedAt: '2024-01-12' },
      { platform: 'facebook', price: 75, status: 'reserved', listedAt: '2024-01-12' },
    ],
    userId: 'user1',
  },
  {
    $id: '4',
    $createdAt: '2024-01-08T10:00:00Z',
    $updatedAt: '2024-01-20T10:00:00Z',
    title: 'Designer Sunglasses',
    description: 'Ray-Ban Aviator sunglasses with case',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300',
    category: 'Clothing',
    costPrice: 60,
    sku: 'DSG-004',
    quantity: 1,
    platforms: [
      { platform: 'poshmark', price: 95, status: 'sold', listedAt: '2024-01-08', soldAt: '2024-01-20' },
    ],
    userId: 'user1',
  },
  {
    $id: '5',
    $createdAt: '2024-01-20T10:00:00Z',
    $updatedAt: '2024-01-20T10:00:00Z',
    title: 'Vintage Record Player',
    description: 'Working vintage turntable from the 70s',
    imageUrl: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=300',
    category: 'Electronics',
    costPrice: 75,
    quantity: 1,
    platforms: [
      { platform: 'facebook', price: 200, status: 'available', listedAt: '2024-01-20' },
      { platform: 'squarespace', price: 225, status: 'available', listedAt: '2024-01-20' },
    ],
    userId: 'user1',
  },
];

export const useListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual Appwrite call
      // const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setListings(mockListings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const createListing = async (data: ListingFormData): Promise<Listing> => {
    // TODO: Replace with actual Appwrite call
    const newListing: Listing = {
      $id: Date.now().toString(),
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      ...data,
      userId: 'user1',
    };
    setListings(prev => [newListing, ...prev]);
    return newListing;
  };

  const updateListing = async (id: string, data: Partial<ListingFormData>): Promise<Listing> => {
    // TODO: Replace with actual Appwrite call
    const updated = listings.find(l => l.$id === id);
    if (!updated) throw new Error('Listing not found');
    
    const updatedListing = { ...updated, ...data, $updatedAt: new Date().toISOString() };
    setListings(prev => prev.map(l => l.$id === id ? updatedListing : l));
    return updatedListing;
  };

  const deleteListing = async (id: string): Promise<void> => {
    // TODO: Replace with actual Appwrite call
    setListings(prev => prev.filter(l => l.$id !== id));
  };

  const updatePlatformStatus = async (
    listingId: string,
    platform: Platform,
    status: ListingStatus
  ): Promise<void> => {
    const listing = listings.find(l => l.$id === listingId);
    if (!listing) throw new Error('Listing not found');

    const updatedPlatforms = listing.platforms.map(p =>
      p.platform === platform
        ? { ...p, status, soldAt: status === 'sold' ? new Date().toISOString() : p.soldAt }
        : p
    );

    await updateListing(listingId, { platforms: updatedPlatforms });
  };

  return {
    listings,
    loading,
    error,
    fetchListings,
    createListing,
    updateListing,
    deleteListing,
    updatePlatformStatus,
  };
};

// Analytics helpers
export const useListingStats = (listings: Listing[]) => {
  const totalListings = listings.length;
  
  const activeListings = listings.filter(l =>
    l.platforms.some(p => p.status === 'available' || p.status === 'reserved')
  ).length;

  const soldItems = listings.reduce((acc, l) => {
    return acc + l.platforms.filter(p => p.status === 'sold').length;
  }, 0);

  const totalRevenue = listings.reduce((acc, l) => {
    return acc + l.platforms
      .filter(p => p.status === 'sold')
      .reduce((sum, p) => sum + p.price, 0);
  }, 0);

  const totalCost = listings.reduce((acc, l) => {
    const soldCount = l.platforms.filter(p => p.status === 'sold').length;
    return acc + (soldCount > 0 ? l.costPrice : 0);
  }, 0);

  const totalProfit = totalRevenue - totalCost;

  const platformBreakdown = listings.reduce((acc, l) => {
    l.platforms.forEach(p => {
      if (!acc[p.platform]) {
        acc[p.platform] = { total: 0, sold: 0, revenue: 0 };
      }
      acc[p.platform].total++;
      if (p.status === 'sold') {
        acc[p.platform].sold++;
        acc[p.platform].revenue += p.price;
      }
    });
    return acc;
  }, {} as Record<Platform, { total: number; sold: number; revenue: number }>);

  return {
    totalListings,
    activeListings,
    soldItems,
    totalRevenue,
    totalCost,
    totalProfit,
    platformBreakdown,
  };
};
