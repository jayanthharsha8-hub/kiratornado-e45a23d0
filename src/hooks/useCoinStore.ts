import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

export interface CoinPack {
  id: string;
  name: string;
  coins: number;
  bonus_coins: number;
  price: number;
  banner_url: string | null;
  badge: string | null;
  description: string | null;
  pack_type: string;
  sort_order: number;
  active: boolean;
}

export interface CoinOffer {
  id: string;
  title: string;
  subtitle: string | null;
  coins: number;
  bonus_coins: number;
  price: number;
  banner_url: string | null;
  offer_type: string;
  expires_at: string | null;
  sort_order: number;
  active: boolean;
}

export interface StoreSettings {
  id: string;
  upi_id: string;
  qr_image_url: string | null;
  manual_entry_enabled: boolean;
  min_deposit_coins: number;
  coin_rate: number;
}

export interface WalletSnapshot {
  coins: number;
  bonus_coins: number;
  br_tokens: number;
  coupons: { id: string; discount_percent: number }[];
}

/** Loads the fully dynamic Coin Store catalog (packs + limited offers) with realtime updates. */
export const useCoinStore = () => {
  const { user } = useAuth();
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [offers, setOffers] = useState<CoinOffer[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [wallet, setWallet] = useState<WalletSnapshot>({ coins: 0, bonus_coins: 0, br_tokens: 0, coupons: [] });
  const [loading, setLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    const [{ data: p }, { data: o }, { data: s }] = await Promise.all([
      db.from("coin_packs").select("*").eq("active", true).order("sort_order", { ascending: true }),
      db.from("coin_offers").select("*").eq("active", true).order("sort_order", { ascending: true }),
      db.from("store_settings").select("*").limit(1).maybeSingle(),
    ]);
    setPacks((p as CoinPack[]) ?? []);
    setOffers(((o as CoinOffer[]) ?? []).filter((x) => !x.expires_at || new Date(x.expires_at).getTime() > Date.now()));
    setSettings((s as StoreSettings) ?? null);
    setLoading(false);
  }, []);

  const loadWallet = useCallback(async () => {
    if (!user) return;
    const [{ data: prof }, { data: coupons }] = await Promise.all([
      db.from("profiles").select("coins,bonus_coins,br_tokens").eq("id", user.id).maybeSingle(),
      db.from("user_coupons").select("id,discount_percent").eq("user_id", user.id).is("used_at", null),
    ]);
    setWallet({
      coins: prof?.coins ?? 0,
      bonus_coins: prof?.bonus_coins ?? 0,
      br_tokens: prof?.br_tokens ?? 0,
      coupons: coupons ?? [],
    });
  }, [user]);

  useEffect(() => {
    loadCatalog();
    const channel = supabase
      .channel("coin-store-catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "coin_packs" }, () => loadCatalog())
      .on("postgres_changes", { event: "*", schema: "public", table: "coin_offers" }, () => loadCatalog())
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, () => loadCatalog())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadCatalog]);

  useEffect(() => {
    if (!user) return;
    loadWallet();
    const channel = supabase
      .channel(`coin-store-wallet-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, () => loadWallet())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_coupons", filter: `user_id=eq.${user.id}` }, () => loadWallet())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadWallet]);

  const purchase = useCallback(
    async (args: { packId?: string; offerId?: string; manualCoins?: number; upiRef?: string }) => {
      const { data, error } = await db.rpc("create_coin_order", {
        _pack_id: args.packId ?? null,
        _offer_id: args.offerId ?? null,
        _upi_ref: args.upiRef ?? null,
        _manual_coins: args.manualCoins ?? null,
      });
      if (error) throw error;
      await loadWallet();
      return data as { order_id: string; coins: number; bonus_coins: number; total: number; price: number };
    },
    [loadWallet]
  );

  return { packs, offers, settings, wallet, loading, purchase, refreshWallet: loadWallet };
};

/** Formats remaining ms as HH:MM:SS. */
export const formatCountdown = (ms: number) => {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};
