import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useListings } from '@/hooks/useListings';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Platform, PlatformListing, PLATFORM_LABELS, CATEGORIES } from '@/types/listing';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import MultiImageUpload from '@/components/MultiImageUpload';
import { getPrimaryImage } from '@/types/listing';

const PLATFORMS: Platform[] = ['facebook', 'poshmark', 'squarespace'];

const ListingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, createListing, updateListing } = useListings();
  const { logActivity } = useActivityLog();
  const isEditing = !!id;
  const existingListing = listings.find((l) => l.$id === id);

  // Support legacy imageUrl by converting to images array
  const existingImages = existingListing?.images?.length 
    ? existingListing.images 
    : existingListing?.imageUrl 
      ? [existingListing.imageUrl] 
      : [];

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: existingListing?.title || '',
    description: existingListing?.description || '',
    images: existingImages,
    category: existingListing?.category || '',
    costPrice: existingListing?.costPrice || 0,
    sku: existingListing?.sku || '',
    quantity: existingListing?.quantity || 1,
  });

  const [platformSettings, setPlatformSettings] = useState<Record<Platform, { enabled: boolean; price: number; url: string }>>(
    PLATFORMS.reduce((acc, platform) => {
      const existing = existingListing?.platforms.find((p) => p.platform === platform);
      acc[platform] = {
        enabled: !!existing,
        price: existing?.price || 0,
        url: existing?.url || '',
      };
      return acc;
    }, {} as Record<Platform, { enabled: boolean; price: number; url: string }>)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const platforms: PlatformListing[] = PLATFORMS
        .filter((p) => platformSettings[p].enabled)
        .map((platform) => ({
          platform,
          price: platformSettings[platform].price,
          url: platformSettings[platform].url || undefined,
          status: existingListing?.platforms.find((p) => p.platform === platform)?.status || 'available',
          listedAt: existingListing?.platforms.find((p) => p.platform === platform)?.listedAt || new Date().toISOString(),
        }));

      if (platforms.length === 0) {
        toast({
          title: 'Error',
          description: 'Please enable at least one platform.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const listingData = {
        ...formData,
        platforms,
      };

      if (isEditing && id) {
        await updateListing(id, listingData);
        await logActivity('updated', id, formData.title, 'Updated listing details');
        toast({ title: 'Success', description: 'Listing updated successfully.' });
      } else {
        const newListing = await createListing(listingData);
        await logActivity('created', newListing.$id, formData.title, `Listed on ${platforms.map(p => PLATFORM_LABELS[p.platform]).join(', ')}`);
        toast({ title: 'Success', description: 'Listing created successfully.' });
      }

      navigate('/listings');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save listing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/listings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Listing' : 'New Listing'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isEditing ? 'Update your listing details' : 'Add a new product to your inventory'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Product title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your product..."
                rows={4}
              />
            </div>

            <MultiImageUpload
              value={formData.images}
              onChange={(images) => setFormData({ ...formData, images })}
              maxImages={10}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price ($)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (optional)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="ABC-123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {PLATFORMS.map((platform) => (
              <div key={platform} className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${platform}-enabled`} className="text-base font-medium">
                    {PLATFORM_LABELS[platform]}
                  </Label>
                  <Switch
                    id={`${platform}-enabled`}
                    checked={platformSettings[platform].enabled}
                    onCheckedChange={(checked) =>
                      setPlatformSettings({
                        ...platformSettings,
                        [platform]: { ...platformSettings[platform], enabled: checked },
                      })
                    }
                  />
                </div>

                {platformSettings[platform].enabled && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${platform}-price`}>Selling Price ($)</Label>
                      <Input
                        id={`${platform}-price`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={platformSettings[platform].price}
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            [platform]: {
                              ...platformSettings[platform],
                              price: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${platform}-url`}>{PLATFORM_LABELS[platform]} URL (optional)</Label>
                      <Input
                        id={`${platform}-url`}
                        type="url"
                        value={platformSettings[platform].url}
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            [platform]: {
                              ...platformSettings[platform],
                              url: e.target.value,
                            },
                          })
                        }
                        placeholder={
                          platform === 'poshmark' 
                            ? 'https://poshmark.com/listing/...' 
                            : platform === 'facebook'
                            ? 'https://facebook.com/marketplace/...'
                            : 'https://...'
                        }
                        pattern={
                          platform === 'poshmark' 
                            ? 'https://(www\\.)?poshmark\\.com/.*' 
                            : undefined
                        }
                        title={
                          platform === 'poshmark'
                            ? 'Please enter a valid Poshmark URL (https://poshmark.com/...)'
                            : undefined
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/listings">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Update Listing' : 'Create Listing'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ListingForm;
