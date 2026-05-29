
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'extension_officer', 'farmer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Farms
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  crop_types TEXT[] DEFAULT '{}',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farms TO authenticated;
GRANT ALL ON public.farms TO service_role;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farms readable by authenticated" ON public.farms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Own farms insert" ON public.farms FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Own farms update" ON public.farms FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Own farms delete" ON public.farms FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Detections
CREATE TABLE public.detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  image_url TEXT,
  crop TEXT NOT NULL,
  disease TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  symptoms TEXT,
  treatment TEXT,
  urgency TEXT,
  prevention TEXT,
  gps TEXT,
  model TEXT DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detections TO authenticated;
GRANT ALL ON public.detections TO service_role;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own detections select" ON public.detections FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'extension_officer'));
CREATE POLICY "Own detections insert" ON public.detections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own detections delete" ON public.detections FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Disease knowledge base (public read)
CREATE TABLE public.disease_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  crop TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.disease_docs TO anon, authenticated;
GRANT ALL ON public.disease_docs TO service_role;
ALTER TABLE public.disease_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docs public read" ON public.disease_docs FOR SELECT USING (true);

-- Seed knowledge base
INSERT INTO public.disease_docs (title, crop, content) VALUES
('Northern Leaf Blight', 'Maize', 'Caused by Exserohilum turcicum. Cigar-shaped tan lesions 2.5–15cm long. Common in humid conditions. Treat with Mancozeb 80WP at 2.5kg/ha. Improve spacing for airflow.'),
('Early Blight', 'Tomato', 'Caused by Alternaria solani. Dark concentric rings on older leaves. Copper-based fungicides effective. Common during dry season. Avoid overhead watering.'),
('Cassava Mosaic Disease', 'Cassava', 'Caused by cassava mosaic begomovirus. Mosaic yellowing and leaf distortion. Spread by whiteflies. No chemical cure — remove infected plants. Use CMD-resistant varieties.'),
('Tomato Leaf Curl Virus', 'Tomato', 'Transmitted by Bemisia tabaci whiteflies. Upward curling and yellowing. Control vectors with imidacloprid. Common during dry season.'),
('Maize Streak Virus', 'Maize', 'Fine chlorotic streaks parallel to veins. Spread by leafhoppers. Plant resistant varieties. Rogue infected plants early.'),
('Late Blight', 'Potato', 'Caused by Phytophthora infestans. Dark water-soaked lesions on leaves with white fuzzy growth underneath. Apply Chlorothalonil. Improve drainage.'),
('Bacterial Wilt', 'Pepper', 'Caused by Ralstonia solanacearum. Sudden wilting without yellowing. Remove infected plants. Rotate crops with non-solanaceous species.'),
('Black Sigatoka', 'Plantain', 'Caused by Mycosphaerella fijiensis. Dark streaks on leaves leading to leaf death. Apply systemic fungicides. Improve plantation sanitation.');

-- Trigger to create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    UPPER(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 1, 2))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'farmer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
