import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Clock3, Coins, Trophy, UsersRound, X, Swords, Radio, Hexagon, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { Button } from "@/components/ui/button";

type Tab = "upcoming" | "live" | "completed";

interface Tournament {
  id: string;
  title: string;
  subtitle: string | null;
  category: Category;
  entry_fee: number;
  prize_pool: number;
  scheduled_at: string;
  total_slots: number;
  status: string;
}

const TITLES: Record<Category, string> = {
  battle_royale: "BATTLE ROYALE",
  free_match: "FREE MATCH",
  classic_squad: "CLASH SQUAD",
  lone_wolf: "LONE WOLF",
  custom_rooms: "CUSTOM ROOMS",
  weekly_rankings: "WEEKLY RANKINGS",
};

const SUBTITLES: Record<Category, string> = {
  battle_royale: "SOLO - 50 PLAYERS",
  free_match: "SOLO - UNLIMITED",
  classic_squad: "SQUAD - 4V4",
  lone_wolf: "SOLO - 1V1",
  custom_rooms: "PRIVATE - SQUAD UP",
  weekly_rankings: "WEEKLY - TOP REWARDS",
};

const TAGLINES: Record<Category, string> = {
  battle_royale: "FIGHT. SURVIVE. BE THE LAST ONE.",
  free_match: "PLAY FREE. WIN BIG.",
  classic_squad: "SQUAD UP. FIGHT TOGETHER. WIN TOGETHER.",
  lone_wolf: "ONE MAN. ONE MISSION.",
  custom_rooms: "YOUR ROOM. YOUR RULES.",
  weekly_rankings: "CLIMB. CONQUER. CLAIM REWARDS.",
};

const CardIcon = ({ category, color }: { category: Category; color: string }) => {
  const style = { color, filter: `drop-shadow(0 0 6px ${color})` };
  switch (category) {
    case "battle_royale":
      return <Shield className="h-10 w-10" style={style} />;
    case "free_match":
      return <Hexagon className="h-10 w-10" style={style} />;
    case "classic_squad":
      return <Swords className="h-10 w-10" style={style} />;
    case "lone_wolf":
      return <Swords className="h-10 w-10" style={style} />;
    case "custom_rooms":
      return <Hexagon className="h-10 w-10" style={style} />;
    case "weekly_rankings":
      return <Trophy className="h-10 w-10" style={style} />;
  }
};

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cat = (category as Category) ?? "battle_royale";
  const meta = CATEGORY_META[cat];

  const [tab, setTab] = useState<Tab>("upcoming");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pageBannerUrl, setPageBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!meta) return;
    setLoading(true);
    (async () => {
      const [{ data }, { data: pageBanner }] = await Promise.all([
        supabase
          .from("tournaments")
          .select("id,title,subtitle,category,entry_fee,prize_pool,scheduled_at,total_slots,status")
          .eq("category", cat)
          .eq("status", tab)
          .eq("published", true)
          .order("scheduled_at", { ascending: tab !== "completed" }),
        (supabase as any)
          .from("tournament_page_banners")
          .select("banner_image_url")
          .eq("category", cat)
          .maybeSingle(),
      ]);
      const rows = (data ?? []) as Tournament[];
      setTournaments(rows);
      setPageBannerUrl(pageBanner?.banner_image_url ?? null);
      const nextCounts: Record<string, number> = {};
      await Promise.all(
        rows.map(async (t) => {
          const { count } = await supabase
            .from("registrations")
            .select("id", { count: "exact", head: true })
            .eq("tournament_id", t.id);
          nextCounts[t.id] = count ?? 0;
        }),
      );
      setCounts(nextCounts);
      if (user && rows.length) {
        const { data: regs } = await supabase
          .from("registrations")
          .select("tournament_id")
          .eq("user_id", user.id)
          .in("tournament_id", rows.map((r) => r.id));
        setJoinedIds(new Set((regs ?? []).map((r: any) => r.tournament_id)));
      } else {
        setJoinedIds(new Set());
      }
      setLoading(false);
    })();
  }, [cat, tab, meta, user]);

  if (!meta) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xs uppercase tracking-[0.4em] text-primary">
        Invalid category
      </div>
    );
  }

  const color = meta.color;
  const colorSoft = meta.colorSoft;

  return (
    <div className="min-h-screen bg-background px-3 pb-8 pt-4 text-foreground">
      <main className="mx-auto max-w-md space-y-4">
        {/* TOP BANNER */}
        <section
          className="relative overflow-hidden rounded-2xl"
          style={{ border: `2px solid ${color}`, boxShadow: `0 0 18px ${colorSoft}` }}
        >
          <div className="relative aspect-[16/7] w-full">
            {pageBannerUrl ? (
              <img src={pageBannerUrl} alt={`${meta.title} banner`} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-background via-card to-background" />
            )}

            <button
              aria-label="Close"
              onClick={() => navigate("/home")}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border bg-background/40 text-foreground backdrop-blur-md transition active:scale-95"
              style={{ borderColor: color, boxShadow: `0 0 10px ${colorSoft}` }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* TABS */}
        <section
          className="grid grid-cols-3 overflow-hidden rounded-full border bg-card/40 p-1"
          style={{ borderColor: `${color}55` }}
        >
          {(["upcoming", "live", "completed"] as Tab[]).map((item) => {
            const active = tab === item;
            return (
              <button
                key={item}
                onClick={() => setTab(item)}
                className="relative flex h-10 items-center justify-center gap-2 rounded-full font-display text-[12px] font-bold uppercase tracking-[0.16em] transition active:scale-[0.98]"
                style={{
                  color: active ? color : "hsl(0 0% 100% / 0.55)",
                  background: active ? colorSoft : "transparent",
                  boxShadow: active ? `inset 0 -2px 0 ${color}, 0 0 12px ${colorSoft}` : undefined,
                }}
              >
                {item === "upcoming" && <CalendarDays className="h-4 w-4" />}
                {item === "live" && <Radio className="h-4 w-4" />}
                {item === "completed" && <Trophy className="h-4 w-4" />}
                {item === "live" ? "Ongoing" : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            );
          })}
        </section>

        {/* LIST */}
        <section className="space-y-3">
          {loading ? (
            <div className="py-12 text-center font-display text-xs uppercase tracking-[0.35em]" style={{ color }}>
              Loading
            </div>
          ) : tournaments.length === 0 ? (
            <div
              className="rounded-xl border py-10 text-center font-display text-xs uppercase tracking-[0.25em] text-foreground/55"
              style={{ borderColor: color }}
            >
              No {tab === "live" ? "Ongoing" : tab} matches
            </div>
          ) : (
            tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} count={counts[t.id] ?? 0} color={color} colorSoft={colorSoft} joined={joinedIds.has(t.id)} />
            ))
          )}
        </section>

        <div className="flex items-center justify-center gap-3 py-5 font-display text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/30">
          <span className="h-px w-16 bg-foreground/15" />
          <span>▸▸ Lock Join And Win Exciting Rewards ◂◂</span>
          <span className="h-px w-16 bg-foreground/15" />
        </div>
      </main>
    </div>
  );
};

const TournamentCard = ({
  tournament: t,
  count,
  color,
  colorSoft,
  joined,
}: {
  tournament: Tournament;
  count: number;
  color: string;
  colorSoft: string;
  joined: boolean;
}) => {
  const navigate = useNavigate();
  const date = new Date(t.scheduled_at);
  const dateText = date
    .toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
  const timeText = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <article
      className="relative flex overflow-hidden rounded-2xl border bg-card/60 p-2 backdrop-blur transition active:scale-[0.99]"
      style={{ borderColor: color, boxShadow: `0 0 14px ${colorSoft}` }}
    >
      {/* LEFT icon */}
      <div
        className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-xl border bg-background/60"
        style={{ borderColor: color, boxShadow: `inset 0 0 12px ${colorSoft}` }}
      >
        <CardIcon category={t.category} color={color} />
      </div>

      {/* CENTER */}
      <div className="min-w-0 flex-1 px-3 py-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-black uppercase leading-tight text-foreground">
              {t.title || TITLES[t.category]}
            </h2>
            <p className="mt-0.5 font-display text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
              {t.subtitle && t.subtitle.trim() ? t.subtitle : SUBTITLES[t.category]}
            </p>
          </div>
          <div
            className="flex shrink-0 items-center gap-1 text-xs font-bold"
            style={{ color }}
          >
            <UsersRound className="h-3.5 w-3.5" /> {count}/{t.total_slots}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold text-foreground/65">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" style={{ color }} /> {dateText}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" style={{ color }} /> {timeText}
          </span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-foreground/55">Entry Fee</p>
              <p className="font-display text-xs font-black text-foreground">
                {t.entry_fee === 0 ? "FREE" : (
                  <><Coins className="mr-0.5 inline h-3 w-3 text-yellow-400" />₹{t.entry_fee}</>
                )}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-foreground/55">Prize Pool</p>
              <p className="font-display text-xs font-black" style={{ color }}>
                <Trophy className="mr-0.5 inline h-3 w-3 text-yellow-400" />₹{t.prize_pool}
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              navigate(joined ? `/tournament/${t.id}` : `/tournament-slots/${t.id}`)
            }
            className="h-9 rounded-full border px-4 font-display text-[11px] font-black uppercase tracking-wider animate-pulse-glow"
            style={
              joined
                ? {
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    borderColor: color,
                    color: "#0A0A0A",
                    boxShadow: `0 0 16px ${color}`,
                  }
                : { borderColor: color, color, background: "transparent", boxShadow: `0 0 14px ${colorSoft}` }
            }
          >
            {joined ? "✓ Joined" : "Join Now ›"}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default CategoryPage;
