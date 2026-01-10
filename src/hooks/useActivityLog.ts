import { useState, useEffect, useCallback } from 'react';
import { Query } from 'appwrite';
import { databases, APPWRITE_DATABASE_ID, ID, APPWRITE_ACTIVITY_COLLECTION_ID } from '@/lib/appwrite';
import { ActivityLog, ActivityAction } from '@/types/activity';
import { useAuth } from '@/contexts/AuthContext';

export const useActivityLog = (listingId?: string) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchActivities = useCallback(async () => {
    if (!APPWRITE_DATABASE_ID || !APPWRITE_ACTIVITY_COLLECTION_ID) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queries = [Query.orderDesc('$createdAt'), Query.limit(50)];
      
      if (listingId) {
        queries.push(Query.equal('listingId', listingId));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_ACTIVITY_COLLECTION_ID,
        queries
      );

      setActivities(response.documents as unknown as ActivityLog[]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

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
    if (!APPWRITE_DATABASE_ID || !APPWRITE_ACTIVITY_COLLECTION_ID || !user) {
      console.warn('Activity logging not configured or user not authenticated');
      return;
    }

    try {
      const activityData = {
        listingId,
        listingTitle,
        userId: user.$id,
        userEmail: user.email,
        action,
        details: details || '',
        oldValue: oldValue || '',
        newValue: newValue || '',
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ACTIVITY_COLLECTION_ID,
        ID.unique(),
        activityData
      );

      // Refresh activities if we're viewing them
      if (!listingId || listingId === activityData.listingId) {
        fetchActivities();
      }
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
