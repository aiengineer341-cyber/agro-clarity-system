
CREATE TABLE public.tts_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status_code integer NOT NULL,
  text_length integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tts_audit_log TO authenticated;
GRANT ALL ON public.tts_audit_log TO service_role;
ALTER TABLE public.tts_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view tts audit log"
  ON public.tts_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX tts_audit_log_created_at_idx ON public.tts_audit_log (created_at DESC);
CREATE INDEX tts_audit_log_user_id_idx ON public.tts_audit_log (user_id);
