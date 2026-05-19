import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, UsersRound, Trophy, ChevronRight, Radio, CheckCircle2, Clock } from "lucide-react";
import { Particles } from "@/components/Particles";
import { BottomNav } from "@/components/BottomNav";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { playSound } from "@/hooks/useSound";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Status = "upcoming" | "live" | "completed" | "cancelled";

type JoinedMatch = {
  id: string;
  title: string;
  category: Category;
  scheduled_at: string;
  status: Status;
  total_slots: number;
  joined_players_count: number;
  prize_pool: number;
  entry_fee: number;
  banner_image_url: string | null;
};

type Tab = "upcoming" | "live" | "completed";

const TABS: { key: Tab; label: string; icon: typeof Clock }[] = [
  { key: "upcoming", label: "Upcoming", icon: Clock },
  { key: "live", label: "Live", icon: Radio },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

const MODE_TAGS: Record<Category, [string, string]> = {
  battle_royale: ["SOLO", "SURVIVAL MODE"],
  free_match: ["SOLO", "FREE ENTRY"],
  classic_squad: ["SQUAD", "SQUAD WAR"],
  lone_wolf: ["DUO", "EXTREME DUEL"],
  custom_rooms: ["DUO", "CUSTOM MODE"],
  weekly_rankings: ["SOLO", "RANKED"],
};

const db = supabase as any;

const Tournaments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<JoinedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("registrations")
        .select("tournament_id, tournaments(id, title, category, scheduled_at, status, total_slots, joined_players_count, prize_pool, entry_fee)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const base: JoinedMatch[] = (data ?? [])
        .map((r: any) => r.tournaments)
        .filter(Boolean)
        .map((t: any) => ({ ...t, banner_image_url: null }));

      if (base.length) {
        const ids = base.map((m) => m.id);
        const { data: banners } = await db
          .from("tournament_banners")
          .select("tournament_id, banner_image_url")
          .in("tournament_id", ids);
        const map = new Map<string, string | null>(
          (banners ?? []).map((b: any) => [b.tournament_id, b.banner_image_url]),
        );
        base.forEach((m) => { m.banner_image_url = map.get(m.id) ?? null; });
      }
      setMatches(base);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!matches.length) return;
    const ids = matches.map((m) => m.id);
    const channel = supabase
      .channel("my-matches-tournaments")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tournaments" },
        (payload: any) => {
          const updated = payload.new as JoinedMatch | undefined;
          if (!updated || !ids.includes(updated.id)) return;
          setMatches((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matches]);

  const filtered = useMemo(
    () => matches.filter((m) => (tab === "live" ? m.status === "live" : m.status === tab)),
    [matches, tab],
  );

  return (
    <div className="relative min-h-screen pb-28 text-foreground" style={{ background: "radial-gradient(120% 80% at 50% 0%, #0a1220 0%, #04060a 55%, #000 100%)" }}>
      <Particles />

      {/* HEADER */}
      <header className="relative mx-auto max-w-md px-5 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { playSound("tick"); navigate(-1); }}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/5 text-primary transition active:scale-95"
            style={{ boxShadow: "0 0 14px hsl(190 95% 55% / 0.25), inset 0 0 12px hsl(190 95% 55% / 0.08)" }}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1
              className="font-display text-[28px] font-black uppercase leading-none tracking-[0.06em] text-foreground"
              style={{ textShadow: "0 0 18px hsl(190 95% 55% / 0.55), 0 0 38px hsl(190 95% 55% / 0.25)" }}
            >
              My <span style={{ color: "hsl(190 95% 60%)" }}>Matches</span>
            </h1>
            <p className="mt-1.5 font-display text-[10.5px] uppercase tracking-[0.32em] text-foreground/45">
              Your Joined Tournaments
            </p>
          </div>
        </div>
        <div
          className="pointer-events-none mt-5 h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, hsl(190 95% 55% / 0.5), transparent)" }}
        />
      </header>

      {/* TABS */}
      <div className="mx-auto mt-5 max-w-md px-5">
        <div
          className="relative grid grid-cols-3 overflow-hidden rounded-2xl border border-primary/25 bg-black/40 p-1 backdrop-blur-xl"
          style={{ boxShadow: "0 0 22px hsl(190 95% 55% / 0.12), inset 0 0 30px hsl(190 95% 55% / 0.04)" }}
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => { playSound("tick"); setTab(t.key); }}
                className="relative z-10 flex h-11 items-center justify-center gap-1.5 rounded-xl font-display text-[11px] font-black uppercase tracking-[0.22em] transition-all duration-300"
                style={{
                  color: active ? "#001018" : "hsl(0 0% 100% / 0.5)",
                  background: active
                    ? "linear-gradient(135deg, hsl(190 95% 60%), hsl(190 100% 75%))"
                    : "transparent",
                  boxShadow: active ? "0 0 22px hsl(190 95% 55% / 0.7), inset 0 0 16px hsl(190 100% 80% / 0.4)" : undefined,
                }}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* LIST */}
      <main className="mx-auto mt-6 max-w-md space-y-4 px-5">
        {loading ? (
          <div className="py-16 text-center font-display text-[11px] uppercase tracking-[0.4em] text-primary/70 animate-pulse">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} onBrowse={() => { playSound("pulse"); navigate("/home"); }} />
        ) : (
          filtered.map((m) => (
            <MatchCard key={m.id} match={m} onClick={() => { playSound("pulse"); navigate(`/tournament/${m.id}`); }} />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

const EmptyState = ({ tab, onBrowse }: { tab: Tab; onBrowse: () => void }) => (
  <div
    className="rounded-2xl border border-primary/25 bg-card/30 p-10 text-center backdrop-blur"
    style={{ boxShadow: "0 0 24px hsl(190 95% 55% / 0.12)" }}
  >
    <p className="font-display text-[12px] uppercase tracking-[0.28em] text-foreground/55">
      No {tab} matches
    </p>
    <p className="mt-1 text-[11px] text-foreground/40">Join a tournament to see it here</p>
    <button
      onClick={onBrowse}
      className="mt-5 rounded-xl border border-primary px-5 py-2.5 font-display text-[11px] font-black uppercase tracking-[0.24em] text-primary transition hover:bg-primary/10"
      style={{ boxShadow: "0 0 16px hsl(190 95% 55% / 0.4)" }}
    >
      Browse Arenas
    </button>
  </div>
);

const STATUS_STYLE: Record<Status, { color: string; label: string }> = {
  upcoming: { color: "hsl(190 95% 60%)", label: "UPCOMING" },
  live: { color: "hsl(142 71% 55%)", label: "● LIVE" },
  completed: { color: "hsl(271 91% 70%)", label: "COMPLETED" },
  cancelled: { color: "hsl(0 84% 60%)", label: "CANCELLED" },
};

const MatchCard = ({ match, onClick }: { match: JoinedMatch; onClick: () => void }) => {
  const meta = CATEGORY_META[match.category];
  const accent = meta.color;
  const status = STATUS_STYLE[match.status];
  const [tag1, tag2] = MODE_TAGS[match.category];
  const date = new Date(match.scheduled_at);
  const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const poster = match.banner_image_url ?? meta.image;
  const totalCells = 14;
  const filledCells = Math.max(1, Math.round((match.joined_players_count / match.total_slots) * totalCells));
  const isFree = match.entry_fee === 0 && match.prize_pool === 0;

  return (
    <button
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-2xl text-left transition active:scale-[0.99]"
      style={{
        border: `1px solid ${accent}66`,
        background: `linear-gradient(135deg, rgba(8,10,14,0.92), rgba(4,6,10,0.96))`,
        boxShadow: `0 0 26px ${accent}33, 0 0 70px ${accent}14, inset 0 0 40px ${accent}0d`,
      }}
    >
      {/* TOP NEON STRIPE */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, boxShadow: `0 0 12px ${accent}` }}
      />
      {/* CORNER GLOW */}
      <span
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl"
        style={{ background: `${accent}33` }}
      />

      <div className="flex gap-3.5 p-3">
        {/* POSTER */}
        <div
          className="relative h-[152px] w-[122px] shrink-0 overflow-hidden rounded-xl"
          style={{
            border: `1px solid ${accent}88`,
            boxShadow: `0 0 16px ${accent}55, inset 0 0 18px ${accent}25`,
          }}
        >
          <img src={poster} alt={match.title} loading="lazy" className="h-full w-full object-cover" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `linear-gradient(180deg, transparent 40%, ${accent}55 100%)` }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)" }}
          />
          {/* corner ticks */}
          <span className="absolute left-1 top-1 h-3 w-3 border-l border-t" style={{ borderColor: accent }} />
          <span className="absolute right-1 top-1 h-3 w-3 border-r border-t" style={{ borderColor: accent }} />
          <span className="absolute left-1 bottom-1 h-3 w-3 border-l border-b" style={{ borderColor: accent }} />
          <span className="absolute right-1 bottom-1 h-3 w-3 border-r border-b" style={{ borderColor: accent }} />
        </div>

        {/* INFO */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className="font-display text-[10px] font-bold uppercase tracking-[0.26em]"
                style={{ color: accent, textShadow: `0 0 10px ${accent}99` }}
              >
                {meta.title}
              </p>
              <h3
                className="mt-1 truncate font-display text-[19px] font-black uppercase italic leading-none tracking-tight text-foreground"
                style={{ textShadow: "0 1px 0 #000, 0 0 18px rgba(255,255,255,0.08)" }}
              >
                {match.title}
              </h3>
            </div>
            <span
              className="shrink-0 rounded-md border px-2 py-1 font-display text-[8.5px] font-black uppercase tracking-[0.22em]"
              style={{
                borderColor: status.color,
                color: status.color,
                background: `${status.color}14`,
                boxShadow: `0 0 10px ${status.color}55`,
              }}
            >
              {status.label}
            </span>
          </div>

          {/* MODE TAGS */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1 font-display text-[8.5px] font-bold uppercase tracking-[0.2em] text-foreground/85">
              {tag1}
            </span>
            <span
              className="rounded-md border px-2 py-1 font-display text-[8.5px] font-bold uppercase tracking-[0.2em]"
              style={{ borderColor: `${accent}77`, color: accent, background: `${accent}14` }}
            >
              {tag2}
            </span>
          </div>

          {/* DIVIDER */}
          <div
            className="my-2.5 h-px"
            style={{ background: `linear-gradient(90deg, ${accent}55, transparent)` }}
          />

          {/* META */}
          <div className="flex flex-col gap-1.5 text-[10.5px] font-semibold text-foreground/70">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3" style={{ color: accent }} />
              <span className="tabular-nums tracking-wide">{dateStr}, {timeStr}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UsersRound className="h-3 w-3" style={{ color: accent }} />
              <span className="tabular-nums">{match.joined_players_count}/{match.total_slots}</span>
              <span className="text-foreground/45 tracking-[0.18em] uppercase text-[9.5px]">Players</span>
            </span>
          </div>

          {/* PROGRESS DASHES */}
          <div className="mt-2.5 flex items-center gap-[3px]">
            {Array.from({ length: totalCells }).map((_, i) => (
              <span
                key={i}
                className="h-[3px] flex-1 rounded-full transition-all"
                style={{
                  background: i < filledCells ? accent : `${accent}22`,
                  boxShadow: i < filledCells ? `0 0 6px ${accent}` : undefined,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER STRIP — prize + chevron */}
      <div
        className="flex items-center justify-between border-t px-4 py-2.5"
        style={{
          borderColor: `${accent}33`,
          background: `linear-gradient(90deg, ${accent}10, transparent 60%, ${accent}10)`,
        }}
      >
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4" style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent})` }} />
          <span className="font-display text-[9.5px] uppercase tracking-[0.26em] text-foreground/55">
            Prize Pool
          </span>
          <span
            className="font-display text-[15px] font-black tabular-nums"
            style={{ color: accent, textShadow: `0 0 10px ${accent}88` }}
          >
            {isFree ? "FREE" : `₹${(match.prize_pool ?? 0).toLocaleString("en-IN")}`}
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1 font-display text-[9.5px] font-black uppercase tracking-[0.26em]"
          style={{ color: accent }}
        >
          View
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
};

export default Tournaments;
