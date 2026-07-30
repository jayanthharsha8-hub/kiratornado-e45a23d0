CREATE TABLE public.coin_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  coins integer NOT NULL DEFAULT 0,
  bonus_coins integer NOT NULL DEFAULT 0,
  price integer NOT NULL DEFAULT 0,
  banner_url text,
  badge text,
  accent text,
  description text,
  pack_type text NOT NULL DEFAULT 'coins',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coin_packs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coin_packs TO authenticated;
GRANT ALL ON public.coin_packs TO service_role;
ALTER TABLE public.coin_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active coin packs" ON public.coin_packs FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage coin packs" ON public.coin_packs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_coin_packs_updated_at BEFORE UPDATE ON public.coin_packs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.coin_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  coins integer NOT NULL DEFAULT 0,
  bonus_coins integer NOT NULL DEFAULT 0,
  price integer NOT NULL DEFAULT 0,
  banner_url text,
  offer_type text NOT NULL DEFAULT 'limited',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coin_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coin_offers TO authenticated;
GRANT ALL ON public.coin_offers TO service_role;
ALTER TABLE public.coin_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active offers" ON public.coin_offers FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage offers" ON public.coin_offers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_coin_offers_updated_at BEFORE UPDATE ON public.coin_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.coin_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pack_id uuid REFERENCES public.coin_packs(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES public.coin_offers(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  coins integer NOT NULL DEFAULT 0,
  bonus_coins integer NOT NULL DEFAULT 0,
  price integer NOT NULL DEFAULT 0,
  upi_ref text,
  status wallet_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.coin_orders TO authenticated;
GRANT UPDATE ON public.coin_orders TO authenticated;
GRANT ALL ON public.coin_orders TO service_role;
ALTER TABLE public.coin_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.coin_orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own orders" ON public.coin_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update orders" ON public.coin_orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_coin_orders_updated_at BEFORE UPDATE ON public.coin_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_coin_order(_pack_id uuid DEFAULT NULL, _offer_id uuid DEFAULT NULL, _upi_ref text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_name text; v_coins integer; v_bonus integer; v_price integer; v_id uuid;
  v_expires timestamptz;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  IF (_pack_id IS NULL) = (_offer_id IS NULL) THEN RAISE EXCEPTION 'Select one item'; END IF;

  IF _pack_id IS NOT NULL THEN
    SELECT name, coins, bonus_coins, price INTO v_name, v_coins, v_bonus, v_price
    FROM public.coin_packs WHERE id = _pack_id AND active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pack unavailable'; END IF;
  ELSE
    SELECT title, coins, bonus_coins, price, expires_at INTO v_name, v_coins, v_bonus, v_price, v_expires
    FROM public.coin_offers WHERE id = _offer_id AND active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Offer unavailable'; END IF;
    IF v_expires IS NOT NULL AND v_expires < now() THEN RAISE EXCEPTION 'Offer expired'; END IF;
  END IF;

  INSERT INTO public.coin_orders (user_id, pack_id, offer_id, item_name, coins, bonus_coins, price, upi_ref)
  VALUES (v_user, _pack_id, _offer_id, v_name, v_coins, v_bonus, v_price, nullif(trim(_upi_ref), ''))
  RETURNING id INTO v_id;

  INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type, reference_id)
  VALUES (v_user, 'credit', v_coins + v_bonus, 'Coin Store: ' || v_name, 'pending', 'coin_order', v_id);

  RETURN jsonb_build_object('order_id', v_id, 'coins', v_coins, 'bonus_coins', v_bonus, 'total', v_coins + v_bonus, 'price', v_price);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_handle_coin_order(_order_id uuid, _status wallet_request_status)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_order public.coin_orders%ROWTYPE; v_coins integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF _status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;

  SELECT * INTO v_order FROM public.coin_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status <> 'pending' THEN RAISE EXCEPTION 'Order already handled'; END IF;

  UPDATE public.coin_orders SET status = _status WHERE id = _order_id;

  IF _status = 'approved' THEN
    PERFORM set_config('app.system_coin_update', 'on', true);
    UPDATE public.profiles
      SET coins = coins + v_order.coins,
          bonus_coins = bonus_coins + v_order.bonus_coins,
          updated_at = now()
      WHERE id = v_order.user_id
      RETURNING coins INTO v_coins;
  END IF;

  UPDATE public.transactions
    SET status = CASE WHEN _status = 'approved' THEN 'success' ELSE 'rejected' END
    WHERE reference_type = 'coin_order' AND reference_id = _order_id;

  RETURN jsonb_build_object('status', _status, 'coins', v_coins);
END; $$;

INSERT INTO public.coin_packs (name, coins, bonus_coins, price, badge, sort_order) VALUES
('Starter Pack', 50, 5, 50, NULL, 1),
('Popular Pack', 100, 10, 100, 'popular', 2),
('Pro Pack', 250, 35, 250, NULL, 3),
('Elite Pack', 500, 100, 500, 'best_value', 4),
('Monarch Pack', 1000, 250, 1000, 'monarch', 5);