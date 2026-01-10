import { cn } from '@/lib/utils';
import { ListingStatus, STATUS_LABELS } from '@/types/listing';

interface StatusBadgeProps {
  status: ListingStatus;
  className?: string;
}

const statusColors: Record<ListingStatus, string> = {
  available: 'bg-green-500/10 text-green-600 border-green-500/20',
  sold: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  reserved: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  archived: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusColors[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
};

export default StatusBadge;
