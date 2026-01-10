import { useState, useEffect, useCallback } from 'react';
import { Query } from 'appwrite';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_LISTINGS_COLLECTION_ID } from '@/lib/appwrite';
import { Listing, ListingFormData, Platform, ListingStatus } from '@/types/listing';
import { useAuth } from '@/contexts/AuthContext';

export const useListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchListings = useCallback(async () => {
    if (!APPWRITE_DATABASE_ID || !APPWRITE_LISTINGS_COLLECTION_ID) {
      setError('Appwrite database configuration missing. Please check your environment variables.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_LISTINGS_COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );
      
      // Parse platforms JSON string back to array if stored as string
      const parsedListings = response.documents.map((doc: any) => ({
        ...doc,
        platforms: typeof doc.platforms === 'string' ? JSON.parse(doc.platforms) : doc.platforms,
      })) as Listing[];
      
      setListings(parsedListings);
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
    if (!APPWRITE_DATABASE_ID || !APPWRITE_LISTINGS_COLLECTION_ID) {
      throw new Error('Appwrite database configuration missing');
    }

    // Appwrite requires platforms to be stored as JSON string if it's a complex array
    const documentData = {
      ...data,
      platforms: JSON.stringify(data.platforms),
      userId: user?.$id || '',
    };

    const response = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_LISTINGS_COLLECTION_ID,
      'unique()',
      documentData
    );

    const newListing = {
      ...response,
      platforms: data.platforms,
    } as unknown as Listing;

    setListings(prev => [newListing, ...prev]);
    return newListing;
  };

  const updateListing = async (id: string, data: Partial<ListingFormData>): Promise<Listing> => {
    if (!APPWRITE_DATABASE_ID || !APPWRITE_LISTINGS_COLLECTION_ID) {
      throw new Error('Appwrite database configuration missing');
    }

    const updateData: any = { ...data };
    if (data.platforms) {
      updateData.platforms = JSON.stringify(data.platforms);
    }

    const response = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_LISTINGS_COLLECTION_ID,
      id,
      updateData
    );

    const updatedListing = {
      ...response,
      platforms: data.platforms || (typeof response.platforms === 'string' ? JSON.parse(response.platforms) : response.platforms),
    } as unknown as Listing;

    setListings(prev => prev.map(l => l.$id === id ? updatedListing : l));
    return updatedListing;
  };

  const deleteListing = async (id: string): Promise<void> => {
    if (!APPWRITE_DATABASE_ID || !APPWRITE_LISTINGS_COLLECTION_ID) {
      throw new Error('Appwrite database configuration missing');
    }

    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_LISTINGS_COLLECTION_ID,
      id
    );
    
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
