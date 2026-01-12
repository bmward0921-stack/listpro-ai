import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Platform, PLATFORM_LABELS } from '@/types/listing';
import { 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  ExternalLink,
  CheckCircle,
  Clock,
  Package
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QueuedItem {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  platforms: {
    platform: Platform;
    url: string;
    listed: boolean;
  }[];
}

interface BulkListingQueueProps {
  onCreateListings: (items: QueuedItem[]) => Promise<void>;
}

const PLATFORMS: Platform[] = ['facebook', 'poshmark', 'squarespace'];

const BulkListingQueue = ({ onCreateListings }: BulkListingQueueProps) => {
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const addToQueue = () => {
    const newItem: QueuedItem = {
      id: crypto.randomUUID(),
      title: '',
      price: 0,
      platforms: PLATFORMS.map(p => ({ platform: p, url: '', listed: false })),
    };
    setQueue([...queue, newItem]);
  };

  const updateQueueItem = (id: string, updates: Partial<QueuedItem>) => {
    setQueue(queue.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const updatePlatformUrl = (itemId: string, platform: Platform, url: string) => {
    setQueue(queue.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        platforms: item.platforms.map(p => 
          p.platform === platform ? { ...p, url, listed: !!url } : p
        ),
      };
    }));
  };

  const removeFromQueue = (id: string) => {
    setQueue(queue.filter(item => item.id !== id));
    selectedItems.delete(id);
    setSelectedItems(new Set(selectedItems));
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === queue.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(queue.map(i => i.id)));
    }
  };

  const handleBulkCreate = async () => {
    const itemsToCreate = queue.filter(i => selectedItems.has(i.id) && i.title);
    if (itemsToCreate.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select items with titles to create listings.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await onCreateListings(itemsToCreate);
      // Remove created items from queue
      setQueue(queue.filter(i => !selectedItems.has(i.id)));
      setSelectedItems(new Set());
      toast({
        title: 'Success',
        description: `Created ${itemsToCreate.length} listings.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create some listings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getListedCount = (item: QueuedItem) => 
    item.platforms.filter(p => p.listed).length;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedItems.size === queue.length && queue.length > 0}
            onCheckedChange={selectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedItems.size} of {queue.length} selected
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addToQueue}>
            <Plus className="mr-1 h-4 w-4" />
            Add Item
          </Button>
          {selectedItems.size > 0 && (
            <Button size="sm" onClick={handleBulkCreate} disabled={loading}>
              {loading ? 'Creating...' : `Create ${selectedItems.size} Listings`}
            </Button>
          )}
        </div>
      </div>

      {/* Queue Items */}
      {queue.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No items in queue</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Add items to your queue to bulk list across platforms
            </p>
            <Button className="mt-4" onClick={addToQueue}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-3">
                {/* Item Header */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleSelectItem(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-3">
                    {/* Title & Price Row */}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        placeholder="Product title"
                        value={item.title}
                        onChange={(e) => updateQueueItem(item.id, { title: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.price || ''}
                        onChange={(e) => updateQueueItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        className="w-full sm:w-24"
                      />
                    </div>

                    {/* Platform URLs - Compact for mobile */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Platform URLs ({getListedCount(item)}/{PLATFORMS.length} linked)
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {item.platforms.map((p) => (
                          <div key={p.platform} className="flex items-center gap-2">
                            <Badge 
                              variant={p.listed ? 'default' : 'outline'}
                              className="w-16 justify-center text-xs"
                            >
                              {p.platform === 'facebook' ? 'FB' : 
                               p.platform === 'poshmark' ? 'PM' : 'SQ'}
                            </Badge>
                            <Input
                              type="url"
                              placeholder={`${PLATFORM_LABELS[p.platform]} URL`}
                              value={p.url}
                              onChange={(e) => updatePlatformUrl(item.id, p.platform, e.target.value)}
                              className="flex-1 text-sm"
                            />
                            {p.url && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => window.open(p.url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {item.platforms.map(p => (
                          <Badge
                            key={p.platform}
                            variant={p.listed ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {p.listed ? (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            ) : (
                              <Clock className="mr-1 h-3 w-3" />
                            )}
                            {p.platform === 'facebook' ? 'FB' : 
                             p.platform === 'poshmark' ? 'Posh' : 'SQ'}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFromQueue(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BulkListingQueue;
