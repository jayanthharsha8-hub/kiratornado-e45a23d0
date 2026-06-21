import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { SystemPanel } from "@/components/SystemPanel";
import { SideMenu } from "@/components/SideMenu";

import { BottomNav } from "@/components/BottomNav";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Menu, Trophy, ChevronRight } from "lucide-react";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

type HomeBanner = { id: string; image_url: string | null; title: string; subtitle: string; button_text: string | null; updated_at?: string };
type CategoryCardImage = { category: Category; card_image_url: string | null; updated_at?: string };

const withVersion = (url: string | null | undefined, version?: string | null) => {
  if (!url) return null;
  const v = version ? new Date(version).getTime() : Date.now();
  return url.includes("?") ? `${url}&v=${v}` : `${url}?v=${v}`;
};

const db = supabase as any;

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  
  const [playerName, setPlayerName] = useState("Hunter");
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [homeBanners, setHomeBanners] = useState<HomeBanner[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<Category, string | null>>({ free_match: null, battle_royale: null, classic_squad: null, lone_wolf: null, custom_rooms: null, weekly_rankings: null });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins,player_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) { setCoins(data.coins); setPlayerName(data.player_name); } });
  }, [user]);

  useEffect(() => {
    Promise.all([
      db.from("home_banners").select("id,image_url,title,subtitle,button_text,updated_at").eq("active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
      db.from("category_card_images").select("category,card_image_url,updated_at"),
    ]).then(([home, cards]) => {
      const banners = ((home.data ?? []) as HomeBanner[]).map((b) => ({ ...b, image_url: withVersion(b.image_url, b.updated_at) }));
      setHomeBanners(banners);
      const next = { free_match: null, battle_royale: null, classic_squad: null, lone_wolf: null, custom_rooms: null, weekly_rankings: null } as Record<Category, string | null>;
      ((cards.data ?? []) as CategoryCardImage[]).forEach((row) => { next[row.category] = withVersion(row.card_image_url, row.updated_at); });
      setCategoryImages(next);
    });
  }, []);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
    const t = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(t);
  }, [api]);

  const sliderItems = homeBanners.length > 0 ? homeBanners : [{ id: "empty", image_url: null, title: "No Banner", subtitle: "", button_text: null }];

  const openTournamentPage = (category: Category) => {
    playSound("pulse");
    navigate(`/category/${category}`);
  };

  return (
    <div className="relative min-h-screen pb-20 scanline">
      <Particles />

      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-3 py-2">
          <SideMenu>
            <button aria-label="Open menu" className="flex items-center gap-2" onClick={() => playSound("tick")}>
              <Logo size={32} withText />
              <Menu className="h-4 w-4 text-primary" />
            </button>
          </SideMenu>
          <button
            onClick={() => { playSound("tick"); navigate("/wallet"); }}
            className="flex items-center gap-1.5 rounded-sm border border-primary/50 bg-card/60 px-2 py-1 text-primary transition hover:border-primary hover:glow-soft"
          >
            <Wallet className="h-4 w-4" />
            <span className="font-display text-xs font-bold text-glow-soft">{coins}</span>
            <span className="text-[10px]">coins</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3 px-3 pt-3">
        {/* Banner Carousel */}
        <section className="relative w-full animate-float-up">
          <div className="relative overflow-hidden rounded-sm border border-primary/60">
            <Carousel setApi={setApi} opts={{ loop: true }}>
              <CarouselContent>
                {sliderItems.map((banner, i) => (
                  <CarouselItem key={banner.id}>
                    <div className="relative h-[8.25rem] w-full sm:h-[9.25rem]">
                       {banner.image_url ? (
                         <img src={banner.image_url} alt={banner.title || "Home banner"} width={1280} height={480} className="h-full w-full object-cover" />
                       ) : (
                         <div className="h-full w-full bg-card" />
                       )}
                       <div className="absolute inset-y-0 left-0 hidden w-2/3 flex-col justify-center p-3">
                        {banner.button_text && <span className="mt-2 w-fit rounded-sm border border-primary/50 bg-primary/10 px-2 py-1 text-[9px] uppercase tracking-widest text-primary">{banner.button_text}</span>}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
          {/* Slider dots */}
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {sliderItems.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => { playSound("tick"); api?.scrollTo(i); }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: current === i ? 22 : 8,
                  background: current === i ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)",
                  boxShadow: current === i ? "0 0 8px hsl(var(--primary))" : "none",
                }}
              />
            ))}
          </div>
        </section>

        {/* Tournament image cards */}
         <SystemPanel title="Tournaments">
           <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CATEGORY_META) as Category[]).map((c, idx) => {
              const meta = CATEGORY_META[c];
              const imgUrl = categoryImages[c];
              return (
                <button
                  key={c}
                  onClick={() => openTournamentPage(c)}
                  className="group relative aspect-square overflow-hidden rounded-sm border bg-card text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] animate-float-up"
                  style={{
                    borderColor: meta.color,
                    boxShadow: `0 0 8px ${meta.colorSoft}`,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={meta.title}
                      loading="lazy"
                      decoding="async"
                      width={512}
                      height={512}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center px-2 text-center font-display text-xs uppercase tracking-[0.2em]"
                      style={{ color: meta.color }}
                    >
                      {meta.title}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </SystemPanel>

      </main>

      <BottomNav />
    </div>
  );
};

const InfoPill = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex min-w-0 items-center justify-center gap-1 rounded-sm border border-foreground/10 bg-background/45 px-1.5 py-1.5">
    <span className="shrink-0 text-foreground/60">{icon}</span>
    <span className="truncate font-semibold">{label}</span>
  </div>
);

export default Home;
