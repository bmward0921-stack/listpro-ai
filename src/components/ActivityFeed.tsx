import { Link } from 'react-router-dom';
import { ActivityLog, ACTION_LABELS, ACTION_COLORS } from '@/types/activity';
import { formatDistanceToNow } from 'date-fns';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  DollarSign,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  activities: ActivityLog[];
  loading?: boolean;
  showListingLink?: boolean;
  maxItems?: number;
}

const ACTION_ICONS = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  status_changed: RefreshCw,
  price_changed: DollarSign,
};

const ActivityFeed = ({ 
  activities, 
  loading, 
  showListingLink = true,
  maxItems 
}: ActivityFeedProps) => {
  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (displayedActivities.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity) => {
        const Icon = ACTION_ICONS[activity.action] || Pencil;
        const colorClass = ACTION_COLORS[activity.action];

        return (
          <div key={activity.$id} className="flex gap-3">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', colorClass)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1 text-sm">
                <span className="font-medium">
                  {activity.userEmail?.split('@')[0] || 'Unknown user'}
                </span>
                <span className="text-muted-foreground">
                  {ACTION_LABELS[activity.action].toLowerCase()}
                </span>
                {showListingLink && activity.action !== 'deleted' ? (
                  <Link 
                    to={`/listings/${activity.listingId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {activity.listingTitle}
                  </Link>
                ) : (
                  <span className="font-medium">{activity.listingTitle}</span>
                )}
              </div>
              
              {activity.details && (
                <p className="text-sm text-muted-foreground">{activity.details}</p>
              )}
              
              {activity.oldValue && activity.newValue && (
                <p className="text-sm text-muted-foreground">
                  <span className="line-through">{activity.oldValue}</span>
                  {' → '}
                  <span className="font-medium">{activity.newValue}</span>
                </p>
              )}
              
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {activity.userEmail}
                <span className="mx-1">•</span>
                {formatDistanceToNow(new Date(activity.$createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
