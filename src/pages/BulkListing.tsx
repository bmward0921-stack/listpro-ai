import PageHead from '@/components/PageHead';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BulkListingQueue from '@/components/BulkListingQueue';
import { useListings } from '@/hooks/useListings';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Platform, PLATFORM_LABELS, PlatformListing } from '@/types/listing';
import { ArrowLeft, ListPlus, ClipboardList, Package } from 'lucide-react';

const BulkListing = () => {
  const { createListing, listings } = useListings();
  const { logActivity } = useActivityLog();
  const [activeTab, setActiveTab] = useState('queue');

  // Get items that are not yet listed on all platforms
  const pendingItems = listings.filter(listing => {
    const listedPlatforms = listing.platforms.filter(p => p.url);
    return listedPlatforms.length < 3; // Less than all platforms
  });

  const handleCreateListings = async (items: any[]) => {
    for (const item of items) {
      const platforms: PlatformListing[] = item.platforms
        .filter((p: any) => p.url)
        .map((p: any) => ({
          platform: p.platform as Platform,
          price: item.price,
          url: p.url,
          status: 'available' as const,
          listedAt: new Date().toISOString(),
        }));

      if (platforms.length === 0) {
        // Create with at least one platform
        platforms.push({
          platform: 'facebook',
          price: item.price,
          status: 'available',
          listedAt: new Date().toISOString(),
        });
      }

      const listing = await createListing({
        title: item.title,
        description: '',
        images: item.imageUrl ? [item.imageUrl] : [],
        category: '',
        costPrice: 0,
        quantity: 1,
        platforms,
      });

      await logActivity(
        'created',
        listing.id,
        item.title,
        `Bulk listed on ${platforms.map(p => PLATFORM_LABELS[p.platform]).join(', ')}`
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHead title="Bulk List | ListPro.AI" description="Queue and publish multiple inventory items across Facebook, Poshmark, and eBay in a single batch." path="/bulk" />
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/listings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Bulk Listing</h1>
          <p className="text-sm text-muted-foreground">
            Queue items & sync URLs across platforms
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{listings.length}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <ClipboardList className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingItems.length}</p>
                <p className="text-xs text-muted-foreground">Need URLs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <ListPlus className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {listings.reduce((acc, l) => acc + l.platforms.filter(p => p.url).length, 0)}
                </p>
                <p className="text-xs text-muted-foreground">URLs Synced</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="queue">
            <ListPlus className="mr-2 h-4 w-4" />
            New Queue
          </TabsTrigger>
          <TabsTrigger value="pending">
            <ClipboardList className="mr-2 h-4 w-4" />
            Pending ({pendingItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <BulkListingQueue onCreateListings={handleCreateListings} />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <div className="space-y-3">
            {pendingItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-semibold">All caught up!</h3>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    All your listings have URLs synced across platforms
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingItems.map((listing) => (
                <Card key={listing.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{listing.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {listing.platforms.filter(p => p.url).length} of {listing.platforms.length} platforms linked
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {listing.platforms.map(p => (
                            <span
                              key={p.platform}
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                                p.url 
                                  ? 'bg-success/10 text-success' 
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {PLATFORM_LABELS[p.platform]}
                              {p.url ? ' ✓' : ' —'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/listings/${listing.id}/edit`}>
                          Add URLs
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkListing;
