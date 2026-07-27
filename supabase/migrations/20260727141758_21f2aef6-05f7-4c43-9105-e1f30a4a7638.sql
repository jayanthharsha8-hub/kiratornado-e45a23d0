
-- Wallet additions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS br_tokens integer NOT NULL DEFAULT 0;

-- 1. Streak reward catalog
CREATE TABLE IF NOT EXISTS public.streak_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day integer NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  bonus_coins integer NOT NULL DEFAULT 0,
  br_tokens integer NOT NULL DEFAULT 0,
  discount_percent integer NOT NULL DEFAULT 0,
  unlock_key text,
  unlock_days integer,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.streak_rewards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.streak_rewards TO authenticated;
GRANT ALL ON public.streak_rewards TO service_role;
ALTER TABLE public.streak_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view streak rewards" ON public.streak_rewards FOR SELECT USING (true);
CREATE POLICY "Admins manage streak rewards" ON public.streak_rewards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER streak_rewards_updated_at BEFORE UPDATE ON public.streak_rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Player streak state
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id uuid PRIMARY KEY,
  current_day integer NOT NULL DEFAULT 0,
  last_claim_at timestamptz,
  longest_streak integer NOT NULL DEFAULT 0,
  prestige_unlocked boolean NOT NULL DEFAULT false,
  cycles_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_streaks TO authenticated;
GRANT ALL ON public.user_streaks TO service_role;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players view own streak" ON public.user_streaks FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER user_streaks_updated_at BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Coupons
CREATE TABLE IF NOT EXISTS public.user_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  discount_percent integer NOT NULL,
  source text NOT NULL DEFAULT 'daily_streak',
  used_at timestamptz,
  used_on_tournament uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_coupons_user_idx ON public.user_coupons(user_id);
GRANT SELECT ON public.user_coupons TO authenticated;
GRANT ALL ON public.user_coupons TO service_role;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players view own coupons" ON public.user_coupons FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 4. Cosmetic unlocks
CREATE TABLE IF NOT EXISTS public.user_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unlock_key text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, unlock_key)
);
GRANT SELECT ON public.user_unlocks TO authenticated;
GRANT ALL ON public.user_unlocks TO service_role;
ALTER TABLE public.user_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players view own unlocks" ON public.user_unlocks FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5. BR token spend ledger (for daily cap)
CREATE TABLE IF NOT EXISTS public.br_token_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tournament_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS br_token_uses_user_idx ON public.br_token_uses(user_id, created_at);
GRANT SELECT ON public.br_token_uses TO authenticated;
GRANT ALL ON public.br_token_uses TO service_role;
ALTER TABLE public.br_token_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players view own token uses" ON public.br_token_uses FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Protect new wallet fields from client tampering
CREATE OR REPLACE FUNCTION public.prevent_profile_field_tampering()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('app.system_coin_update', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF NEW.coins IS DISTINCT FROM OLD.coins
       OR NEW.bonus_coins IS DISTINCT FROM OLD.bonus_coins
       OR NEW.br_tokens IS DISTINCT FROM OLD.br_tokens
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

-- Claim RPC
CREATE OR REPLACE FUNCTION public.claim_daily_streak()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_state public.user_streaks%ROWTYPE;
  v_reward public.streak_rewards%ROWTYPE;
  v_next_day integer;
  v_prestige boolean;
  v_cycles integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;

  INSERT INTO public.user_streaks (user_id) VALUES (v_user)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_state FROM public.user_streaks WHERE user_id = v_user FOR UPDATE;

  IF v_state.last_claim_at IS NOT NULL AND v_now < v_state.last_claim_at + interval '24 hours' THEN
    RAISE EXCEPTION 'Next reward is not ready yet';
  END IF;

  v_prestige := v_state.prestige_unlocked;
  v_cycles := v_state.cycles_completed;

  IF v_state.last_claim_at IS NULL OR v_now > v_state.last_claim_at + interval '48 hours' THEN
    v_next_day := 1;
  ELSE
    v_next_day := v_state.current_day + 1;
  END IF;

  IF v_next_day > 30 THEN v_next_day := 1; END IF;

  SELECT * INTO v_reward FROM public.streak_rewards WHERE day = v_next_day AND enabled = true;

  PERFORM set_config('app.system_coin_update', 'on', true);

  IF FOUND THEN
    IF v_reward.bonus_coins > 0 OR v_reward.br_tokens > 0 THEN
      UPDATE public.profiles
      SET bonus_coins = bonus_coins + v_reward.bonus_coins,
          br_tokens = br_tokens + v_reward.br_tokens,
          updated_at = v_now
      WHERE id = v_user;

      IF v_reward.bonus_coins > 0 THEN
        INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type)
        VALUES (v_user, 'credit', v_reward.bonus_coins, 'Daily Streak Bonus Coins', 'success', 'daily_streak');
      END IF;
    END IF;

    IF v_reward.discount_percent > 0 THEN
      INSERT INTO public.user_coupons (user_id, discount_percent) VALUES (v_user, v_reward.discount_percent);
    END IF;

    IF v_reward.unlock_key IS NOT NULL AND v_reward.unlock_key <> '' THEN
      INSERT INTO public.user_unlocks (user_id, unlock_key, expires_at)
      VALUES (v_user, v_reward.unlock_key,
        CASE WHEN v_reward.unlock_days IS NOT NULL THEN v_now + (v_reward.unlock_days || ' days')::interval ELSE NULL END)
      ON CONFLICT (user_id, unlock_key) DO UPDATE
        SET expires_at = EXCLUDED.expires_at, created_at = v_now;
    END IF;
  END IF;

  IF v_next_day = 30 THEN
    v_prestige := true;
    v_cycles := v_cycles + 1;
  END IF;

  UPDATE public.user_streaks
  SET current_day = v_next_day,
      last_claim_at = v_now,
      longest_streak = greatest(longest_streak, v_next_day),
      prestige_unlocked = v_prestige,
      cycles_completed = v_cycles,
      updated_at = v_now
  WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'day', v_next_day,
    'prestige_unlocked', v_prestige,
    'next_claim_at', v_now + interval '24 hours',
    'reward', to_jsonb(v_reward)
  );
END;
$$;

-- Join tournament with bonus coins / coupon / BR token support
CREATE OR REPLACE FUNCTION public.join_tournament(
  _tournament_id uuid,
  _coupon_id uuid DEFAULT NULL,
  _use_br_token boolean DEFAULT false
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_tournament public.tournaments%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_next_count integer;
  v_fee integer;
  v_coupon public.user_coupons%ROWTYPE;
  v_token_used boolean := false;
  v_from_bonus integer := 0;
  v_from_coins integer := 0;
  v_today_tokens integer;
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

  v_fee := v_tournament.entry_fee;

  PERFORM set_config('app.system_coin_update', 'on', true);

  -- BR token: Battle Royale only, max 2 per day
  IF _use_br_token AND v_fee > 0 THEN
    IF v_tournament.category <> 'battle_royale' THEN RAISE EXCEPTION 'BR Tokens work only for Battle Royale tournaments'; END IF;
    IF v_profile.br_tokens < 1 THEN RAISE EXCEPTION 'No BR Tokens available'; END IF;
    SELECT count(*) INTO v_today_tokens FROM public.br_token_uses
      WHERE user_id = v_user AND created_at >= date_trunc('day', now());
    IF v_today_tokens >= 2 THEN RAISE EXCEPTION 'Daily limit reached: max 2 BR Tokens per day'; END IF;

    UPDATE public.profiles SET br_tokens = br_tokens - 1, updated_at = now() WHERE id = v_user;
    INSERT INTO public.br_token_uses (user_id, tournament_id) VALUES (v_user, _tournament_id);
    v_token_used := true;
    v_fee := 0;
  END IF;

  -- Coupon
  IF NOT v_token_used AND _coupon_id IS NOT NULL AND v_fee > 0 THEN
    SELECT * INTO v_coupon FROM public.user_coupons WHERE id = _coupon_id AND user_id = v_user FOR UPDATE;
    IF NOT FOUND OR v_coupon.used_at IS NOT NULL THEN RAISE EXCEPTION 'Coupon not available'; END IF;
    IF v_tournament.category NOT IN ('battle_royale', 'classic_squad') THEN
      RAISE EXCEPTION 'Coupon works only on paid Clash Squad and Battle Royale tournaments';
    END IF;
    v_fee := greatest(0, v_fee - floor(v_fee * v_coupon.discount_percent / 100.0)::integer);
    UPDATE public.user_coupons SET used_at = now(), used_on_tournament = _tournament_id WHERE id = _coupon_id;
  END IF;

  IF v_fee > 0 THEN
    IF (v_profile.coins + v_profile.bonus_coins) < v_fee THEN RAISE EXCEPTION 'Not enough coins'; END IF;
    v_from_bonus := least(v_profile.bonus_coins, v_fee);
    v_from_coins := v_fee - v_from_bonus;
    UPDATE public.profiles
      SET bonus_coins = bonus_coins - v_from_bonus,
          coins = coins - v_from_coins,
          updated_at = now()
      WHERE id = v_user;
    INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type, reference_id)
    VALUES (v_user, 'debit', v_fee, 'Joined Match', 'success', 'tournament', _tournament_id);
  END IF;

  INSERT INTO public.registrations (tournament_id, user_id) VALUES (_tournament_id, v_user);
  SELECT joined_players_count INTO v_next_count FROM public.tournaments WHERE id = _tournament_id;

  RETURN jsonb_build_object(
    'joined', true,
    'coins', v_profile.coins - v_from_coins,
    'bonus_coins', v_profile.bonus_coins - v_from_bonus,
    'br_token_used', v_token_used,
    'paid', v_fee,
    'joined_players_count', v_next_count,
    'total_slots', v_tournament.total_slots
  );
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.streak_rewards;
