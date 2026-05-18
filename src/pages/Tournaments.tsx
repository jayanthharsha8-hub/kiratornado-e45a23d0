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
    <div className="relative min-h-screen pb-24 text-foreground" style={{ background: "#050608" }}>
      <Particles />
      {/* HEADER */}
      <header className="mx-auto max-w-md px-4 pt-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { playSound("tick"); navigate(-1); }}
            className="flex h-10 w-10 items-center justify-center text-primary"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground" style={{ textShadow: "0 0 12px hsl(190 95% 55% / 0.35)" }}>
              My Matches
            </h1>
            <p className="mt-0.5 font-display text-[11px] text-foreground/55">Your Joined Tournaments</p>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className="mx-auto mt-5 max-w-md px-4">
        <div className="relative grid grid-cols-3 overflow-hidden rounded-xl border border-primary/20 bg-card/30 backdrop-blur">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { playSound("tick"); setTab(t.key); }}
                className="relative flex h-11 items-center justify-center font-display text-[12px] font-black uppercase tracking-[0.22em] transition"
                style={{
                  color: active ? "hsl(190 95% 60%)" : "hsl(0 0% 100% / 0.45)",
                  textShadow: active ? "0 0 10px hsl(190 95% 55% / 0.6)" : undefined,
                }}
              >
                {t.label}
                {active && (
                  <span
                    className="absolute bottom-0 left-1/2 h-[2px] w-12 -translate-x-1/2 rounded-full"
                    style={{ background: "hsl(190 95% 55%)", boxShadow: "0 0 10px hsl(190 95% 55%)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* LIST */}
      <main className="mx-auto mt-5 max-w-md space-y-3 px-4">
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
  <div className="rounded-2xl border border-primary/20 bg-card/30 p-8 text-center backdrop-blur">
    <p className="font-display text-[12px] uppercase tracking-[0.28em] text-foreground/55">
      No {tab} matches
    </p>
    <p className="mt-1 text-[11px] text-foreground/40">Join a tournament to see it here</p>
    <button
      onClick={onBrowse}
      className="mt-4 rounded-lg border border-primary px-4 py-2 font-display text-[11px] font-black uppercase tracking-[0.24em] text-primary transition hover:bg-primary/10"
      style={{ boxShadow: "0 0 12px hsl(190 95% 55% / 0.3)" }}
    >
      Browse Arenas
    </button>
  </div>
);

const STATUS_STYLE: Record<Status, { color: string; bg: string; label: string }> = {
  upcoming: { color: "hsl(190 95% 60%)", bg: "hsl(190 95% 55% / 0.1)", label: "UPCOMING" },
  live: { color: "hsl(142 71% 55%)", bg: "hsl(142 71% 45% / 0.15)", label: "LIVE" },
  completed: { color: "hsl(271 91% 70%)", bg: "hsl(271 91% 65% / 0.12)", label: "COMPLETED" },
  cancelled: { color: "hsl(0 84% 60%)", bg: "hsl(0 84% 60% / 0.12)", label: "CANCELLED" },
};

const MatchCard = ({ match, onClick }: { match: JoinedMatch; onClick: () => void }) => {
  const meta = CATEGORY_META[match.category];
  const accent = meta.color;
  const accentSoft = meta.colorSoft;
  const status = STATUS_STYLE[match.status];
  const [tag1, tag2] = MODE_TAGS[match.category];
  const date = new Date(match.scheduled_at);
  const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const poster = match.banner_image_url ?? meta.image;
  const totalCells = Math.min(12, match.total_slots);
  const filledCells = Math.round((match.joined_players_count / match.total_slots) * totalCells);

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl border bg-card/40 text-left backdrop-blur transition active:scale-[0.99]"
      style={{ borderColor: `${accent}55`, boxShadow: `0 0 14px ${accentSoft}, inset 0 0 24px ${accent}08` }}
    >
      <div className="flex gap-3 p-2.5">
        {/* POSTER */}
        <div className="relative h-[124px] w-[110px] shrink-0 overflow-hidden rounded-xl"
          style={{ border: `1px solid ${accent}66`, boxShadow: `0 0 10px ${accentSoft}` }}>
          <img src={poster} alt={match.title} loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 50%, ${accent}40)` }} />
        </div>

        {/* INFO */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: accent }}>
                {meta.title}
              </p>
              <h3 className="mt-0.5 truncate font-display text-[17px] font-black uppercase italic tracking-tight text-foreground"
                style={{ textShadow: "0 1px 0 #000" }}>
                {match.title}
              </h3>
            </div>
            <span
              className="shrink-0 rounded-md border px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-[0.22em]"
              style={{ borderColor: status.color, color: status.color, background: status.bg, boxShadow: `0 0 8px ${status.color}40` }}
            >
              {status.label}
            </span>
          </div>

          {/* MODE TAGS */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded border border-white/15 bg-white/[0.03] px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.18em] text-foreground/85">
              {tag1}
            </span>
            <span className="rounded border px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ borderColor: `${accent}66`, color: accent, background: `${accent}10` }}>
              {tag2}
            </span>
          </div>

          {/* META ROW */}
          <div className="mt-2.5 flex items-center gap-3 text-[10.5px] font-semibold text-foreground/65">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" style={{ color: accent }} />
              <span className="tabular-nums">{dateStr}, {timeStr}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <UsersRound className="h-3 w-3" style={{ color: accent }} />
              <span className="tabular-nums">{match.joined_players_count}/{match.total_slots}</span>
              <span className="text-foreground/45">PLAYERS</span>
            </span>
          </div>

          {/* PROGRESS DASHES */}
          <div className="mt-2 flex items-center gap-[3px]">
            {Array.from({ length: totalCells }).map((_, i) => (
              <span
                key={i}
                className="h-[3px] flex-1 rounded-full"
                style={{
                  background: i < filledCells ? accent : `${accent}25`,
                  boxShadow: i < filledCells ? `0 0 6px ${accent}` : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* PRIZE / CHEVRON */}
        <div className="flex flex-col items-end justify-between py-0.5">
          <ChevronRight className="h-5 w-5 text-foreground/50" />
          <div className="text-right">
            <p className="font-display text-[9px] uppercase tracking-[0.2em] text-foreground/55">Prize Pool</p>
            <p className="mt-0.5 inline-flex items-center gap-1 font-display text-[15px] font-black tabular-nums" style={{ color: accent }}>
              <Trophy className="h-3.5 w-3.5" style={{ color: accent }} />
              <PrizeAmount value={match} />
            </p>
          </div>
        </div>
      </div>
    </button>
  );
};

const PrizeAmount = ({ value }: { value: JoinedMatch }) => {
  if (value.entry_fee === 0 && value.prize_pool === 0) return <span>FREE</span>;
  return <span>₹{(value.prize_pool ?? 0).toLocaleString("en-IN")}</span>;
};

export default Tournaments;
