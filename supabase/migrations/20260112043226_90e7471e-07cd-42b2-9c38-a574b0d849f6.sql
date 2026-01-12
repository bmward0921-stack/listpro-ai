-- Create product_library table for saved product templates
CREATE TABLE public.product_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  suggested_price NUMERIC,
  brand TEXT,
  condition TEXT,
  color TEXT,
  keywords TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_library ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own library items" 
ON public.product_library 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own library items" 
ON public.product_library 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library items" 
ON public.product_library 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own library items" 
ON public.product_library 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_library_updated_at
BEFORE UPDATE ON public.product_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();