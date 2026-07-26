import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/tournaments";

const db = supabase as any;

export type HomeBanner = {
  id: string;
  image_url: string | null;
  title: string;
  subtitle: string;
  button_text: string | null;
  button_link: string | null;
  sort_order: number;
  active: boolean;
};

export type HomeTournament = {
  id: string;
  title: string;
  subtitle: string | null;
  category: Category;
  entry_fee: number;
  prize_pool: number;
  total_slots: number;
  joined_players_count: number;
  scheduled_at: string;
  banner_url: string | null;
};

export type HomeCategoryCard = {
  category: Category;
  card_image_url: string | null;
  title: string | null;
  subtitle: string | null;
  event_label: string | null;
};

export type HomeOffer = {
  id: string;
  title: string;
  subtitle: string;
  badge_label: string | null;
  image_url: string | null;
  link: string | null;
  sort_order: number;
  active: boolean;
};

export type HomePopup = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  button_text: string | null;
  link: string | null;
  sort_order: number;
  active: boolean;
};

export type HomeContent = {
  banners: HomeBanner[];
  tournaments: HomeTournament[];
  categories: Record<string, HomeCategoryCard>;
  offers: HomeOffer[];
  popups: HomePopup[];
  loading: boolean;
  refresh: () => void;
};

/**
 * Single source of truth for every piece of admin-managed home content.
 * Subscribes to realtime changes so admin edits appear instantly.
 */
export const useHomeContent = (): HomeContent => {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [tournaments, setTournaments] = useState<HomeTournament[]>([]);
  const [categories, setCategories] = useState<Record<string, HomeCategoryCard>>({});
  const [offers, setOffers] = useState<HomeOffer[]>([]);
  const [popups, setPopups] = useState<HomePopup[]>([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const [bannerRes, tourRes, tourBannerRes, catRes, offerRes, popupRes] = await Promise.all([
      db.from("home_banners").select("*").eq("active", true).order("sort_order", { ascending: true }),
      db
        .from("tournaments")
        .select(
          "id,title,subtitle,category,entry_fee,prize_pool,total_slots,joined_players_count,scheduled_at,banner_url"
        )
        .eq("published", true)
        .eq("status", "upcoming")
        .order("scheduled_at", { ascending: true })
        .limit(6),
      db.from("tournament_banners").select("tournament_id,banner_image_url"),
      db.from("category_card_images").select("*"),
      db.from("home_offers").select("*").eq("active", true).order("sort_order", { ascending: true }),
      db.from("home_popups").select("*").eq("active", true).order("sort_order", { ascending: true }),
    ]);

    const bannerMap: Record<string, string | null> = {};
    ((tourBannerRes.data ?? []) as any[]).forEach((r) => {
      bannerMap[r.tournament_id] = r.banner_image_url;
    });

    setBanners((bannerRes.data ?? []) as HomeBanner[]);
    setTournaments(
      ((tourRes.data ?? []) as HomeTournament[]).map((t) => ({
        ...t,
        banner_url: bannerMap[t.id] ?? t.banner_url ?? null,
      }))
    );
    const catMap: Record<string, HomeCategoryCard> = {};
    ((catRes.data ?? []) as HomeCategoryCard[]).forEach((c) => {
      catMap[c.category] = c;
    });
    setCategories(catMap);
    setOffers((offerRes.data ?? []) as HomeOffer[]);
    setPopups((popupRes.data ?? []) as HomePopup[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const debounced = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(load, 250);
    };
    const tables = [
      "home_banners",
      "tournaments",
      "tournament_banners",
      "category_card_images",
      "home_offers",
      "home_popups",
    ];
    let channel = supabase.channel("home-content");
    tables.forEach((table) => {
      channel = channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table },
        debounced
      );
    });
    channel.subscribe();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { banners, tournaments, categories, offers, popups, loading, refresh: load };
};
