CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id text NOT NULL DEFAULT 'kiratornado@ptyes',
  qr_image_url text,
  manual_entry_enabled boolean NOT NULL DEFAULT true,
  min_deposit_coins integer NOT NULL DEFAULT 10,
  coin_rate numeric NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store settings are viewable by everyone" ON public.store_settings;
CREATE POLICY "Store settings are viewable by everyone"
ON public.store_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage store settings" ON public.store_settings;
CREATE POLICY "Admins manage store settings"
ON public.store_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;

INSERT INTO public.store_settings (upi_id)
SELECT 'kiratornado@ptyes'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

CREATE OR REPLACE FUNCTION public.create_coin_order(
  _pack_id uuid DEFAULT NULL::uuid,
  _offer_id uuid DEFAULT NULL::uuid,
  _upi_ref text DEFAULT NULL::text,
  _manual_coins integer DEFAULT NULL::integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_name text; v_coins integer; v_bonus integer; v_price integer; v_id uuid;
  v_expires timestamptz;
  v_settings public.store_settings%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;

  SELECT * INTO v_settings FROM public.store_settings LIMIT 1;

  IF _manual_coins IS NOT NULL THEN
    IF _pack_id IS NOT NULL OR _offer_id IS NOT NULL THEN RAISE EXCEPTION 'Select one item'; END IF;
    IF v_settings.id IS NOT NULL AND NOT v_settings.manual_entry_enabled THEN
      RAISE EXCEPTION 'Manual coin entry is currently disabled';
    END IF;
    IF _manual_coins < COALESCE(v_settings.min_deposit_coins, 10) THEN
      RAISE EXCEPTION 'Minimum deposit is % coins', COALESCE(v_settings.min_deposit_coins, 10);
    END IF;
    v_name := 'Manual Top-Up';
    v_coins := _manual_coins;
    v_bonus := 0;
    v_price := ceil(_manual_coins * COALESCE(v_settings.coin_rate, 1))::integer;
  ELSIF _pack_id IS NOT NULL AND _offer_id IS NULL THEN
    SELECT name, coins, bonus_coins, price INTO v_name, v_coins, v_bonus, v_price
    FROM public.coin_packs WHERE id = _pack_id AND active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pack unavailable'; END IF;
  ELSIF _offer_id IS NOT NULL AND _pack_id IS NULL THEN
    SELECT title, coins, bonus_coins, price, expires_at INTO v_name, v_coins, v_bonus, v_price, v_expires
    FROM public.coin_offers WHERE id = _offer_id AND active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Offer unavailable'; END IF;
    IF v_expires IS NOT NULL AND v_expires < now() THEN RAISE EXCEPTION 'Offer expired'; END IF;
  ELSE
    RAISE EXCEPTION 'Select one item';
  END IF;

  INSERT INTO public.coin_orders (user_id, pack_id, offer_id, item_name, coins, bonus_coins, price, upi_ref)
  VALUES (v_user, _pack_id, _offer_id, v_name, v_coins, v_bonus, v_price, nullif(trim(_upi_ref), ''))
  RETURNING id INTO v_id;

  INSERT INTO public.transactions (user_id, type, amount, message, status, reference_type, reference_id)
  VALUES (v_user, 'credit', v_coins + v_bonus, 'Coin Store: ' || v_name, 'pending', 'coin_order', v_id);

  RETURN jsonb_build_object('order_id', v_id, 'coins', v_coins, 'bonus_coins', v_bonus, 'total', v_coins + v_bonus, 'price', v_price);
END; $function$;