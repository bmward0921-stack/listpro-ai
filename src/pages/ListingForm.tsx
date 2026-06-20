import PageHead from '@/components/PageHead';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { ArrowLeft, Save, Loader2, ExternalLink, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import MultiImageUpload from '@/components/MultiImageUpload';
import { getPrimaryImage } from '@/types/listing';
import AIDescriptionGenerator from '@/components/AIDescriptionGenerator';
import ProductImageAnalyzer from '@/components/ProductImageAnalyzer';
import ProductLibraryPicker from '@/components/ProductLibraryPicker';
import PlatformCopyButtons from '@/components/PlatformCopyButtons';
import PriceSuggestion from '@/components/PriceSuggestion';
import { ProductTemplate } from '@/hooks/useProductLibrary';

const PLATFORMS: Platform[] = ['facebook', 'poshmark', 'squarespace'];

const ListingForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { listings, createListing, updateListing } = useListings();
  const { logActivity } = useActivityLog();
  const isEditing = !!id;
  const existingListing = listings.find((l) => l.id === id);

  // Parse prefill data from query param (from Smart Scan)
  const prefillData = (() => {
    try {
      const prefill = searchParams.get('prefill');
      if (prefill) {
        return JSON.parse(decodeURIComponent(prefill));
      }
    } catch (e) {
      console.error('Failed to parse prefill data:', e);
    }
    return null;
  })();

  // Get existing images
  const existingImages = existingListing?.images?.length 
    ? existingListing.images 
    : prefillData?.imageUrl 
      ? [prefillData.imageUrl]
      : [];

  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: existingListing?.title || prefillData?.title || '',
    description: existingListing?.description || prefillData?.description || '',
    images: existingImages,
    category: existingListing?.category || prefillData?.category || '',
    costPrice: existingListing?.costPrice || prefillData?.suggestedPrice || 0,
    sku: existingListing?.sku || '',
    quantity: existingListing?.quantity || 1,
  });

  const [platformSettings, setPlatformSettings] = useState<Record<Platform, { enabled: boolean; price: number; url: string }>>(
    PLATFORMS.reduce((acc, platform) => {
      const existing = existingListing?.platforms.find((p) => p.platform === platform);
      acc[platform] = {
        enabled: !!existing,
        price: existing?.price || prefillData?.suggestedPrice || 0,
        url: existing?.url || '',
      };
      return acc;
    }, {} as Record<Platform, { enabled: boolean; price: number; url: string }>)
  );

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({ title: 'Copied!', description: `${field} copied to clipboard.` });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const copyAllToClipboard = async () => {
    const enabledPlatforms = PLATFORMS.filter(p => platformSettings[p].enabled);
    const priceText = enabledPlatforms.length > 0
      ? `$${platformSettings[enabledPlatforms[0]].price.toFixed(2)}`
      : formData.costPrice > 0 ? `$${formData.costPrice.toFixed(2)}` : '';
    
    const formattedText = [
      formData.title,
      priceText ? `Price: ${priceText}` : '',
      '',
      formData.description,
    ].filter(Boolean).join('\n');

    await copyToClipboard(formattedText, 'All');
  };

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
        await logActivity('created', newListing.id, formData.title, `Listed on ${platforms.map(p => PLATFORM_LABELS[p.platform]).join(', ')}`);
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
    <div className="mx-auto max-w-3xl space-y-4 px-2 sm:space-y-6 sm:px-0">
      <PageHead title={isEditing ? 'Edit Listing | ListPro.AI' : 'New Listing | ListPro.AI'} description={isEditing ? 'Update product details, pricing, and platform settings for this listing.' : 'Create a new product listing and publish it across Facebook, Poshmark, and eBay.'} path={isEditing ? `/listings/${id ?? ''}/edit` : '/listings/new'} />
      {/* Header - responsive for portrait/landscape */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" aria-label="Back to listings" className="h-8 w-8 sm:h-10 sm:w-10" asChild>
          <Link to="/listings">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold sm:text-2xl landscape:text-lg md:text-3xl">
            {isEditing ? 'Edit Listing' : 'New Listing'}
          </h1>
          <p className="mt-0.5 truncate text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            {isEditing ? 'Update your listing details' : 'Add a new product to your inventory'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Details */}
        <Card>
          <CardHeader className="flex flex-col gap-2 space-y-0 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <CardTitle className="text-base sm:text-lg">Product Details</CardTitle>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <PlatformCopyButtons
                title={formData.title}
                description={formData.description}
                price={
                  PLATFORMS.find(p => platformSettings[p].enabled)
                    ? platformSettings[PLATFORMS.find(p => platformSettings[p].enabled)!].price
                    : formData.costPrice
                }
                category={formData.category}
              />
              <ProductLibraryPicker
                onSelect={(template: ProductTemplate) => {
                  setFormData(prev => ({
                    ...prev,
                    title: template.title || prev.title,
                    description: template.description || prev.description,
                    category: template.category || prev.category,
                  }));
                  if (template.suggested_price) {
                    const firstEnabled = PLATFORMS.find(p => platformSettings[p].enabled);
                    if (firstEnabled) {
                      setPlatformSettings(prev => ({
                        ...prev,
                        [firstEnabled]: { ...prev[firstEnabled], price: template.suggested_price || 0 }
                      }));
                    }
                  }
                }}
              />
              <ProductImageAnalyzer
                onProductDetected={(details) => {
                  setFormData(prev => ({
                    ...prev,
                    title: details.title || prev.title,
                    description: details.description || prev.description,
                    category: details.category || prev.category,
                  }));
                  if (details.suggestedPrice) {
                    const firstEnabled = PLATFORMS.find(p => platformSettings[p].enabled);
                    if (firstEnabled) {
                      setPlatformSettings(prev => ({
                        ...prev,
                        [firstEnabled]: { ...prev[firstEnabled], price: details.suggestedPrice }
                      }));
                    }
                  }
                }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Title</Label>
                {formData.title && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => copyToClipboard(formData.title, 'Title')}
                  >
                    {copiedField === 'Title' ? (
                      <Check className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    Copy
                  </Button>
                )}
              </div>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Product title"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
                <div className="flex items-center gap-1">
                  {formData.description && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => copyToClipboard(formData.description, 'Description')}
                    >
                      {copiedField === 'Description' ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </Button>
                  )}
                  <AIDescriptionGenerator
                    title={formData.title}
                    category={formData.category}
                    currentDescription={formData.description}
                    onDescriptionGenerated={(desc) => setFormData({ ...formData, description: desc })}
                    imageUrl={formData.images.length > 0 ? formData.images[0] : undefined}
                  />
                </div>
              </div>
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

            <div className="grid gap-3 landscape:grid-cols-2 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="category" className="text-sm">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="costPrice" className="text-sm">Cost Price ($)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-9 sm:h-10"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid gap-3 landscape:grid-cols-2 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="sku" className="text-sm">SKU (optional)</Label>
                <Input
                  id="sku"
                  className="h-9 sm:h-10"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="ABC-123"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="quantity" className="text-sm">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  className="h-9 sm:h-10"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Settings */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg sm:text-xl">Platform Settings</CardTitle>
                <p className="text-sm text-muted-foreground">Enable platforms and set prices for your listing</p>
              </div>
              <PriceSuggestion
                title={formData.title}
                category={formData.category}
                description={formData.description}
                onApplyPrices={(prices) => {
                  setPlatformSettings(prev => {
                    const updated = { ...prev };
                    (Object.keys(prices) as Platform[]).forEach(platform => {
                      if (updated[platform]) {
                        updated[platform] = { ...updated[platform], price: prices[platform] };
                      }
                    });
                    return updated;
                  });
                }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-4 pt-0 sm:space-y-6 sm:p-6 sm:pt-0">
            {PLATFORMS.map((platform) => (
              <div 
                key={platform} 
                className={`space-y-4 rounded-xl border-2 p-4 transition-all sm:p-5 ${
                  platformSettings[platform].enabled 
                    ? 'border-primary/50' 
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <Label 
                    htmlFor={`${platform}-enabled`} 
                    className="text-lg font-semibold sm:text-xl"
                  >
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
                    className="scale-125"
                  />
                </div>

                {platformSettings[platform].enabled && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${platform}-price`} className="text-base font-medium">
                        Selling Price ($)
                      </Label>
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
                        className="h-12 text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                        <Label htmlFor={`${platform}-url`} className="text-base font-medium">
                          Listing URL
                          {platformSettings[platform].url && (
                            <span className="ml-2 text-sm text-success">✓ Linked</span>
                          )}
                        </Label>
                      </div>
                      <div className="flex gap-2">
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
                              : platform === 'squarespace'
                              ? 'https://yourstore.squarespace.com/...'
                              : platform === 'ebay'
                              ? 'https://ebay.com/itm/...'
                              : platform === 'shopify'
                              ? 'https://yourstore.myshopify.com/...'
                              : platform === 'amazon'
                              ? 'https://amazon.com/dp/...'
                              : 'https://...'
                          }
                          className="h-12 flex-1 text-base"
                        />
                        {platformSettings[platform].url && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-12 w-12"
                            onClick={() => window.open(platformSettings[platform].url, '_blank')}
                            title="Open listing"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Paste the URL after listing on {PLATFORM_LABELS[platform]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions - sticky on mobile for easy access */}
        <div className="sticky bottom-4 z-40 -mx-2 bg-background/95 px-2 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm" className="sm:size-default" asChild>
              <Link to="/listings">Cancel</Link>
            </Button>
            <Button type="submit" size="sm" className="sm:size-default" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin sm:mr-2 sm:h-4 sm:w-4" />
                  <span className="text-sm">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                  <span className="text-sm">{isEditing ? 'Update' : 'Create'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ListingForm;
