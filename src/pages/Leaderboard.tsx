import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Crown, Gift, Globe, ChevronDown, Trophy, Medal, Award } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { HeroLogo } from "@/components/HeroLogo";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  id: string;
  player_name: string;
  kills: number;
  rank_label: string;
  rank_position: number;
}

interface Reward {
  rank_position: number;
  coins: number;
}

const TABS = ["WEEKLY", "SEASON", "ALL TIME"] as const;
type Tab = typeof TABS[number];

const PODIUM = {
  1: {
    ring: "from-amber-300 via-yellow-400 to-amber-600",
    glow: "rgba(250,204,21,0.55)",
    text: "text-amber-300",
    chip: "bg-amber-400/10 border-amber-400/50",
    Icon: Trophy,
  },
  2: {
    ring: "from-slate-200 via-slate-400 to-slate-600",
    glow: "rgba(203,213,225,0.45)",
    text: "text-slate-200",
    chip: "bg-slate-300/10 border-slate-300/40",
    Icon: Medal,
  },
  3: {
    ring: "from-orange-300 via-orange-500 to-amber-800",
    glow: "rgba(251,146,60,0.45)",
    text: "text-orange-400",
    chip: "bg-orange-500/10 border-orange-500/40",
    Icon: Award,
  },
} as const;

const initials = (name: string) =>
  name.split(/\s|_/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";

const Avatar = ({ name, src, size = 44, ring }: { name: string; src?: string | null; size?: number; ring?: string }) => (
  <div
    className={cn("relative rounded-full p-[2px] bg-gradient-to-br", ring ?? "from-primary/60 to-primary/20")}
    style={{ width: size, height: size }}
  >
    <div className="h-full w-full overflow-hidden rounded-full bg-card/80 ring-1 ring-background flex items-center justify-center">
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display text-[11px] font-bold uppercase tracking-wider text-primary/90">{initials(name)}</span>
      )}
    </div>
  </div>
);

const RewardCard = ({ rank, coins }: { rank: 1 | 2 | 3; coins: number }) => {
  const meta = PODIUM[rank];
  const { Icon } = meta;
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-xl border bg-gradient-to-b from-card/80 to-black/60 p-3",
        meta.chip
      )}
      style={{ boxShadow: `inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 0 22px ${meta.glow}` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-display font-bold uppercase tracking-[0.2em] border bg-black/80"
        style={{ borderColor: meta.glow, color: "white", boxShadow: `0 0 12px ${meta.glow}` }}
      >
        Rank {rank}
      </div>
      <Icon className={cn("h-7 w-7", meta.text)} style={{ filter: `drop-shadow(0 0 8px ${meta.glow})` }} />
      <div className="text-center">
        <div className={cn("font-display text-lg font-black leading-none", meta.text)} style={{ textShadow: `0 0 10px ${meta.glow}` }}>
          {coins.toLocaleString()}
        </div>
        <div className="mt-0.5 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Coins</div>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("WEEKLY");
  const [myProfile, setMyProfile] = useState<{ player_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: lb }, { data: rw }] = await Promise.all([
        supabase.from("leaderboard_entries").select("*").order("rank_position", { ascending: true }).limit(20),
        supabase.from("leaderboard_rewards").select("rank_position, coins").order("rank_position", { ascending: true }),
      ]);
      setEntries((lb as LeaderboardEntry[]) ?? []);
      setRewards((rw as Reward[]) ?? []);
      if (user) {
        const { data: p } = await supabase.from("profiles").select("player_name, avatar_url").eq("id", user.id).maybeSingle();
        setMyProfile(p as any);
      }
      setLoading(false);
    })();
  }, [user]);

  const rewardFor = (r: 1 | 2 | 3) => rewards.find((x) => x.rank_position === r)?.coins ?? 0;
  const myEntry = useMemo(
    () => entries.find((e) => myProfile && e.player_name.toLowerCase() === myProfile.player_name.toLowerCase()),
    [entries, myProfile]
  );

  return (
    <div className="relative min-h-screen pb-28 overflow-hidden bg-[#02050b]">
      {/* Cinematic backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[560px]"
        style={{ background: "radial-gradient(ellipse at 50% -10%, hsl(199 100% 55% / 0.28), transparent 60%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[60vh]"
        style={{
          background:
            "linear-gradient(to top, hsl(220 60% 6% / 0.9), transparent), radial-gradient(ellipse at 50% 100%, hsl(210 80% 28% / 0.22), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.04] mix-blend-screen"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 78%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 18% 28%, hsl(199 100% 75% / 0.7), transparent 60%), radial-gradient(1px 1px at 72% 62%, hsl(199 100% 75% / 0.55), transparent 60%), radial-gradient(1px 1px at 42% 82%, hsl(199 100% 75% / 0.5), transparent 60%), radial-gradient(1px 1px at 88% 18%, hsl(199 100% 75% / 0.6), transparent 60%), radial-gradient(1px 1px at 10% 70%, hsl(199 100% 75% / 0.5), transparent 60%)",
        }}
      />

      {/* Header */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-md items-start justify-between px-4 pt-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-md border border-primary/25 bg-black/50 px-2.5 py-1.5 text-primary/90 backdrop-blur-md transition hover:border-primary/60 hover:bg-primary/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.3em]">Back</span>
          </button>
          <div className="relative">
            <Avatar name={myProfile?.player_name ?? "You"} src={myProfile?.avatar_url} size={42} />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" style={{ boxShadow: "0 0 8px rgb(52 211 153 / 0.9)" }} />
          </div>
        </div>

        <div className="relative mx-auto mt-3 max-w-md px-4 animate-fade-in">
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -z-10 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(199 100% 55% / 0.32), transparent 65%)", filter: "blur(10px)" }}
          />
          <HeroLogo size={200} className="!mx-auto drop-shadow-[0_0_24px_hsl(199_100%_55%_/_0.45)]" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-md px-4">
        {/* Title */}
        <section className="mt-4 text-center animate-fade-in">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-primary/70">Hunter Rankings</p>
          <h1
            className="mt-3 font-display text-[36px] font-black uppercase leading-[1.02] tracking-[0.05em] bg-gradient-to-b from-[#dff3ff] via-[#5cc6ff] to-[#1f7fc9] bg-clip-text text-transparent"
            style={{ filter: "drop-shadow(0 0 18px hsl(199 100% 55% / 0.4))" }}
          >
            Weekly<br />Leaderboard
          </h1>
          <p className="mt-3 text-[11px] tracking-[0.32em] text-muted-foreground/80">Compete • Rise • Dominate</p>
          <div className="mx-auto mt-3 h-px w-44 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </section>

        {/* Rewards */}
        <section className="mt-6 animate-fade-in" style={{ animationDelay: "60ms" }}>
          <div
            className="rounded-2xl border border-primary/20 bg-gradient-to-b from-white/[0.03] to-black/40 p-3.5 backdrop-blur-xl"
            style={{ boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 8px 40px hsl(199 100% 55% / 0.08)" }}
          >
            <div className="mb-3 flex items-center gap-2 px-0.5">
              <Gift className="h-3.5 w-3.5 text-primary" />
              <h2 className="font-display text-[10.5px] font-bold uppercase tracking-[0.32em] text-foreground/90">
                Weekly Leaderboard Rewards
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <RewardCard rank={1} coins={rewardFor(1)} />
              <RewardCard rank={2} coins={rewardFor(2)} />
              <RewardCard rank={3} coins={rewardFor(3)} />
            </div>
          </div>
        </section>

        {/* Tabs + Region */}
        <section className="mt-6 flex items-center gap-2 animate-fade-in" style={{ animationDelay: "120ms" }}>
          <div className="flex flex-1 items-center gap-1 rounded-xl border border-primary/15 bg-white/[0.02] p-1 backdrop-blur-xl">
            {TABS.map((t) => {
              const active = t === tab;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
                    active ? "text-primary" : "text-muted-foreground/70 hover:text-foreground"
                  )}
                  style={
                    active
                      ? {
                          background: "linear-gradient(180deg, hsl(199 100% 55% / 0.16), hsl(199 100% 55% / 0.04))",
                          boxShadow: "inset 0 0 0 1px hsl(199 100% 55% / 0.45), 0 0 18px hsl(199 100% 55% / 0.22)",
                          textShadow: "0 0 10px hsl(199 100% 70% / 0.65)",
                        }
                      : undefined
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
          <button className="flex items-center gap-1.5 rounded-xl border border-primary/15 bg-white/[0.02] px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/85 backdrop-blur-xl transition hover:border-primary/40">
            <Globe className="h-3.5 w-3.5 text-primary" />
            All
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
        </section>

        {/* Column header */}
        <div className="mt-4 grid grid-cols-[44px,1fr,auto] items-center gap-3 px-3 text-[9.5px] font-display uppercase tracking-[0.3em] text-muted-foreground/70">
          <span>Rank</span>
          <span>Player</span>
          <span>Kills</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="font-display text-xs uppercase tracking-[0.4em] text-primary animate-pulse">Loading…</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-2 rounded-xl border border-primary/20 bg-black/40 p-8 text-center text-sm text-muted-foreground">
            No rankings this week. Check back soon, Hunter.
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {entries.map((e, i) => {
              const podium = (e.rank_position === 1 || e.rank_position === 2 || e.rank_position === 3)
                ? PODIUM[e.rank_position as 1 | 2 | 3]
                : null;
              const isMe = myProfile && e.player_name.toLowerCase() === myProfile.player_name.toLowerCase();
              return (
                <li
                  key={e.id}
                  className="group grid grid-cols-[44px,1fr,auto] items-center gap-3 rounded-xl border bg-gradient-to-r from-white/[0.025] via-white/[0.015] to-transparent p-2.5 backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:border-primary/40 animate-fade-in"
                  style={{
                    animationDelay: `${140 + i * 35}ms`,
                    borderColor: podium ? `${podium.glow}` : "hsl(199 100% 55% / 0.12)",
                    boxShadow: podium
                      ? `0 0 16px ${podium.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`
                      : "inset 0 1px 0 rgba(255,255,255,0.025)",
                  }}
                >
                  {/* Rank badge */}
                  {podium ? (
                    <div
                      className={cn(
                        "relative flex h-11 w-11 items-center justify-center rounded-lg border bg-black/60",
                        podium.chip
                      )}
                      style={{ boxShadow: `inset 0 0 10px ${podium.glow}` }}
                    >
                      <podium.Icon className={cn("absolute h-9 w-9 opacity-25", podium.text)} />
                      <span className={cn("relative font-display text-base font-black", podium.text)} style={{ textShadow: `0 0 8px ${podium.glow}` }}>
                        {e.rank_position}
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/15 bg-black/40">
                      <span className="font-display text-base font-bold text-foreground/80">{e.rank_position}</span>
                    </div>
                  )}

                  {/* Player */}
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar
                      name={e.player_name}
                      ring={podium ? `from-amber-300 via-yellow-400 to-amber-600` : undefined}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-display text-[14px] font-bold text-foreground">{e.player_name}</span>
                        {podium && <Crown className={cn("h-3 w-3", podium.text)} />}
                      </div>
                      <div className="text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
                        Hunter {e.rank_label} {isMe && <span className="ml-1 text-primary/80">• You</span>}
                      </div>
                    </div>
                  </div>

                  {/* Kills */}
                  <div className="text-right">
                    <div
                      className="font-display text-xl font-black leading-none text-primary"
                      style={{ textShadow: "0 0 12px hsl(199 100% 55% / 0.55)" }}
                    >
                      {e.kills}
                    </div>
                    <div className="mt-0.5 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Kills</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Your Rank */}
        {myProfile && (
          <section className="mt-4 animate-fade-in" style={{ animationDelay: "260ms" }}>
            <div
              className="grid grid-cols-[64px,1fr,auto] items-center gap-3 rounded-xl border border-primary/60 bg-gradient-to-r from-primary/10 via-black/50 to-primary/5 p-3 backdrop-blur"
              style={{ boxShadow: "0 0 28px hsl(199 100% 55% / 0.35), inset 0 1px 0 rgba(255,255,255,0.06)" }}
            >
              <div className="flex flex-col items-center justify-center rounded-lg border border-primary/40 bg-black/60 py-1.5">
                <span className="text-[8.5px] uppercase tracking-[0.2em] text-primary">Your Rank</span>
                <span className="font-display text-xl font-black text-primary" style={{ textShadow: "0 0 10px hsl(199 100% 55% / 0.7)" }}>
                  {myEntry ? `#${myEntry.rank_position}` : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={myProfile.player_name} src={myProfile.avatar_url} />
                <div className="min-w-0">
                  <div className="truncate font-display text-[14px] font-bold text-foreground">You</div>
                  <div className="text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
                    {myEntry ? `Hunter ${myEntry.rank_label}` : "Unranked"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-black text-primary" style={{ textShadow: "0 0 12px hsl(199 100% 55% / 0.55)" }}>
                  {myEntry?.kills ?? 0}
                </div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Kills</div>
              </div>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
