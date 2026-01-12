import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ProductTemplate {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  suggested_price: number | null;
  brand: string | null;
  condition: string | null;
  color: string | null;
  keywords: string[] | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductTemplateInput {
  title: string;
  description?: string;
  category?: string;
  suggested_price?: number;
  brand?: string;
  condition?: string;
  color?: string;
  keywords?: string[];
  image_url?: string;
}

export const useProductLibrary = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('product_library')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching product library:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const saveToLibrary = async (product: ProductTemplateInput): Promise<ProductTemplate | null> => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to save products to your library.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('product_library')
        .insert({
          user_id: user.id,
          title: product.title,
          description: product.description || null,
          category: product.category || null,
          suggested_price: product.suggested_price || null,
          brand: product.brand || null,
          condition: product.condition || null,
          color: product.color || null,
          keywords: product.keywords || null,
          image_url: product.image_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => [data, ...prev]);
      toast({
        title: 'Saved to Library',
        description: `"${product.title}" has been saved.`,
      });
      return data;
    } catch (error) {
      console.error('Error saving to library:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save product to library.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteFromLibrary = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('product_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'Removed',
        description: 'Product removed from library.',
      });
      return true;
    } catch (error) {
      console.error('Error deleting from library:', error);
      toast({
        title: 'Delete Failed',
        description: 'Could not remove product from library.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    templates,
    loading,
    saveToLibrary,
    deleteFromLibrary,
    refetch: fetchTemplates,
  };
};
