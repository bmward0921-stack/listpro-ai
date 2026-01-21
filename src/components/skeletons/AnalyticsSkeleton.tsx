import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const StatCardSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-6">
    <Skeleton className="h-6 w-44 mb-2" />
    <Skeleton className="h-4 w-56 mb-4" />
    <div className="h-72 flex items-end justify-center gap-6 pt-8">
      {[65, 85, 50, 95].map((height, i) => (
        <Skeleton key={i} className="w-16 rounded-t-md" style={{ height: `${height}%` }} />
      ))}
    </div>
  </div>
);

const TopSellingItemSkeleton = () => (
  <div className="flex items-center gap-4 rounded-lg border border-border p-3">
    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <div className="space-y-1 text-right">
      <Skeleton className="h-5 w-16 ml-auto" />
      <Skeleton className="h-3 w-12 ml-auto" />
    </div>
  </div>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Header */}
    <div>
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-5 w-72 mt-2" />
    </div>

    {/* Key Metrics */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Charts Row */}
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartSkeleton />
      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-6 w-44 mb-2" />
        <Skeleton className="h-4 w-48 mb-4" />
        <div className="h-72 flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      </div>
    </div>

    {/* Category & Top Selling */}
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartSkeleton />
      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-6 w-36 mb-2" />
        <Skeleton className="h-4 w-48 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <TopSellingItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>

    {/* Platform Summary Table */}
    <div className="rounded-xl border border-border bg-card p-6">
      <Skeleton className="h-6 w-40 mb-2" />
      <Skeleton className="h-4 w-64 mb-4" />
      <div className="space-y-3">
        <div className="flex gap-4 py-3 border-b border-border">
          {[80, 48, 40, 56, 48, 72, 64].map((w, i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${w}px` }} />
          ))}
        </div>
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="flex gap-4 py-3 border-b border-border/50">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AnalyticsSkeleton;
