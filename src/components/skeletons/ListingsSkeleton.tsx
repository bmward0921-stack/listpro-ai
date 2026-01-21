import { Skeleton } from '@/components/ui/skeleton';

const ListingRowSkeleton = () => (
  <tr className="border-b border-border">
    <td className="p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-md shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </td>
    <td className="p-4">
      <div className="flex gap-1">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-20" />
    </td>
    <td className="p-4">
      <Skeleton className="h-6 w-16 rounded-full" />
    </td>
    <td className="p-4">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="p-4">
      <Skeleton className="h-8 w-8 rounded-md" />
    </td>
  </tr>
);

const ListingsSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-48 mt-2" />
      </div>
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>

    {/* Search and Filters */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Skeleton className="h-10 w-full sm:w-80 rounded-md" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>

    {/* Table */}
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="p-4 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="p-4 text-left"><Skeleton className="h-4 w-20" /></th>
            <th className="p-4 text-left"><Skeleton className="h-4 w-12" /></th>
            <th className="p-4 text-left"><Skeleton className="h-4 w-14" /></th>
            <th className="p-4 text-left"><Skeleton className="h-4 w-16" /></th>
            <th className="p-4 text-left"><Skeleton className="h-4 w-8" /></th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ListingRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ListingsSkeleton;
