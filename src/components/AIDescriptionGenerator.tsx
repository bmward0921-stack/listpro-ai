import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIDescriptionGeneratorProps {
  title: string;
  category: string;
  currentDescription: string;
  onDescriptionGenerated: (description: string) => void;
}

const AIDescriptionGenerator = ({
  title,
  category,
  currentDescription,
  onDescriptionGenerated,
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
        body: { title, category, currentDescription },
      });

      if (error) throw error;

      if (data?.description) {
        onDescriptionGenerated(data.description);
        toast({
          title: 'Description Generated',
          description: 'SEO-optimized description has been created.',
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
          <Sparkles className="h-4 w-4" />
          AI SEO Description
        </>
      )}
    </Button>
  );
};

export default AIDescriptionGenerator;
