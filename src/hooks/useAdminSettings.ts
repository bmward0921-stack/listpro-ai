import { useState, useEffect, useMemo } from 'react';
import { Platform } from '@/types/listing';

const ADMIN_SETTINGS_KEY = 'listinghub_admin_settings';

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

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultAdminSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse admin settings');
      }
    }
    setLoading(false);
  }, []);

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
    getPlatformFee,
    calculatePlatformFee,
    calculateNetRevenue,
    calculateProfit,
  };
};

// Export types and constants for reuse
export { ADMIN_SETTINGS_KEY, defaultAdminSettings };
