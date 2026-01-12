import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Platform, PLATFORM_LABELS } from '@/types/listing';
import { Copy, Check, ChevronDown, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PlatformCopyButtonsProps {
  title: string;
  description: string;
  price: number;
  category?: string;
}

// Generate hashtags from title and category
const generateHashtags = (title: string, category?: string): string => {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const hashtags = words.slice(0, 5).map(w => `#${w}`);
  
  // Add category hashtag
  if (category) {
    hashtags.push(`#${category.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
  }
  
  // Add common reseller hashtags
  hashtags.push('#forsale', '#shopsmall', '#reseller');
  
  return [...new Set(hashtags)].slice(0, 10).join(' ');
};

// Generate Facebook-friendly keywords
const generateKeywords = (title: string, category?: string): string => {
  const keywords: string[] = [];
  
  if (category) {
    keywords.push(category);
  }
  
  // Common search terms
  keywords.push('for sale', 'great condition', 'local pickup', 'shipping available');
  
  return keywords.join(' • ');
};

// Format for Poshmark (hashtags, concise, stylized)
const formatForPoshmark = (
  title: string,
  description: string,
  price: number,
  category?: string
): string => {
  const hashtags = generateHashtags(title, category);
  
  return `${title}

${description}

💰 Price: $${price.toFixed(2)}

${hashtags}

✨ Bundle to save on shipping!
💕 Offers welcome!`;
};

// Format for Facebook Marketplace (keywords, emojis, local focus)
const formatForFacebook = (
  title: string,
  description: string,
  price: number,
  category?: string
): string => {
  const keywords = generateKeywords(title, category);
  
  return `🔥 ${title} - $${price.toFixed(2)}

${description}

📦 ${keywords}

✅ Great condition
🚗 Local pickup available
📬 Shipping available

💬 Message for questions!`;
};

// Format for Squarespace (clean, professional)
const formatForSquarespace = (
  title: string,
  description: string,
  price: number,
  category?: string
): string => {
  return `${description}

${category ? `Category: ${category}` : ''}

Price: $${price.toFixed(2)}`;
};

// Format all details together (generic)
const formatGeneric = (
  title: string,
  description: string,
  price: number
): string => {
  return `${title}

Price: $${price.toFixed(2)}

${description}`;
};

const platformFormatters: Record<Platform | 'generic', (title: string, description: string, price: number, category?: string) => string> = {
  poshmark: formatForPoshmark,
  facebook: formatForFacebook,
  squarespace: formatForSquarespace,
  generic: formatGeneric,
};

const platformDescriptions: Record<Platform | 'generic', string> = {
  poshmark: 'With hashtags & bundle text',
  facebook: 'With emojis & keywords',
  squarespace: 'Clean & professional',
  generic: 'Plain text format',
};

const PlatformCopyButtons = ({ title, description, price, category }: PlatformCopyButtonsProps) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<string>('poshmark');

  const copyForPlatform = async (platform: Platform | 'generic') => {
    const formatter = platformFormatters[platform];
    const formattedText = formatter(title, description, price, category);
    
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopiedPlatform(platform);
      toast({
        title: 'Copied!',
        description: platform === 'generic' 
          ? 'Generic listing copied.' 
          : `Formatted for ${PLATFORM_LABELS[platform as Platform]}.`,
      });
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (err) {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const hasContent = title || description;

  if (!hasContent) return null;

  const platforms: (Platform | 'generic')[] = ['poshmark', 'facebook', 'squarespace', 'generic'];

  return (
    <div className="flex gap-2">
      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Listing Preview</DialogTitle>
          </DialogHeader>
          <Tabs value={previewTab} onValueChange={setPreviewTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="poshmark" className="text-xs">Posh</TabsTrigger>
              <TabsTrigger value="facebook" className="text-xs">FB</TabsTrigger>
              <TabsTrigger value="squarespace" className="text-xs">SQ</TabsTrigger>
              <TabsTrigger value="generic" className="text-xs">Generic</TabsTrigger>
            </TabsList>
            {platforms.map((platform) => (
              <TabsContent key={platform} value={platform} className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {platformDescriptions[platform]}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => copyForPlatform(platform)}
                      className="gap-1.5"
                    >
                      {copiedPlatform === platform ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <ScrollArea className="h-64 rounded-lg border bg-muted/30 p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {platformFormatters[platform](title, description, price, category)}
                    </pre>
                  </ScrollArea>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Quick Copy Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            {copiedPlatform ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Copy</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Copy formatted for...</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => copyForPlatform('poshmark')}>
            <div className="flex flex-col">
              <span>Poshmark</span>
              <span className="text-xs text-muted-foreground">{platformDescriptions.poshmark}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copyForPlatform('facebook')}>
            <div className="flex flex-col">
              <span>Facebook Marketplace</span>
              <span className="text-xs text-muted-foreground">{platformDescriptions.facebook}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copyForPlatform('squarespace')}>
            <div className="flex flex-col">
              <span>Squarespace</span>
              <span className="text-xs text-muted-foreground">{platformDescriptions.squarespace}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => copyForPlatform('generic')}>
            <div className="flex flex-col">
              <span>Generic</span>
              <span className="text-xs text-muted-foreground">{platformDescriptions.generic}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PlatformCopyButtons;
