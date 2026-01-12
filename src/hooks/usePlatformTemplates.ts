import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Platform } from '@/types/listing';

export interface PlatformTemplate {
  prefix: string;
  suffix: string;
  priceFormat: string;
  includeHashtags: boolean;
  customHashtags: string;
  includeEmojis: boolean;
}

export interface PlatformTemplates {
  poshmark: PlatformTemplate;
  facebook: PlatformTemplate;
  squarespace: PlatformTemplate;
  generic: PlatformTemplate;
}

export const defaultTemplates: PlatformTemplates = {
  poshmark: {
    prefix: '',
    suffix: `✨ Bundle to save on shipping!
💕 Offers welcome!`,
    priceFormat: '💰 Price: ${price}',
    includeHashtags: true,
    customHashtags: '#forsale #shopsmall #reseller #poshmark',
    includeEmojis: true,
  },
  facebook: {
    prefix: '🔥 ',
    suffix: `✅ Great condition
🚗 Local pickup available
📬 Shipping available

💬 Message for questions!`,
    priceFormat: '${price}',
    includeHashtags: false,
    customHashtags: '',
    includeEmojis: true,
  },
  squarespace: {
    prefix: '',
    suffix: '',
    priceFormat: 'Price: ${price}',
    includeHashtags: false,
    customHashtags: '',
    includeEmojis: false,
  },
  generic: {
    prefix: '',
    suffix: '',
    priceFormat: 'Price: ${price}',
    includeHashtags: false,
    customHashtags: '',
    includeEmojis: false,
  },
};

const TEMPLATES_STORAGE_KEY = 'stocksync_platform_templates';

export const usePlatformTemplates = () => {
  const [templates, setTemplates] = useState<PlatformTemplates>(defaultTemplates);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTemplates = useCallback(async () => {
    if (!user) {
      // Try localStorage for non-authenticated state
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (stored) {
        try {
          setTemplates({ ...defaultTemplates, ...JSON.parse(stored) });
        } catch (e) {
          console.error('Failed to parse templates');
        }
      }
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
        const settings = data.settings as Record<string, unknown>;
        if (settings.platformTemplates) {
          setTemplates({ ...defaultTemplates, ...(settings.platformTemplates as PlatformTemplates) });
        }
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const updateTemplates = async (newTemplates: Partial<PlatformTemplates>) => {
    const updatedTemplates = { ...templates, ...newTemplates };
    setTemplates(updatedTemplates);

    // Save to localStorage for immediate access
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));

    if (!user) return;

    try {
      // First get existing settings
      const { data: existing } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();

      const existingSettings = (existing?.settings as Record<string, unknown>) || {};
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('user_settings') as any).upsert(
        { 
          user_id: user.id, 
          settings: { ...existingSettings, platformTemplates: updatedTemplates } 
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save templates:', err);
    }
  };

  const updateTemplate = async (platform: keyof PlatformTemplates, template: Partial<PlatformTemplate>) => {
    const updatedTemplates = {
      ...templates,
      [platform]: { ...templates[platform], ...template },
    };
    await updateTemplates(updatedTemplates);
  };

  const resetToDefaults = async () => {
    await updateTemplates(defaultTemplates);
  };

  // Format a listing using the template
  const formatListing = (
    platform: keyof PlatformTemplates,
    title: string,
    description: string,
    price: number,
    category?: string
  ): string => {
    const template = templates[platform];
    
    // Generate hashtags from title
    const generateHashtags = (): string => {
      if (!template.includeHashtags) return '';
      
      const words = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2);
      
      const autoHashtags = words.slice(0, 5).map(w => `#${w}`);
      if (category) {
        autoHashtags.push(`#${category.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
      }
      
      const customTags = template.customHashtags.split(' ').filter(t => t.startsWith('#'));
      return [...new Set([...autoHashtags, ...customTags])].slice(0, 12).join(' ');
    };

    const priceText = template.priceFormat.replace('${price}', `$${price.toFixed(2)}`);
    const hashtags = generateHashtags();
    
    const parts = [
      template.prefix ? `${template.prefix}${title}` : title,
      '',
      description,
      '',
      priceText,
    ];

    if (hashtags) {
      parts.push('', hashtags);
    }

    if (template.suffix) {
      parts.push('', template.suffix);
    }

    return parts.join('\n').trim();
  };

  return {
    templates,
    loading,
    updateTemplates,
    updateTemplate,
    resetToDefaults,
    formatListing,
  };
};
