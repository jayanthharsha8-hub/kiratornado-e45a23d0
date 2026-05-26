
-- Curated profile avatars table
CREATE TABLE IF NOT EXISTS public.profile_avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  label text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatars_select_all_authenticated"
  ON public.profile_avatars FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "avatars_admin_insert"
  ON public.profile_avatars FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "avatars_admin_update"
  ON public.profile_avatars FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "avatars_admin_delete"
  ON public.profile_avatars FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "profile_avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-avatars');

CREATE POLICY "profile_avatars_admin_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profile_avatars_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profile_avatars_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-avatars' AND public.has_role(auth.uid(), 'admin'));
