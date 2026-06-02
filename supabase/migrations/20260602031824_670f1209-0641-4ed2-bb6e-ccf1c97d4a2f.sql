-- Storage bucket for vision images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vision-images',
  'vision-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
CREATE POLICY "vision-images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'vision-images');

-- Authenticated users can upload to their own folder (path prefix = uid)
CREATE POLICY "vision-images user upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vision-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "vision-images user update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vision-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "vision-images user delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vision-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ranked predictions per scan
ALTER TABLE public.detections
  ADD COLUMN IF NOT EXISTS rank int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scan_id uuid;

CREATE INDEX IF NOT EXISTS idx_detections_user_id ON public.detections(user_id);
CREATE INDEX IF NOT EXISTS idx_detections_disease ON public.detections(disease);
CREATE INDEX IF NOT EXISTS idx_detections_created_at ON public.detections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detections_scan_id ON public.detections(scan_id);
