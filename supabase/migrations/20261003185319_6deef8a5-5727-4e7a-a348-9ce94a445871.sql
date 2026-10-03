REVOKE EXECUTE ON FUNCTION public.spin_wheel() FROM authenticated;
DROP FUNCTION public.spin_wheel();
GRANT INSERT ON public.spin_history TO authenticated;
CREATE POLICY "Players request own spins" ON public.spin_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE FUNCTION public.award_spin_on_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_settings public.spin_settings%ROWTYPE; v_reward public.spin_rewards%ROWTYPE; v_total bigint; v_roll numeric; v_day date := (now() AT TIME ZONE 'UTC')::date;
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
 NEW.id := gen_random_uuid(); NEW.user_id := v_user; NEW.reward_slot := v_reward.slot; NEW.reward_name := v_reward.name; NEW.reward_type := v_reward.reward_type; NEW.reward_value := v_reward.value; NEW.spin_day := v_day; NEW.created_at := now(); NEW.updated_at := now();
 IF v_reward.reward_type = 'bonus_coins' THEN
   PERFORM set_config('app.system_coin_update', 'on', true);
   UPDATE public.profiles SET bonus_coins = bonus_coins + v_reward.value, updated_at = now() WHERE id = v_user;
   INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type, reference_id) VALUES (v_user, 'credit', v_reward.value, 'Spin Wheel: ' || v_reward.name, 'success', 'spin_wheel', NEW.id);
 ELSIF v_reward.reward_type = 'br_tokens' THEN
   PERFORM set_config('app.system_coin_update', 'on', true);
   UPDATE public.profiles SET br_tokens = br_tokens + v_reward.value, updated_at = now() WHERE id = v_user;
 ELSIF v_reward.reward_type = 'discount_coupon' THEN
   INSERT INTO public.user_coupons (user_id, discount_percent, source) VALUES (v_user, v_reward.value, 'spin_wheel');
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.award_spin_on_insert() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER award_spin_before_insert BEFORE INSERT ON public.spin_history FOR EACH ROW EXECUTE FUNCTION public.award_spin_on_insert();