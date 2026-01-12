import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLog, ActivityAction } from '@/types/activity';
import { useAuth } from '@/contexts/AuthContext';

export const useActivityLog = (listingId?: string) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (listingId) {
        query = query.eq('entity_id', listingId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform to match ActivityLog interface
      const transformedActivities: ActivityLog[] = (data || []).map(item => ({
        id: item.id,
        created_at: item.created_at,
        listing_id: item.entity_id || '',
        listing_title: (item.details as any)?.title || '',
        user_id: item.user_id,
        user_email: (item.details as any)?.userEmail || '',
        action: item.action as ActivityAction,
        details: (item.details as any)?.description || '',
        old_value: (item.details as any)?.oldValue || '',
        new_value: (item.details as any)?.newValue || '',
      }));

      setActivities(transformedActivities);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [listingId, user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const logActivity = async (
    action: ActivityAction,
    listingId: string,
    listingTitle: string,
    details?: string,
    oldValue?: string,
    newValue?: string
  ): Promise<void> => {
    if (!user) {
      console.warn('Activity logging: user not authenticated');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action,
          entity_type: 'listing',
          entity_id: listingId,
          details: {
            title: listingTitle,
            userEmail: user.email,
            description: details || '',
            oldValue: oldValue || '',
            newValue: newValue || '',
          },
        });

      if (insertError) throw insertError;

      // Refresh activities
      fetchActivities();
    } catch (err: any) {
      console.error('Failed to log activity:', err.message);
    }
  };

  return {
    activities,
    loading,
    error,
    logActivity,
    refreshActivities: fetchActivities,
  };
};
