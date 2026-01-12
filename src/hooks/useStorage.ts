import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const BUCKET_NAME = 'listing-images';

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const uploadFile = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

      if (uploadError) {
        // If bucket doesn't exist, use a data URL as fallback
        console.warn('Storage upload failed, using data URL fallback:', uploadError.message);
        return await fileToDataUrl(file);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (err: any) {
      // Fallback to data URL if storage fails
      console.warn('Storage error, using data URL fallback:', err.message);
      return await fileToDataUrl(file);
    } finally {
      setUploading(false);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const deleteFile = async (fileUrl: string): Promise<void> => {
    const path = getPathFromUrl(fileUrl);
    if (!path) return;

    try {
      await supabase.storage.from(BUCKET_NAME).remove([path]);
    } catch (err: any) {
      console.error('Failed to delete file:', err.message);
    }
  };

  const getPathFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    error,
  };
};
