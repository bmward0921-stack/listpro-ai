import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Listing, ListingFormData, Platform, ListingStatus, PlatformListing } from '@/types/listing';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from './useAdminSettings';

interface DbListing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number | null;
  status: string;
  platform: string | null;
  sku: string | null;
  quantity: number | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

// Transform DB listing to app listing format
const transformListing = (dbListing: DbListing): Listing => {
  // Parse platforms from localStorage cache or create default
  const storedPlatforms = localStorage.getItem(`listing_platforms_${dbListing.id}`);
  let platforms: PlatformListing[] = [];
  
  if (storedPlatforms) {
    try {
      platforms = JSON.parse(storedPlatforms);
    } catch {
      platforms = [];
    }
  }
  
  // If no platforms stored, create one from the db fields
  if (platforms.length === 0 && dbListing.platform) {
    platforms = [{
      platform: dbListing.platform as Platform,
      price: dbListing.price || 0,
      status: dbListing.status as ListingStatus,
    }];
  }

  return {
    id: dbListing.id,
    created_at: dbListing.created_at,
    updated_at: dbListing.updated_at,
    title: dbListing.title,
    description: dbListing.description || '',
    images: dbListing.images || [],
    category: '',
    costPrice: dbListing.price || 0,
    sku: dbListing.sku || undefined,
    quantity: dbListing.quantity || 1,
    platforms,
    user_id: dbListing.user_id,
  };
};

export const useListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchListings = useCallback(async () => {
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      const transformedListings = (data || []).map(transformListing);
      setListings(transformedListings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const createListing = async (data: ListingFormData): Promise<Listing> => {
    if (!user) throw new Error('User not authenticated');

    const primaryPlatform = data.platforms[0];
    
    const { data: newListing, error: insertError } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        price: data.costPrice,
        status: primaryPlatform?.status || 'draft',
        platform: primaryPlatform?.platform || null,
        sku: data.sku || null,
        quantity: data.quantity,
        images: data.images,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Store platforms in localStorage for now (complex array)
    localStorage.setItem(`listing_platforms_${newListing.id}`, JSON.stringify(data.platforms));

    const transformed = transformListing(newListing);
    transformed.platforms = data.platforms;
    
    setListings(prev => [transformed, ...prev]);
    return transformed;
  };

  const updateListing = async (id: string, data: Partial<ListingFormData>): Promise<Listing> => {
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.costPrice !== undefined) updateData.price = data.costPrice;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.images !== undefined) updateData.images = data.images;
    
    if (data.platforms && data.platforms.length > 0) {
      updateData.platform = data.platforms[0].platform;
      updateData.status = data.platforms[0].status;
      updateData.price = data.platforms[0].price || data.costPrice;
      localStorage.setItem(`listing_platforms_${id}`, JSON.stringify(data.platforms));
    }

    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    const transformed = transformListing(updatedListing);
    if (data.platforms) {
      transformed.platforms = data.platforms;
    }

    setListings(prev => prev.map(l => l.id === id ? transformed : l));
    return transformed;
  };

  const deleteListing = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);
    
    if (deleteError) throw deleteError;
    
    localStorage.removeItem(`listing_platforms_${id}`);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const updatePlatformStatus = async (
    listingId: string,
    platform: Platform,
    status: ListingStatus
  ): Promise<void> => {
    const listing = listings.find(l => l.id === listingId);
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

// Analytics helpers with platform fees
export const useListingStats = (listings: Listing[]) => {
  const { calculatePlatformFee, loading: settingsLoading } = useAdminSettings();
  
  return useMemo(() => {
    const totalListings = listings.length;
    
    const activeListings = listings.filter(l =>
      l.platforms.some(p => p.status === 'available' || p.status === 'reserved')
    ).length;

    const soldItems = listings.reduce((acc, l) => {
      return acc + l.platforms.filter(p => p.status === 'sold').length;
    }, 0);

    // Gross revenue (before fees)
    const totalGrossRevenue = listings.reduce((acc, l) => {
      return acc + l.platforms
        .filter(p => p.status === 'sold')
        .reduce((sum, p) => sum + p.price, 0);
    }, 0);

    // Total platform fees
    const totalFees = listings.reduce((acc, l) => {
      return acc + l.platforms
        .filter(p => p.status === 'sold')
        .reduce((sum, p) => sum + calculatePlatformFee(p.platform, p.price), 0);
    }, 0);

    // Net revenue (after platform fees)
    const totalRevenue = totalGrossRevenue - totalFees;

    const totalCost = listings.reduce((acc, l) => {
      const soldCount = l.platforms.filter(p => p.status === 'sold').length;
      return acc + (soldCount > 0 ? l.costPrice : 0);
    }, 0);

    // Profit now accounts for platform fees
    const totalProfit = totalRevenue - totalCost;

    const platformBreakdown = listings.reduce((acc, l) => {
      l.platforms.forEach(p => {
        if (!acc[p.platform]) {
          acc[p.platform] = { total: 0, sold: 0, grossRevenue: 0, fees: 0, revenue: 0 };
        }
        acc[p.platform].total++;
        if (p.status === 'sold') {
          acc[p.platform].sold++;
          const fee = calculatePlatformFee(p.platform, p.price);
          acc[p.platform].grossRevenue += p.price;
          acc[p.platform].fees += fee;
          acc[p.platform].revenue += p.price - fee;
        }
      });
      return acc;
    }, {} as Record<Platform, { total: number; sold: number; grossRevenue: number; fees: number; revenue: number }>);

    return {
      totalListings,
      activeListings,
      soldItems,
      totalGrossRevenue,
      totalFees,
      totalRevenue,
      totalCost,
      totalProfit,
      platformBreakdown,
    };
  }, [listings, calculatePlatformFee, settingsLoading]);
};
