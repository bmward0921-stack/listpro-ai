import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Library, Search, Trash2, Package, RefreshCw } from 'lucide-react';
import { useProductLibrary, ProductTemplate } from '@/hooks/useProductLibrary';
import { useListings } from '@/hooks/useListings';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
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

interface ProductLibraryPickerProps {
  onSelect: (template: ProductTemplate) => void;
}

const ProductLibraryPicker = ({ onSelect }: ProductLibraryPickerProps) => {
  const navigate = useNavigate();
  const { templates, loading, deleteFromLibrary } = useProductLibrary();
  const { createListing } = useListings();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [relisting, setRelisting] = useState<string | null>(null);

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase()) ||
    t.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (template: ProductTemplate) => {
    onSelect(template);
    setOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteFromLibrary(deleteId);
      setDeleteId(null);
    }
  };

  const handleRelist = async (template: ProductTemplate) => {
    setRelisting(template.id);
    try {
      const newListing = await createListing({
        title: template.title,
        description: template.description || '',
        costPrice: template.suggested_price || 0,
        images: template.image_url ? [template.image_url] : [],
        category: template.category || '',
        quantity: 1,
        platforms: [{
          platform: 'facebook',
          price: template.suggested_price || 0,
          status: 'available',
        }],
      });
      
      if (newListing) {
        toast({
          title: 'Listing Created',
          description: `"${template.title}" has been relisted as a draft.`,
        });
        setOpen(false);
        navigate(`/listings/${newListing.id}`);
      }
    } catch (error) {
      console.error('Error relisting:', error);
      toast({
        title: 'Relist Failed',
        description: 'Could not create new listing from this product.',
        variant: 'destructive',
      });
    } finally {
      setRelisting(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" className="gap-2">
            <Library className="h-4 w-4" />
            Library
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" />
              Product Library
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {search ? 'No matching products found' : 'Your library is empty'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {!search && 'Use Smart Scan to add products'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      {template.image_url ? (
                        <img
                          src={template.image_url}
                          alt={template.title}
                          className="h-14 w-14 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-medium">{template.title}</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {template.category && (
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                          )}
                          {template.brand && (
                            <Badge variant="outline" className="text-xs">
                              {template.brand}
                            </Badge>
                          )}
                          {template.suggested_price && (
                            <Badge variant="outline" className="text-xs">
                              ${template.suggested_price}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(template.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleRelist(template)}
                          disabled={relisting === template.id}
                        >
                          <RefreshCw className={`h-3 w-3 ${relisting === template.id ? 'animate-spin' : ''}`} />
                          Relist
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSelect(template)}
                        >
                          Use
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Library?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this product template from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductLibraryPicker;
