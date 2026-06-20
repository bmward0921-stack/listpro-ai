import PageHead from '@/components/PageHead';
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PlatformBadge from '@/components/PlatformBadge';
import StatusBadge from '@/components/StatusBadge';
import { Platform, ListingStatus, PLATFORM_LABELS, STATUS_LABELS, getPrimaryImage } from '@/types/listing';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Package,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import ListingsSkeleton from '@/components/skeletons/ListingsSkeleton';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshContainer, PullToRefreshIndicator } from '@/components/PullToRefresh';
import { useIsMobile } from '@/hooks/use-mobile';

const Listings = () => {
  const { listings, loading, deleteListing, updatePlatformStatus, fetchListings } = useListings();
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ListingStatus | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await fetchListings();
  }, [fetchListings]);

  const {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: !isMobile,
  });

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesPlatform = platformFilter === 'all' ||
      listing.platforms.some(p => p.platform === platformFilter);
    
    const matchesStatus = statusFilter === 'all' ||
      listing.platforms.some(p => p.status === statusFilter);
    
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteListing(deleteId);
      toast({ title: 'Listing deleted', description: 'The listing has been removed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete listing.', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const handleMarkSold = async (listingId: string, platform: Platform) => {
    try {
      await updatePlatformStatus(listingId, platform, 'sold');
      toast({ title: 'Marked as sold', description: `Item marked as sold on ${PLATFORM_LABELS[platform]}.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  const getPriceRange = (listing: typeof listings[0]) => {
    const prices = listing.platforms.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `$${min}` : `$${min} - $${max}`;
  };

  if (loading) {
    return <ListingsSkeleton />;
  }

  return (
    <PullToRefreshContainer ref={containerRef} className="space-y-6 pb-20 md:pb-6">
      <PageHead title="Listings | ListPro.AI" description="Browse, search, and manage your inventory across every connected marketplace from a single dashboard." path="/listings" />
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
      />
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Listings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all your product listings
          </p>
        </div>
        <Button asChild>
          <Link to="/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Listing
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Platform Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={platformFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPlatformFilter('all')}
          className="rounded-full"
        >
          All Platforms
        </Button>
        {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
          <Button
            key={key}
            variant={platformFilter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPlatformFilter(key as Platform)}
            className="rounded-full"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          All Statuses
        </Button>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Button
            key={key}
            variant={statusFilter === key ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter(key as ListingStatus)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Table */}
      {filteredListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Package className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No listings found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || platformFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first listing'}
          </p>
          {!search && platformFilter === 'all' && statusFilter === 'all' && (
            <Button asChild className="mt-4">
              <Link to="/listings/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Listing
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Listed</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredListings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getPrimaryImage(listing) ? (
                        <img
                          src={getPrimaryImage(listing)}
                          alt={listing.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">{listing.category}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {listing.platforms.map((p) => (
                        <PlatformBadge key={p.platform} platform={p.platform} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{getPriceRange(listing)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {listing.platforms.map((p) => (
                        <StatusBadge key={p.platform} status={p.status} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Listing actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/listings/${listing.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/listings/${listing.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {listing.platforms
                          .filter((p) => p.status === 'available')
                          .map((p) => (
                            <DropdownMenuItem
                              key={p.platform}
                              onClick={() => handleMarkSold(listing.id, p.platform)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark sold on {PLATFORM_LABELS[p.platform]}
                            </DropdownMenuItem>
                          ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(listing.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the listing
              and remove it from all platforms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PullToRefreshContainer>
  );
};

export default Listings;
