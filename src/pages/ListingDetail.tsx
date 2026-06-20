import PageHead from '@/components/PageHead';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useListings } from '@/hooks/useListings';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PlatformBadge from '@/components/PlatformBadge';
import StatusBadge from '@/components/StatusBadge';
import ActivityFeed from '@/components/ActivityFeed';
import ImageGallery from '@/components/ImageGallery';
import { PLATFORM_LABELS, STATUS_LABELS, Platform, getPrimaryImage } from '@/types/listing';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ExternalLink,
  Package,
  DollarSign,
  Tag,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import ListingDetailSkeleton from '@/components/skeletons/ListingDetailSkeleton';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { listings, loading, deleteListing, updatePlatformStatus } = useListings();
  const { activities, loading: activitiesLoading, logActivity } = useActivityLog(id);
  const { calculatePlatformFee, calculateNetRevenue, getPlatformFee } = useAdminSettings();
  
  const listing = listings.find((l) => l.id === id);
  
  // Find current listing index for navigation
  const currentIndex = listings.findIndex((l) => l.id === id);
  const prevListing = currentIndex > 0 ? listings[currentIndex - 1] : null;
  const nextListing = currentIndex < listings.length - 1 ? listings[currentIndex + 1] : null;

  const navigateToPrev = () => {
    if (prevListing) {
      navigate(`/listings/${prevListing.id}`);
    }
  };

  const navigateToNext = () => {
    if (nextListing) {
      navigate(`/listings/${nextListing.id}`);
    }
  };

  // Swipe navigation for mobile
  const { isSwiping, swipeOffset } = useSwipeNavigation({
    onSwipeLeft: navigateToNext,
    onSwipeRight: navigateToPrev,
    threshold: 75,
    enabled: isMobile && !loading && !!listing,
  });

  const handleDelete = async () => {
    if (!id || !listing) return;
    const title = listing.title;
    try {
      await logActivity('deleted', id, title, 'Listing was deleted');
      await deleteListing(id);
      toast({ title: 'Listing deleted', description: 'The listing has been removed.' });
      navigate('/listings');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete listing.', variant: 'destructive' });
    }
  };

  const handleMarkSold = async (platform: Platform) => {
    if (!id || !listing) return;
    try {
      await updatePlatformStatus(id, platform, 'sold');
      await logActivity('status_changed', id, listing.title, `Marked as sold on ${PLATFORM_LABELS[platform]}`, 'available', 'sold');
      toast({ title: 'Marked as sold', description: `Item marked as sold on ${PLATFORM_LABELS[platform]}.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <ListingDetailSkeleton />;
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Listing not found</h2>
        <p className="mt-1 text-muted-foreground">This listing may have been deleted.</p>
        <Button asChild className="mt-4">
          <Link to="/listings">Back to Listings</Link>
        </Button>
      </div>
    );
  }

  const soldPlatforms = listing.platforms.filter((p) => p.status === 'sold');
  
  const totalGrossRevenue = soldPlatforms.reduce((sum, p) => sum + p.price, 0);
  
  const totalFees = soldPlatforms.reduce(
    (sum, p) => sum + calculatePlatformFee(p.platform, p.price), 
    0
  );
  
  const totalRevenue = totalGrossRevenue - totalFees;
  const profit = totalRevenue - listing.costPrice;
  const profitMargin = totalGrossRevenue > 0 ? ((profit / totalGrossRevenue) * 100).toFixed(1) : '0';

  return (
    <>
      <PageHead title={`${listing?.title || 'Listing'} | ListPro.AI`} description={`Details, platform statuses, and activity for ${listing?.title || 'this listing'} on ListPro.AI.`} path={`/listings/${id ?? ''}`} />
    <div 
      className="mx-auto max-w-4xl space-y-6"
      style={{
        transform: isSwiping ? `translateX(${swipeOffset * 0.3}px)` : 'translateX(0)',
        opacity: isSwiping ? 1 - Math.abs(swipeOffset) / 300 : 1,
        transition: isSwiping ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
      }}
    >
      {/* Swipe Indicator - Mobile only */}
      {isMobile && (prevListing || nextListing) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {prevListing && (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="truncate max-w-[100px]">Swipe for prev</span>
              </>
            )}
          </div>
          <span className="text-center">{currentIndex + 1} of {listings.length}</span>
          <div className="flex items-center gap-1">
            {nextListing && (
              <>
                <span className="truncate max-w-[100px]">Swipe for next</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/listings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{listing.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{listing.category}</Badge>
              {listing.sku && (
                <Badge variant="secondary">SKU: {listing.sku}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/listings/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Product Images */}
          <Card>
            <CardContent className="p-4">
              {listing.images?.length > 0 ? (
                <ImageGallery 
                  images={listing.images}
                  alt={listing.title}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {listing.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Platform Listings */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Listings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {listing.platforms.map((platform) => (
                <div
                  key={platform.platform}
                  className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <PlatformBadge platform={platform.platform} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${platform.price}</span>
                        <StatusBadge status={platform.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Listed {format(new Date(platform.listedAt), 'MMM d, yyyy')}
                        </span>
                        {platform.soldAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Sold {format(new Date(platform.soldAt), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {platform.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={platform.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 h-3 w-3" />
                          View Listing
                        </a>
                      </Button>
                    )}
                    {platform.status === 'available' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkSold(platform.platform)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Mark Sold
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Cost Price
                </span>
                <span className="font-semibold">${listing.costPrice.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Gross Revenue
                </span>
                <span className="font-semibold">${totalGrossRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  Platform Fees
                </span>
                <span className="font-semibold text-orange-600">-${totalFees.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Net Revenue
                </span>
                <span className="font-semibold text-green-600">${totalRevenue.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Profit
                </span>
                <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Margin</span>
                <span className="font-semibold">{profitMargin}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <Badge variant="outline">{listing.quantity} available</Badge>
              </div>
              {listing.sku && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">SKU</span>
                  <code className="rounded bg-muted px-2 py-1 text-sm">{listing.sku}</code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity History */}
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-muted-foreground">
                      {format(new Date(listing.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-muted-foreground">
                      {formatDistanceToNow(new Date(listing.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
              <Separator className="my-4" />
              <ActivityFeed 
                activities={activities} 
                loading={activitiesLoading}
                showListingLink={false}
                maxItems={5}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Navigation Arrows */}
      {isMobile && (prevListing || nextListing) && (
        <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-between px-4 pointer-events-none">
          {prevListing ? (
            <Button
              variant="secondary"
              size="icon"
              onClick={navigateToPrev}
              className="h-12 w-12 rounded-full shadow-lg pointer-events-auto"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          ) : (
            <div />
          )}
          {nextListing ? (
            <Button
              variant="secondary"
              size="icon"
              onClick={navigateToNext}
              className="h-12 w-12 rounded-full shadow-lg pointer-events-auto"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default ListingDetail;
