import { cn } from '@/lib/utils';
import { Platform, PLATFORM_LABELS } from '@/types/listing';

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
}

const platformColors: Record<Platform, string> = {
  facebook: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  poshmark: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  squarespace: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
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
