export type ActivityAction = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'price_changed';

export interface ActivityLog {
  id: string;
  created_at: string;
  listing_id: string;
  listing_title: string;
  user_id: string;
  user_email: string;
  action: ActivityAction;
  details?: string;
  old_value?: string;
  new_value?: string;
}

export const ACTION_LABELS: Record<ActivityAction, string> = {
  created: 'Created listing',
  updated: 'Updated listing',
  deleted: 'Deleted listing',
  status_changed: 'Changed status',
  price_changed: 'Changed price',
};

export const ACTION_COLORS: Record<ActivityAction, string> = {
  created: 'text-green-600 bg-green-100',
  updated: 'text-blue-600 bg-blue-100',
  deleted: 'text-red-600 bg-red-100',
  status_changed: 'text-purple-600 bg-purple-100',
  price_changed: 'text-orange-600 bg-orange-100',
};
