CREATE TABLE public.spin_settings (id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), enabled boolean NOT NULL DEFAULT true, daily_limit integer NOT NULL DEFAULT 1 CHECK (daily_limit BETWEEN 0 AND 100), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, UPDATE, INSERT ON public.spin_settings TO authenticated; GRANT ALL ON public.spin_settings TO service_role;
ALTER TABLE public.spin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in view spin settings" ON public.spin_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins edit spin settings" ON public.spin_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER spin_settings_updated_at BEFORE UPDATE ON public.spin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.spin_rewards (slot integer PRIMARY KEY CHECK (slot BETWEEN 1 AND 8), name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80), reward_type text NOT NULL CHECK (reward_type IN ('bonus_coins','br_tokens','discount_coupon','no_luck')), value integer NOT NULL DEFAULT 0 CHECK (value BETWEEN 0 AND 100000), weight integer NOT NULL DEFAULT 1 CHECK (weight BETWEEN 0 AND 10000), enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT spin_reward_value CHECK ((reward_type = 'no_luck' AND value = 0) OR (reward_type = 'discount_coupon' AND value BETWEEN 1 AND 100) OR (reward_type IN ('bonus_coins','br_tokens') AND value BETWEEN 1 AND 100000)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spin_rewards TO authenticated; GRANT ALL ON public.spin_rewards TO service_role;
ALTER TABLE public.spin_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in view wheel rewards" ON public.spin_rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins edit wheel rewards" ON public.spin_rewards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER spin_rewards_updated_at BEFORE UPDATE ON public.spin_rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.spin_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, reward_slot integer NOT NULL, reward_name text NOT NULL, reward_type text NOT NULL, reward_value integer NOT NULL, spin_day date NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX spin_history_user_day_idx ON public.spin_history (user_id, spin_day);
GRANT SELECT ON public.spin_history TO authenticated; GRANT ALL ON public.spin_history TO service_role;
ALTER TABLE public.spin_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players view own spins" ON public.spin_history FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER spin_history_updated_at BEFORE UPDATE ON public.spin_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.spin_settings (id, enabled, daily_limit) VALUES (1, true, 1);
INSERT INTO public.spin_rewards (slot, name, reward_type, value, weight) VALUES
(1, '5 BONUS COINS', 'bonus_coins', 5, 1), (2, '1 BR TOKEN', 'br_tokens', 1, 1),
(3, '10 BONUS COINS', 'bonus_coins', 10, 1), (4, '1 DISCOUNT COUPON', 'discount_coupon', 20, 1),
(5, '15 BONUS COINS', 'bonus_coins', 15, 1), (6, '2 BR TOKENS', 'br_tokens', 2, 1),
(7, 'NO LUCK', 'no_luck', 0, 1), (8, '20 BONUS COINS', 'bonus_coins', 20, 1);

CREATE FUNCTION public.spin_wheel() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_settings public.spin_settings%ROWTYPE; v_reward public.spin_rewards%ROWTYPE; v_total bigint; v_roll numeric; v_id uuid; v_day date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
 SELECT * INTO v_settings FROM public.spin_settings WHERE id = 1 FOR UPDATE;
 IF NOT FOUND OR NOT v_settings.enabled THEN RAISE EXCEPTION 'Spin Wheel is unavailable'; END IF;
 IF (SELECT count(*) FROM public.spin_history WHERE user_id = v_user AND spin_day = v_day) >= v_settings.daily_limit THEN RAISE EXCEPTION 'Daily spin limit reached'; END IF;
 SELECT sum(weight) INTO v_total FROM public.spin_rewards WHERE enabled AND weight > 0;
 IF coalesce(v_total, 0) = 0 THEN RAISE EXCEPTION 'No rewards available'; END IF;
 v_roll := random() * v_total;
 SELECT * INTO v_reward FROM (SELECT r.*, sum(r.weight) OVER (ORDER BY r.slot) AS cumulative FROM public.spin_rewards r WHERE r.enabled AND r.weight > 0) picked WHERE picked.cumulative > v_roll ORDER BY picked.slot LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'No reward selected'; END IF;
 INSERT INTO public.spin_history (user_id, reward_slot, reward_name, reward_type, reward_value, spin_day) VALUES (v_user, v_reward.slot, v_reward.name, v_reward.reward_type, v_reward.value, v_day) RETURNING id INTO v_id;
 IF v_reward.reward_type = 'bonus_coins' THEN
   PERFORM set_config('app.system_coin_update', 'on', true);
   UPDATE public.profiles SET bonus_coins = bonus_coins + v_reward.value, updated_at = now() WHERE id = v_user;
   INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type, reference_id) VALUES (v_user, 'credit', v_reward.value, 'Spin Wheel: ' || v_reward.name, 'success', 'spin_wheel', v_id);
 ELSIF v_reward.reward_type = 'br_tokens' THEN
   PERFORM set_config('app.system_coin_update', 'on', true);
   UPDATE public.profiles SET br_tokens = br_tokens + v_reward.value, updated_at = now() WHERE id = v_user;
 ELSIF v_reward.reward_type = 'discount_coupon' THEN
   INSERT INTO public.user_coupons (user_id, discount_percent, source) VALUES (v_user, v_reward.value, 'spin_wheel');
 END IF;
 RETURN jsonb_build_object('id', v_id, 'slot', v_reward.slot, 'name', v_reward.name, 'reward_type', v_reward.reward_type, 'value', v_reward.value, 'spin_day', v_day);
END; $$;
REVOKE ALL ON FUNCTION public.spin_wheel() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO authenticated;