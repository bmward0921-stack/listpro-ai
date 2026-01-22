import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIDescriptionGeneratorProps {
  title: string;
  category: string;
  currentDescription: string;
  onDescriptionGenerated: (description: string) => void;
  imageUrl?: string; // Optional image URL to analyze for better descriptions
}

const AIDescriptionGenerator = ({
  title,
  category,
  currentDescription,
  onDescriptionGenerated,
  imageUrl,
}: AIDescriptionGeneratorProps) => {
  const [generating, setGenerating] = useState(false);

  const generateDescription = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a product title first.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-seo-description', {
        body: { title, category, currentDescription, imageUrl },
      });

      if (error) throw error;

      if (data?.description) {
        onDescriptionGenerated(data.description);
        toast({
          title: 'Description Generated',
          description: imageUrl 
            ? 'SEO-optimized description created from image analysis.'
            : 'SEO-optimized description has been created.',
        });
      } else {
        throw new Error('No description received');
      }
    } catch (error: any) {
      console.error('Error generating description:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Could not generate description. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const hasImage = !!imageUrl;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={generateDescription}
      disabled={generating}
      className="gap-2"
    >
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          {hasImage ? (
            <Image className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {hasImage ? 'AI from Image' : 'AI SEO Description'}
        </>
      )}
    </Button>
  );
};

export default AIDescriptionGenerator;
