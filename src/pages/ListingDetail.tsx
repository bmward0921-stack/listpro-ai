import { Link, useParams, useNavigate } from 'react-router-dom';
import { useListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PlatformBadge from '@/components/PlatformBadge';
import StatusBadge from '@/components/StatusBadge';
import { PLATFORM_LABELS, STATUS_LABELS, Platform } from '@/types/listing';
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

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, loading, deleteListing, updatePlatformStatus } = useListings();
  
  const listing = listings.find((l) => l.$id === id);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteListing(id);
      toast({ title: 'Listing deleted', description: 'The listing has been removed.' });
      navigate('/listings');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete listing.', variant: 'destructive' });
    }
  };

  const handleMarkSold = async (platform: Platform) => {
    if (!id) return;
    try {
      await updatePlatformStatus(id, platform, 'sold');
      toast({ title: 'Marked as sold', description: `Item marked as sold on ${PLATFORM_LABELS[platform]}.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
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

  const totalRevenue = listing.platforms
    .filter((p) => p.status === 'sold')
    .reduce((sum, p) => sum + p.price, 0);

  const profit = totalRevenue - listing.costPrice;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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
          {/* Product Image */}
          <Card>
            <CardContent className="p-0">
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="aspect-video w-full rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
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
                <span className="font-semibold">${listing.costPrice}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Revenue
                </span>
                <span className="font-semibold text-green-600">${totalRevenue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Profit
                </span>
                <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit >= 0 ? '+' : ''}${profit}
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

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">
                    {format(new Date(listing.$createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-muted-foreground">
                    {formatDistanceToNow(new Date(listing.$updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
