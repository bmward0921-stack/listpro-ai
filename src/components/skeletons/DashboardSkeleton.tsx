import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const StatCardSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-6">
    <Skeleton className="h-6 w-40 mb-2" />
    <Skeleton className="h-4 w-32 mb-4" />
    <div className="h-64 flex items-end justify-center gap-4">
      {[60, 80, 45, 90, 70].map((height, i) => (
        <Skeleton key={i} className="w-12 rounded-t-md" style={{ height: `${height}%` }} />
      ))}
    </div>
  </div>
);

const ActivitySkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const PlatformPerformanceSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-6">
    <Skeleton className="h-6 w-44 mb-2" />
    <Skeleton className="h-4 w-56 mb-4" />
    <div className="grid gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Header */}
    <div>
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-5 w-64 mt-2" />
    </div>

    {/* Stats Grid */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Charts and Activity */}
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartSkeleton />
      <ActivitySkeleton />
    </div>

    {/* Platform Performance */}
    <PlatformPerformanceSkeleton />
  </div>
);

export default DashboardSkeleton;
