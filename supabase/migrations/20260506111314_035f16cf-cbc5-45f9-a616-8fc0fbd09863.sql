ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS joined_players_count integer NOT NULL DEFAULT 0;

UPDATE public.tournaments t
SET joined_players_count = COALESCE(r.count, 0)
FROM (
  SELECT tournament_id, count(*)::integer AS count
  FROM public.registrations
  GROUP BY tournament_id
) r
WHERE r.tournament_id = t.id;

UPDATE public.tournaments
SET joined_players_count = 0
WHERE joined_players_count IS NULL;

CREATE OR REPLACE FUNCTION public.sync_tournament_joined_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tournament_id uuid;
BEGIN
  v_tournament_id := COALESCE(NEW.tournament_id, OLD.tournament_id);

  UPDATE public.tournaments t
  SET joined_players_count = (
    SELECT count(*)::integer
    FROM public.registrations r
    WHERE r.tournament_id = v_tournament_id
  )
  WHERE t.id = v_tournament_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS sync_tournament_joined_count_after_change ON public.registrations;
CREATE TRIGGER sync_tournament_joined_count_after_change
AFTER INSERT OR DELETE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.sync_tournament_joined_count();

CREATE OR REPLACE FUNCTION public.join_tournament(_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_tournament public.tournaments%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_next_count integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;

  SELECT * INTO v_tournament FROM public.tournaments WHERE id = _tournament_id AND published = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF v_tournament.status <> 'upcoming' THEN RAISE EXCEPTION 'Tournament is not open for joining'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Player profile not found'; END IF;
  IF v_profile.player_level < v_tournament.level_requirement THEN RAISE EXCEPTION 'Level % required', v_tournament.level_requirement; END IF;
  IF EXISTS (SELECT 1 FROM public.registrations WHERE tournament_id = _tournament_id AND user_id = v_user) THEN RAISE EXCEPTION 'Already joined'; END IF;

  IF v_tournament.joined_players_count >= v_tournament.total_slots THEN RAISE EXCEPTION 'Match full'; END IF;

  IF v_tournament.entry_fee > 0 THEN
    IF v_profile.coins < v_tournament.entry_fee THEN RAISE EXCEPTION 'Not enough coins'; END IF;
    PERFORM set_config('app.system_coin_update', 'on', true);
    UPDATE public.profiles SET coins = coins - v_tournament.entry_fee, updated_at = now() WHERE id = v_user;
    INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type, reference_id)
    VALUES (v_user, 'debit', v_tournament.entry_fee, 'Joined Match', 'success', 'tournament', _tournament_id);
  END IF;

  INSERT INTO public.registrations (tournament_id, user_id) VALUES (_tournament_id, v_user);

  SELECT joined_players_count INTO v_next_count
  FROM public.tournaments
  WHERE id = _tournament_id;

  RETURN jsonb_build_object('joined', true, 'coins', greatest(v_profile.coins - v_tournament.entry_fee, 0), 'joined_players_count', v_next_count, 'total_slots', v_tournament.total_slots);
END;
$function$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;