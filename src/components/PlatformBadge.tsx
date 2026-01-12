import { cn } from '@/lib/utils';
import { Platform, PLATFORM_LABELS } from '@/types/listing';

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
}

const platformColors: Record<Platform, string> = {
  facebook: 'bg-info/15 text-info border-info/30',
  poshmark: 'bg-primary/15 text-primary border-primary/30',
  squarespace: 'bg-muted text-muted-foreground border-border',
  ebay: 'bg-success/15 text-success border-success/30',
};

const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        platformColors[platform],
        className
      )}
    >
      {PLATFORM_LABELS[platform]}
    </span>
  );
};

export default PlatformBadge;
