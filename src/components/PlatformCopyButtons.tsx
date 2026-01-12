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
import { Platform, PLATFORM_LABELS } from '@/types/listing';
import { Copy, Check, ChevronDown } from 'lucide-react';
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

const PlatformCopyButtons = ({ title, description, price, category }: PlatformCopyButtonsProps) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {copiedPlatform ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Copy For</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Copy formatted for...</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => copyForPlatform('poshmark')}>
          <div className="flex flex-col">
            <span>Poshmark</span>
            <span className="text-xs text-muted-foreground">With hashtags & bundle text</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyForPlatform('facebook')}>
          <div className="flex flex-col">
            <span>Facebook Marketplace</span>
            <span className="text-xs text-muted-foreground">With emojis & keywords</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyForPlatform('squarespace')}>
          <div className="flex flex-col">
            <span>Squarespace</span>
            <span className="text-xs text-muted-foreground">Clean & professional</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => copyForPlatform('generic')}>
          <div className="flex flex-col">
            <span>Generic</span>
            <span className="text-xs text-muted-foreground">Plain text format</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PlatformCopyButtons;
