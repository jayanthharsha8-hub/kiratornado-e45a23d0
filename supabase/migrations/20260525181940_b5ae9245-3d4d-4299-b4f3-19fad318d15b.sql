
-- 1) Move room credentials to a private table
CREATE TABLE IF NOT EXISTS public.tournament_rooms (
  tournament_id uuid PRIMARY KEY REFERENCES public.tournaments(id) ON DELETE CASCADE,
  room_id text,
  room_password text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.tournament_rooms (tournament_id, room_id, room_password)
SELECT id, room_id, room_password FROM public.tournaments
WHERE room_id IS NOT NULL OR room_password IS NOT NULL
ON CONFLICT (tournament_id) DO NOTHING;

ALTER TABLE public.tournaments DROP COLUMN IF EXISTS room_id;
ALTER TABLE public.tournaments DROP COLUMN IF EXISTS room_password;

ALTER TABLE public.tournament_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tournament rooms"
ON public.tournament_rooms FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Registered players view their tournament room"
ON public.tournament_rooms FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.tournament_id = tournament_rooms.tournament_id
      AND r.user_id = auth.uid()
  )
);

-- 2) Prevent users from modifying game-integrity fields on their own profile
CREATE OR REPLACE FUNCTION public.prevent_profile_field_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('app.system_coin_update', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.coins IS DISTINCT FROM OLD.coins
       OR NEW.is_banned IS DISTINCT FROM OLD.is_banned
       OR NEW.total_kills IS DISTINCT FROM OLD.total_kills
       OR NEW.wins IS DISTINCT FROM OLD.wins
       OR NEW.matches_played IS DISTINCT FROM OLD.matches_played THEN
      RAISE EXCEPTION 'These fields can only be changed by system actions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_player_coin_tampering_trigger ON public.profiles;
DROP TRIGGER IF EXISTS prevent_profile_field_tampering_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_field_tampering_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_field_tampering();

-- 3) Explicit deny for non-admin self-insertion of roles
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Lock down EXECUTE privileges on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_field_tampering() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_tournament_joined_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_adjust_coins(uuid, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_handle_wallet_request(uuid, wallet_request_status) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_tournament(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(integer, withdraw_type, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_player_account() FROM PUBLIC, anon;
