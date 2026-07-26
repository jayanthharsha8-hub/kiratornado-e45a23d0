ALTER TABLE public.home_banners ADD COLUMN IF NOT EXISTS button_link text;

ALTER TABLE public.category_card_images ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.category_card_images ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE public.category_card_images ADD COLUMN IF NOT EXISTS event_label text;

CREATE TABLE IF NOT EXISTS public.home_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  badge_label text,
  image_url text,
  link text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_offers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_offers TO authenticated;
GRANT ALL ON public.home_offers TO service_role;
ALTER TABLE public.home_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view active offers" ON public.home_offers FOR SELECT TO authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage offers" ON public.home_offers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_home_offers_updated_at BEFORE UPDATE ON public.home_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.home_popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  image_url text,
  button_text text,
  link text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_popups TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_popups TO authenticated;
GRANT ALL ON public.home_popups TO service_role;
ALTER TABLE public.home_popups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view active popups" ON public.home_popups FOR SELECT TO authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage popups" ON public.home_popups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_home_popups_updated_at BEFORE UPDATE ON public.home_popups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.home_banners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.category_card_images;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_banners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_popups;