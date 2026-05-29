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
  1: { text: "text-amber-300", accent: "rgba(250,204,21,0.45)", Icon: Trophy },
  2: { text: "text-slate-200", accent: "rgba(203,213,225,0.40)", Icon: Medal },
  3: { text: "text-orange-400", accent: "rgba(251,146,60,0.40)", Icon: Award },
} as const;

const initials = (name: string) =>
  name.split(/\s|_/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";

const Avatar = ({ name, src, size = 44 }: { name: string; src?: string | null; size?: number }) => (
  <div
    className="relative overflow-hidden rounded-full bg-white/[0.04] ring-1 ring-white/10 flex items-center justify-center"
    style={{ width: size, height: size }}
  >
    {src ? (
      <img src={src} alt={name} className="h-full w-full object-cover" />
    ) : (
      <span className="font-display text-[11px] font-bold uppercase tracking-wider text-foreground/70">{initials(name)}</span>
    )}
  </div>
);

const RewardCard = ({ rank, coins }: { rank: 1 | 2 | 3; coins: number }) => {
  const meta = PODIUM[rank];
  const { Icon } = meta;
  return (
    <div className="relative flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-black/40 p-3">
      <div className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-black px-2 py-0.5 text-[9px] font-display font-bold uppercase tracking-[0.2em] text-foreground/80 border border-white/10">
        Rank {rank}
      </div>
      <Icon className={cn("h-6 w-6", meta.text)} style={{ filter: `drop-shadow(0 0 6px ${meta.accent})` }} />
      <div className="text-center">
        <div className={cn("font-display text-lg font-black leading-none", meta.text)}>
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
    <div className="relative min-h-screen pb-28 overflow-hidden bg-[#03060c]">
      {/* Cinematic mountain backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[70vh]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(210 80% 22% / 0.35), transparent 60%), radial-gradient(ellipse at 50% 40%, hsl(199 90% 45% / 0.10), transparent 65%)",
        }}
      />
      <svg
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-[300px] -z-10 w-full"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        style={{ height: 320 }}
      >
        <defs>
          <linearGradient id="lb-mtn-back" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(210 50% 14%)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(220 70% 5%)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="lb-mtn-front" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(215 60% 8%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(220 80% 3%)" stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Far range */}
        <path
          d="M0,200 L0,110 L40,80 L80,98 L120,60 L160,92 L200,55 L240,88 L280,52 L320,84 L360,70 L400,90 L400,200 Z"
          fill="url(#lb-mtn-back)"
        />
        {/* Near range */}
        <path
          d="M0,200 L0,150 L36,128 L72,142 L112,110 L156,138 L196,118 L240,140 L284,122 L324,144 L368,128 L400,140 L400,200 Z"
          fill="url(#lb-mtn-front)"
        />
      </svg>
      {/* Subtle blue ambient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-[380px] -z-10 h-[260px]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(199 100% 55% / 0.10), transparent 65%)",
          filter: "blur(14px)",
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, transparent 40%, hsl(0 0% 0% / 0.7) 100%)",
        }}
      />

      {/* Header */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-md items-start justify-between px-4 pt-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/50 px-2.5 py-1.5 text-foreground/80 backdrop-blur-md transition hover:border-white/25"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.3em]">Back</span>
          </button>
          <div className="relative">
            <Avatar name={myProfile?.player_name ?? "You"} src={myProfile?.avatar_url} size={42} />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
          </div>
        </div>

        <div className="relative mx-auto mt-2 max-w-md px-4 animate-fade-in">
          <HeroLogo size={270} className="!mx-auto" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-md px-4">
        {/* Title */}
        <section className="mt-2 text-center animate-fade-in">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-foreground/55">Hunter Rankings</p>
          <h1
            className="mt-3 font-display text-[34px] font-black uppercase leading-[1.02] tracking-[0.04em] bg-gradient-to-b from-[#eaf6ff] via-[#9cd2ff] to-[#3d8fc4] bg-clip-text text-transparent"
          >
            Weekly<br />Leaderboard
          </h1>
          <p className="mt-3 text-[10.5px] tracking-[0.32em] text-muted-foreground/70">Compete • Rise • Dominate</p>
          <div className="mx-auto mt-3 h-px w-32 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </section>

        {/* Rewards */}
        <section className="mt-6 animate-fade-in" style={{ animationDelay: "60ms" }}>
          <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-3.5 backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2 px-0.5">
              <Gift className="h-3.5 w-3.5 text-foreground/70" />
              <h2 className="font-display text-[10.5px] font-bold uppercase tracking-[0.32em] text-foreground/80">
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
          <div className="flex flex-1 items-center gap-1 rounded-xl border border-white/[0.05] bg-black/40 p-1 backdrop-blur-xl">
            {TABS.map((t) => {
              const active = t === tab;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
                    active ? "text-foreground bg-white/[0.06]" : "text-muted-foreground/70 hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <button className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-black/40 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/85 backdrop-blur-xl transition hover:border-white/20">
            <Globe className="h-3.5 w-3.5 text-foreground/70" />
            All
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
        </section>

        {/* Column header */}
        <div className="mt-5 grid grid-cols-[44px,1fr,auto] items-center gap-3 px-3 text-[9.5px] font-display uppercase tracking-[0.3em] text-muted-foreground/60">
          <span>Rank</span>
          <span>Player</span>
          <span>Kills</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="font-display text-xs uppercase tracking-[0.4em] text-foreground/60 animate-pulse">Loading…</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-2 rounded-xl border border-white/[0.06] bg-black/40 p-8 text-center text-sm text-muted-foreground">
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
                  className="group grid grid-cols-[44px,1fr,auto] items-center gap-3 rounded-xl border border-white/[0.05] bg-black/40 px-3 py-3.5 backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:bg-black/55 animate-fade-in"
                  style={{ animationDelay: `${140 + i * 30}ms` }}
                >
                  {/* Rank */}
                  {podium ? (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.06] bg-black/50">
                      <podium.Icon className={cn("h-5 w-5", podium.text)} style={{ filter: `drop-shadow(0 0 5px ${podium.accent})` }} />
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.05] bg-black/40">
                      <span className="font-display text-base font-bold text-foreground/75">{e.rank_position}</span>
                    </div>
                  )}

                  {/* Player */}
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={e.player_name} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-display text-[14px] font-bold text-foreground">{e.player_name}</span>
                        {podium && <Crown className={cn("h-3 w-3", podium.text)} />}
                      </div>
                      <div className="text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground/70">
                        Hunter {e.rank_label} {isMe && <span className="ml-1 text-foreground/70">• You</span>}
                      </div>
                    </div>
                  </div>

                  {/* Kills */}
                  <div className="text-right">
                    <div className="font-display text-xl font-black leading-none text-foreground">
                      {e.kills}
                    </div>
                    <div className="mt-0.5 text-[9px] uppercase tracking-[0.25em] text-muted-foreground/70">Kills</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Your Rank */}
        {myProfile && (
          <section className="mt-4 animate-fade-in" style={{ animationDelay: "260ms" }}>
            <div className="grid grid-cols-[64px,1fr,auto] items-center gap-3 rounded-xl border border-primary/25 bg-black/55 p-3 backdrop-blur">
              <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.06] bg-black/50 py-1.5">
                <span className="text-[8.5px] uppercase tracking-[0.2em] text-foreground/55">Your Rank</span>
                <span className="font-display text-xl font-black text-foreground">
                  {myEntry ? `#${myEntry.rank_position}` : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={myProfile.player_name} src={myProfile.avatar_url} />
                <div className="min-w-0">
                  <div className="truncate font-display text-[14px] font-bold text-foreground">You</div>
                  <div className="text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground/70">
                    {myEntry ? `Hunter ${myEntry.rank_label}` : "Unranked"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-black text-foreground">
                  {myEntry?.kills ?? 0}
                </div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground/70">Kills</div>
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
