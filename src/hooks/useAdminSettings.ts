import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Platform } from '@/types/listing';

export interface PlatformFee {
  platform: Platform;
  feePercent: number;
  flatFee: number;
}

export interface TaxSettings {
  enabled: boolean;
  rate: number;
  includedInPrice: boolean;
}

export interface UserAccess {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  addedAt: string;
}

export interface AdminSettings {
  platformFees: PlatformFee[];
  tax: TaxSettings;
  categories: string[];
  userAccess: UserAccess[];
}

const defaultAdminSettings: AdminSettings = {
  platformFees: [
    { platform: 'facebook', feePercent: 5, flatFee: 0 },
    { platform: 'poshmark', feePercent: 20, flatFee: 0 },
    { platform: 'squarespace', feePercent: 3, flatFee: 0.30 },
  ],
  tax: {
    enabled: false,
    rate: 0,
    includedInPrice: false,
  },
  categories: [],
  userAccess: [],
};

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>(defaultAdminSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.settings && typeof data.settings === 'object') {
        setSettings({ ...defaultAdminSettings, ...(data.settings as unknown as AdminSettings) });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<AdminSettings>) => {
    if (!user) return;

    const updatedSettings = { ...settings, ...newSettings };
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('user_settings') as any)
        .upsert(
          { user_id: user.id, settings: updatedSettings },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  // Get platform fee for a specific platform
  const getPlatformFee = (platform: Platform): PlatformFee => {
    return settings.platformFees.find(pf => pf.platform === platform) || {
      platform,
      feePercent: 0,
      flatFee: 0,
    };
  };

  // Calculate fee amount for a given price on a platform
  const calculatePlatformFee = (platform: Platform, price: number): number => {
    const fee = getPlatformFee(platform);
    return (price * fee.feePercent / 100) + fee.flatFee;
  };

  // Calculate net revenue after platform fees
  const calculateNetRevenue = (platform: Platform, price: number): number => {
    return price - calculatePlatformFee(platform, price);
  };

  // Calculate profit after platform fees and cost
  const calculateProfit = (platform: Platform, price: number, costPrice: number): number => {
    return calculateNetRevenue(platform, price) - costPrice;
  };

  return {
    settings,
    loading,
    updateSettings,
    getPlatformFee,
    calculatePlatformFee,
    calculateNetRevenue,
    calculateProfit,
  };
};

export { defaultAdminSettings };
