DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.detections;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE public.detections REPLICA IDENTITY FULL;