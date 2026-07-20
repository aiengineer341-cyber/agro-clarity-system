
-- Tighten farms SELECT: owner-only
DROP POLICY IF EXISTS "Farms readable by authenticated" ON public.farms;
CREATE POLICY "Own farms select" ON public.farms
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

-- Tighten profiles SELECT: self-only
DROP POLICY IF EXISTS "Profiles readable by authenticated" ON public.profiles;
CREATE POLICY "Own profile select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Allow admins to read contact_messages
CREATE POLICY "Admins can read contact messages" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Restrict vision-images object listing to owning user's folder;
-- public file access via public URL still works for the <img> tags.
DROP POLICY IF EXISTS "vision-images public read" ON storage.objects;
CREATE POLICY "vision-images owner list"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'vision-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Revoke broad EXECUTE on SECURITY DEFINER has_role; keep for authenticated (required by RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
