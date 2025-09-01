-- Create storage bucket for billboard images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('billboard-images', 'billboard-images', true);

-- Create storage policies for billboard images
CREATE POLICY "Public Access to Billboard Images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'billboard-images');

CREATE POLICY "Users can upload their own billboard images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'billboard-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own billboard images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'billboard-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own billboard images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'billboard-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create billboards table
CREATE TABLE public.billboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('espectacular', 'muro', 'valla', 'parabus', 'digital')),
  medidas JSONB NOT NULL DEFAULT '{}',
  digital JSONB DEFAULT NULL,
  contratacion JSONB NOT NULL DEFAULT '{}',
  precio JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'ocupada', 'mantenimiento')),
  fotos TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on billboards table
ALTER TABLE public.billboards ENABLE ROW LEVEL SECURITY;

-- Create policies for billboards
CREATE POLICY "Owners can view their own billboards" 
ON public.billboards 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create their own billboards" 
ON public.billboards 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own billboards" 
ON public.billboards 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own billboards" 
ON public.billboards 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Allow public access to view available billboards for advertisers
CREATE POLICY "Public can view available billboards" 
ON public.billboards 
FOR SELECT 
USING (status = 'disponible');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_billboards_updated_at
BEFORE UPDATE ON public.billboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();