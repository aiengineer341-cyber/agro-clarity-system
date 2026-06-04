ALTER TABLE public.detections
  ADD COLUMN IF NOT EXISTS input_mode text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS rag_docs_used integer,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

CREATE INDEX IF NOT EXISTS detections_scan_id_idx ON public.detections (scan_id);
CREATE INDEX IF NOT EXISTS detections_user_created_idx ON public.detections (user_id, created_at DESC);