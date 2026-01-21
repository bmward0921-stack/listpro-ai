import { Skeleton } from '@/components/ui/skeleton';

const ListingCardSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
    <Skeleton className="aspect-square w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  </div>
);

const IndexSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Search */}
    <Skeleton className="h-12 w-full rounded-xl" />

    {/* Recent Listings Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-9 w-24 rounded-md" />
    </div>

    {/* Listings Grid */}
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default IndexSkeleton;
