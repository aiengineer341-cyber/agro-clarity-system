
-- 1) app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read app settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write app settings"
  ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update app settings"
  ON public.app_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.app_settings (key, value)
VALUES ('tts_audit_retention_days', '30'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Helper to read retention days with fallback
CREATE OR REPLACE FUNCTION public.get_tts_retention_days()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF((value)::text, 'null')::integer,
    30
  )
  FROM public.app_settings WHERE key = 'tts_audit_retention_days'
  UNION ALL SELECT 30
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_tts_retention_days() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tts_retention_days() TO authenticated, service_role;

-- 2) tts_audit_log_archive (mirror of tts_audit_log)
CREATE TABLE IF NOT EXISTS public.tts_audit_log_archive (
  LIKE public.tts_audit_log INCLUDING ALL,
  archived_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tts_audit_log_archive TO authenticated;
GRANT ALL ON public.tts_audit_log_archive TO service_role;

ALTER TABLE public.tts_audit_log_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read tts archive"
  ON public.tts_audit_log_archive FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) purge function
CREATE OR REPLACE FUNCTION public.purge_tts_audit_log()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  retention_days integer := public.get_tts_retention_days();
  archived_count integer := 0;
  purged_count integer := 0;
BEGIN
  WITH moved AS (
    DELETE FROM public.tts_audit_log
    WHERE created_at < now() - make_interval(days => retention_days)
    RETURNING *
  )
  INSERT INTO public.tts_audit_log_archive
  SELECT *, now() FROM moved;
  GET DIAGNOSTICS archived_count = ROW_COUNT;

  DELETE FROM public.tts_audit_log_archive
  WHERE created_at < now() - make_interval(days => retention_days * 6);
  GET DIAGNOSTICS purged_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'archived', archived_count,
    'purged', purged_count,
    'retention_days', retention_days,
    'ran_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_tts_audit_log() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_tts_audit_log() TO service_role;

-- 4) pg_cron schedule (daily 03:00 UTC)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-tts-audit-log-daily') THEN
    PERFORM cron.unschedule('purge-tts-audit-log-daily');
  END IF;
  PERFORM cron.schedule(
    'purge-tts-audit-log-daily',
    '0 3 * * *',
    $CRON$SELECT public.purge_tts_audit_log();$CRON$
  );
END $$;

-- 5) detections.weather snapshot
ALTER TABLE public.detections ADD COLUMN IF NOT EXISTS weather jsonb;
