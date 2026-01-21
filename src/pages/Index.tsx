import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Plus, Package, ArrowRight, Search, X } from "lucide-react";
import BatchImageAnalyzer, { ProductDetails } from "@/components/BatchImageAnalyzer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useListings } from "@/hooks/useListings";
import { useAuth } from "@/contexts/AuthContext";
import { getPrimaryImage, PLATFORM_LABELS, Platform } from "@/types/listing";
import StatusBadge from "@/components/StatusBadge";
import IndexSkeleton from "@/components/skeletons/IndexSkeleton";

const platformStyles: Record<Platform, string> = {
  facebook: "bg-info text-info-foreground",
  poshmark: "bg-primary text-primary-foreground",
  squarespace: "bg-muted text-muted-foreground",
  ebay: "bg-success text-success-foreground",
};

const externalPlatforms = [
  {
    name: "FB Marketplace",
    url: "https://www.facebook.com/marketplace/create/item",
    className: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  {
    name: "Poshmark",
    url: "https://poshmark.com/create-listing",
    className: "bg-rose-500 hover:bg-rose-600 text-white",
  },
  {
    name: "eBay",
    url: "https://www.ebay.com/sl/sell",
    className: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
  {
    name: "Mercari",
    url: "https://www.mercari.com/sell/",
    className: "bg-red-600 hover:bg-red-700 text-white",
  },
];

const Index = () => {
  const { user } = useAuth();
  const { listings, loading } = useListings();
  const [search, setSearch] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom platform state
  const [showOtherDialog, setShowOtherDialog] = useState(false);
  const [customPlatform, setCustomPlatform] = useState({ name: "", url: "" });
  const [savedCustomPlatforms, setSavedCustomPlatforms] = useState<Array<{ name: string; url: string }>>(() => {
    const saved = localStorage.getItem("customPlatforms");
    return saved ? JSON.parse(saved) : [];
  });

  const openPlatform = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSaveCustomPlatform = () => {
    if (customPlatform.name && customPlatform.url) {
      let url = customPlatform.url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      const newPlatforms = [...savedCustomPlatforms, { name: customPlatform.name, url }];
      setSavedCustomPlatforms(newPlatforms);
      localStorage.setItem("customPlatforms", JSON.stringify(newPlatforms));
      setCustomPlatform({ name: "", url: "" });
      setShowOtherDialog(false);
      openPlatform(url);
    }
  };

  const removeCustomPlatform = (index: number) => {
    const newPlatforms = savedCustomPlatforms.filter((_, i) => i !== index);
    setSavedCustomPlatforms(newPlatforms);
    localStorage.setItem("customPlatforms", JSON.stringify(newPlatforms));
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length) {
            setUploadedImages((prev) => [...prev, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input to allow selecting same files again
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Filter listings by search term
  const filteredListings = listings.filter((listing) => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      listing.title.toLowerCase().includes(searchLower) ||
      (listing.sku && listing.sku.toLowerCase().includes(searchLower))
    );
  });

  // Show recent listings (limit to 6)
  const recentListings = filteredListings.slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Smart Scan Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-xl font-bold">StockSync</h1>
        <BatchImageAnalyzer 
          onProductsDetected={(products: ProductDetails[]) => {
            console.log("Products detected:", products);
          }} 
        />
      </div>

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="border-b bg-muted/30 px-4 py-3">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Uploaded Images ({uploadedImages.length})
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {uploadedImages.map((img, index) => (
              <div key={index} className="relative shrink-0">
                <img
                  src={img}
                  alt={`Upload ${index + 1}`}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-white shadow-md hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="text-center">
          <h1 className="mb-4">Welcome to StockSync</h1>
          <p className="text-xl text-muted-foreground">
            Manage and cross-list your inventory across platforms
          </p>
        </div>

        {/* Listings Section */}
        {user && (
          <div className="mt-12 w-full max-w-5xl">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {search ? `Results for "${search}"` : "Recent Listings"}
              </h2>
              <Button variant="outline" asChild>
                <Link to="/listings">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {loading ? (
              <IndexSkeleton />
            ) : recentListings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-semibold">No listings yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first listing to get started
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/listings/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Listing
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentListings.map((listing) => (
                  <Link key={listing.id} to={`/listings/${listing.id}`}>
                    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                      {/* Image */}
                      <div className="aspect-square overflow-hidden bg-muted">
                        {getPrimaryImage(listing) ? (
                          <img
                            src={getPrimaryImage(listing)}
                            alt={listing.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4">
                        {/* Title & Price */}
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
                          <span className="shrink-0 font-bold text-primary">
                            ${listing.platforms[0]?.price || listing.costPrice}
                          </span>
                        </div>

                        {/* SKU */}
                        {listing.sku && (
                          <p className="mb-2 text-xs text-muted-foreground">
                            SKU: {listing.sku}
                          </p>
                        )}

                        {/* Description */}
                        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                          {listing.description || "No description"}
                        </p>

                        {/* Platform Badges */}
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {listing.platforms.map((p) => (
                            <span
                              key={p.platform}
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${platformStyles[p.platform]}`}
                            >
                              {p.platform === "facebook" ? "FB Market" : PLATFORM_LABELS[p.platform]}
                            </span>
                          ))}
                        </div>

                        {/* Status & Stock */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {listing.platforms.map((p) => (
                              <StatusBadge key={p.platform} status={p.status} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Stock: {listing.quantity}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Add New Listing Button */}
            {recentListings.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Button asChild size="lg">
                  <Link to="/listings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Listing
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Not logged in state */}
        {!user && (
          <div className="mt-8 flex gap-4">
            <Button asChild size="lg">
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Quick List Footer */}
      <div className="border-t bg-muted/30 p-4">
        <p className="mb-3 text-center text-sm text-muted-foreground">
          Quick List to Platform
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {externalPlatforms.map((platform) => (
            <Button
              key={platform.name}
              size="sm"
              className={platform.className}
              onClick={() => openPlatform(platform.url)}
            >
              {platform.name}
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </Button>
          ))}
          
          {/* Custom saved platforms */}
          {savedCustomPlatforms.map((platform, index) => (
            <div key={`custom-${index}`} className="group relative">
              <Button
                size="sm"
                variant="success"
                onClick={() => openPlatform(platform.url)}
              >
                {platform.name}
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </Button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomPlatform(index);
                }}
                className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 text-white shadow-md hover:bg-destructive/90 group-hover:block"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {/* Other button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowOtherDialog(true)}
          >
            <Plus className="mr-1.5 h-3 w-3" />
            Other
          </Button>
        </div>
      </div>

      {/* Custom Platform Dialog */}
      <Dialog open={showOtherDialog} onOpenChange={setShowOtherDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Platform</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                placeholder="e.g., Depop, Grailed, Offerup"
                value={customPlatform.name}
                onChange={(e) => setCustomPlatform((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-url">Listing URL</Label>
              <Input
                id="platform-url"
                placeholder="e.g., depop.com/sell"
                value={customPlatform.url}
                onChange={(e) => setCustomPlatform((prev) => ({ ...prev, url: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOtherDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCustomPlatform}
              disabled={!customPlatform.name || !customPlatform.url}
            >
              Save & Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
