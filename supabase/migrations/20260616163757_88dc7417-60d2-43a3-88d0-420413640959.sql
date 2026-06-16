
ALTER TABLE public.billboards ADD COLUMN IF NOT EXISTS precio_impresion_m2 numeric;

CREATE POLICY "Public can view billboard images"
ON storage.objects FOR SELECT
USING (bucket_id = 'billboard-images');

CREATE POLICY "Authenticated users can upload billboard images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'billboard-images');

CREATE POLICY "Users can update their own billboard images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'billboard-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own billboard images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'billboard-images' AND auth.uid()::text = (storage.foldername(name))[1]);
