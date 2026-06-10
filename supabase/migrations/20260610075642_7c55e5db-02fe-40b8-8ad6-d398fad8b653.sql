CREATE TABLE public.detection_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_id uuid NOT NULL REFERENCES public.detections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_fields text[] NOT NULL DEFAULT '{}',
  previous jsonb NOT NULL DEFAULT '{}'::jsonb,
  next jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX detection_versions_detection_id_idx ON public.detection_versions(detection_id, changed_at DESC);

GRANT SELECT, INSERT ON public.detection_versions TO authenticated;
GRANT ALL ON public.detection_versions TO service_role;

ALTER TABLE public.detection_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view versions of their detections"
  ON public.detection_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.detections d
      WHERE d.id = detection_versions.detection_id
        AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert versions for their detections"
  ON public.detection_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.detections d
      WHERE d.id = detection_versions.detection_id
        AND d.user_id = auth.uid()
    )
  );