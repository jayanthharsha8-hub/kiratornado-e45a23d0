import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Crown, Gift, Globe, ChevronDown, Trophy, Medal, Award } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import zeoxLeaderboardLogo from "@/assets/zeox-leaderboard.png";
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
    text: "text-amber-300",
    accent: "rgba(250,204,21,0.55)",
    ring: "ring-amber-300/40",
    glow: "0 0 18px rgba(250,204,21,0.35), inset 0 0 20px rgba(250,204,21,0.08)",
    Icon: Trophy,
    label: "Gold",
  },
  2: {
    text: "text-slate-200",
    accent: "rgba(203,213,225,0.50)",
    ring: "ring-slate-300/40",
    glow: "0 0 16px rgba(203,213,225,0.28), inset 0 0 18px rgba(203,213,225,0.07)",
    Icon: Medal,
    label: "Silver",
  },
  3: {
    text: "text-orange-400",
    accent: "rgba(251,146,60,0.50)",
    ring: "ring-orange-400/40",
    glow: "0 0 16px rgba(251,146,60,0.28), inset 0 0 18px rgba(251,146,60,0.07)",
    Icon: Award,
    label: "Bronze",
  },
} as const;

const initials = (name: string) =>
  name.split(/\s|_/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";

const Avatar = ({ name, src, size = 44 }: { name: string; src?: string | null; size?: number }) => (
  <div
    className="relative overflow-hidden rounded-full bg-[#0a1428] ring-1 ring-sky-400/20 flex items-center justify-center"
    style={{ width: size, height: size, boxShadow: "0 0 10px rgba(56,189,248,0.12)" }}
  >
    {src ? (
      <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
    ) : (
      <span className="font-display text-[11px] font-bold uppercase tracking-wider text-sky-200/80">{initials(name)}</span>
    )}
  </div>
);

const RewardCard = ({ rank, coins }: { rank: 1 | 2 | 3; coins: number }) => {
  const meta = PODIUM[rank];
  const { Icon } = meta;
  return (
    <div
      className="relative flex flex-col items-center justify-between gap-2 rounded-xl border border-white/[0.06] p-3 pt-5 text-center min-h-[128px]"
      style={{
        background: "linear-gradient(180deg, rgba(10,22,46,0.85) 0%, rgba(4,10,24,0.9) 100%)",
        boxShadow: meta.glow,
      }}
    >
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#04081a] px-2.5 py-0.5 text-[9px] font-display font-bold uppercase tracking-[0.25em] text-sky-100/85 border border-sky-400/25">
        Rank {rank}
      </div>
      <Icon className={cn("h-7 w-7", meta.text)} style={{ filter: `drop-shadow(0 0 8px ${meta.accent})` }} />
      <div className="flex flex-col items-center">
        <div className={cn("font-display text-lg font-black leading-none", meta.text)}>
          {coins.toLocaleString()}
        </div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.28em] text-sky-200/55">Coins</div>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("WEEKLY");
  const [myProfile, setMyProfile] = useState<{ player_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: lb }, { data: rw }] = await Promise.all([
        supabase.from("leaderboard_entries").select("*").order("rank_position", { ascending: true }).limit(20),
        supabase.from("leaderboard_rewards").select("rank_position, coins").order("rank_position", { ascending: true }),
      ]);
      if (cancelled) return;
      const entriesData = (lb as LeaderboardEntry[]) ?? [];
      setEntries(entriesData);
      setRewards((rw as Reward[]) ?? []);

      // Sync avatars from profiles by player_name (single source of truth)
      const names = Array.from(new Set(entriesData.map((e) => e.player_name).filter(Boolean)));
      if (names.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("player_name, avatar_url")
          .in("player_name", names);
        if (!cancelled && profs) {
          const map: Record<string, string> = {};
          (profs as { player_name: string; avatar_url: string | null }[]).forEach((p) => {
            if (p.avatar_url) map[p.player_name.toLowerCase()] = p.avatar_url;
          });
          setAvatarMap(map);
        }
      }

      if (user) {
        const { data: p } = await supabase.from("profiles").select("player_name, avatar_url").eq("id", user.id).maybeSingle();
        if (!cancelled) setMyProfile(p as any);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const rewardFor = (r: 1 | 2 | 3) => rewards.find((x) => x.rank_position === r)?.coins ?? 0;
  const myEntry = useMemo(
    () => entries.find((e) => myProfile && e.player_name.toLowerCase() === myProfile.player_name.toLowerCase()),
    [entries, myProfile]
  );
  const avatarFor = (name: string) => avatarMap[name.toLowerCase()] ?? null;

  return (
    <div className="relative min-h-screen pb-28 overflow-hidden" style={{ background: "#02060f" }}>
      {/* Deep navy radial wash */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(15,52,96,0.55) 0%, transparent 55%), radial-gradient(ellipse at 50% 45%, rgba(14,116,180,0.10) 0%, transparent 60%), linear-gradient(180deg, #050b1e 0%, #02060f 100%)",
        }}
      />
      {/* Subtle futuristic grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.10) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)",
        }}
      />
      {/* Ambient blue lighting */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-[340px] -z-10 h-[300px]"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.10), transparent 65%)",
          filter: "blur(20px)",
        }}
      />
      {/* Low-opacity floating particles */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 opacity-40">
        {[...Array(14)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-sky-300/60"
            style={{
              top: `${(i * 53) % 100}%`,
              left: `${(i * 37) % 100}%`,
              boxShadow: "0 0 6px rgba(125,211,252,0.6)",
              animation: `float-up ${6 + (i % 5)}s ease-in-out ${i * 0.4}s infinite alternate`,
            }}
          />
        ))}
      </div>
      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, transparent 45%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Header */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-md items-start justify-between px-4 pt-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-md border border-sky-400/20 bg-[#04091c]/70 px-2.5 py-1.5 text-sky-100/80 backdrop-blur-md transition hover:border-sky-300/40 hover:text-sky-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.3em]">Back</span>
          </button>
          <div className="relative">
            <Avatar name={myProfile?.player_name ?? "You"} src={myProfile?.avatar_url} size={42} />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#02060f]" />
          </div>
        </div>

        <div
          className="relative mx-auto mt-2 max-w-md px-4 animate-fade-in"
          style={{ filter: "drop-shadow(0 0 24px rgba(56,189,248,0.25))" }}
        >
          <img
            src={zeoxLeaderboardLogo.url}
            alt="ZEOX — Esports Platform"
            className="mx-auto w-[243px] h-auto select-none"
            draggable={false}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-md px-4">
        {/* Title */}
        <section className="mt-2 text-center animate-fade-in">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.5em] text-sky-300/60">Hunter Rankings</p>
          <h1
            className="mt-3 font-display text-[34px] font-black uppercase leading-[1.02] tracking-[0.04em] bg-gradient-to-b from-[#eaf6ff] via-[#7ec4ff] to-[#2c6aa8] bg-clip-text text-transparent"
            style={{ textShadow: "0 0 30px rgba(56,189,248,0.15)" }}
          >
            Weekly<br />Leaderboard
          </h1>
          <p className="mt-3 text-[10.5px] tracking-[0.32em] text-sky-200/55">Compete • Rise • Dominate</p>
          <div className="mx-auto mt-3 h-px w-32 bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
        </section>

        {/* Rewards */}
        <section className="mt-6 animate-fade-in" style={{ animationDelay: "60ms" }}>
          <div
            className="rounded-2xl border border-sky-400/15 p-3.5 backdrop-blur-xl"
            style={{
              background: "linear-gradient(180deg, rgba(8,18,40,0.75) 0%, rgba(3,8,20,0.85) 100%)",
              boxShadow: "0 0 24px rgba(56,189,248,0.06), inset 0 0 30px rgba(56,189,248,0.03)",
            }}
          >
            <div className="mb-3 flex items-center justify-center gap-2 px-0.5">
              <Gift className="h-3.5 w-3.5 text-sky-300/80" />
              <h2 className="font-display text-[10.5px] font-bold uppercase tracking-[0.32em] text-sky-100/85">
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
          <div
            className="flex flex-1 items-center gap-1 rounded-xl border border-sky-400/15 p-1 backdrop-blur-xl"
            style={{ background: "linear-gradient(180deg, rgba(8,18,40,0.7), rgba(3,8,20,0.8))" }}
          >
            {TABS.map((t) => {
              const active = t === tab;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
                    active
                      ? "text-sky-50 bg-gradient-to-b from-sky-500/25 to-sky-700/15 ring-1 ring-sky-400/40"
                      : "text-sky-200/55 hover:text-sky-100"
                  )}
                  style={active ? { boxShadow: "0 0 14px rgba(56,189,248,0.25), inset 0 0 12px rgba(56,189,248,0.08)" } : undefined}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <button
            className="flex items-center gap-1.5 rounded-xl border border-sky-400/15 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-sky-100/85 backdrop-blur-xl transition hover:border-sky-300/30"
            style={{ background: "linear-gradient(180deg, rgba(8,18,40,0.7), rgba(3,8,20,0.8))" }}
          >
            <Globe className="h-3.5 w-3.5 text-sky-300/80" />
            All
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
        </section>

        {/* Column header */}
        <div className="mt-5 grid grid-cols-[44px,1fr,auto] items-center gap-3 px-3 text-[9.5px] font-display uppercase tracking-[0.3em] text-sky-300/50">
          <span>Rank</span>
          <span>Player</span>
          <span>Kills</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="font-display text-xs uppercase tracking-[0.4em] text-sky-200/60 animate-pulse">Loading…</div>
          </div>
        ) : entries.length === 0 ? (
          <div
            className="mt-2 rounded-xl border border-sky-400/15 p-8 text-center text-sm text-sky-200/60"
            style={{ background: "linear-gradient(180deg, rgba(8,18,40,0.7), rgba(3,8,20,0.8))" }}
          >
            No rankings this week. Check back soon, Hunter.
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {entries.map((e, i) => {
              const podium = (e.rank_position === 1 || e.rank_position === 2 || e.rank_position === 3)
                ? PODIUM[e.rank_position as 1 | 2 | 3]
                : null;
              const isMe = myProfile && e.player_name.toLowerCase() === myProfile.player_name.toLowerCase();
              const avatar = avatarFor(e.player_name);
              return (
                <li
                  key={e.id}
                  className={cn(
                    "group grid grid-cols-[44px,1fr,auto] items-center gap-3 rounded-xl border px-3 py-3.5 backdrop-blur-md transition-all duration-300 animate-fade-in",
                    isMe ? "border-sky-400/40" : "border-sky-400/10 hover:border-sky-400/25"
                  )}
                  style={{
                    background: isMe
                      ? "linear-gradient(180deg, rgba(14,52,108,0.55), rgba(4,12,30,0.75))"
                      : "linear-gradient(180deg, rgba(8,18,40,0.65), rgba(3,8,20,0.78))",
                    boxShadow: isMe
                      ? "0 0 18px rgba(56,189,248,0.22), inset 0 0 20px rgba(56,189,248,0.05)"
                      : "inset 0 0 14px rgba(56,189,248,0.025)",
                    animationDelay: `${140 + i * 30}ms`,
                  }}
                >
                  {/* Rank */}
                  {podium ? (
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-sky-400/15 bg-[#04091c]/70"
                      style={{ boxShadow: `inset 0 0 12px ${podium.accent.replace(/[\d.]+\)$/, "0.10)")}` }}
                    >
                      <podium.Icon className={cn("h-5 w-5", podium.text)} style={{ filter: `drop-shadow(0 0 6px ${podium.accent})` }} />
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-sky-400/10 bg-[#04091c]/60">
                      <span className="font-display text-base font-bold text-sky-100/80">{e.rank_position}</span>
                    </div>
                  )}

                  {/* Player */}
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={e.player_name} src={avatar} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-display text-[14px] font-bold text-sky-50">{e.player_name}</span>
                        {podium && <Crown className={cn("h-3 w-3", podium.text)} />}
                      </div>
                      <div className="text-[9.5px] uppercase tracking-[0.22em] text-sky-300/60">
                        Hunter {e.rank_label} {isMe && <span className="ml-1 text-sky-100/80">• You</span>}
                      </div>
                    </div>
                  </div>

                  {/* Kills */}
                  <div className="text-right">
                    <div className="font-display text-xl font-black leading-none text-sky-50">
                      {e.kills}
                    </div>
                    <div className="mt-0.5 text-[9px] uppercase tracking-[0.25em] text-sky-300/60">Kills</div>
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
              className="grid grid-cols-[64px,1fr,auto] items-center gap-3 rounded-xl border border-sky-400/35 p-3 backdrop-blur"
              style={{
                background: "linear-gradient(180deg, rgba(14,52,108,0.5), rgba(4,12,30,0.8))",
                boxShadow: "0 0 20px rgba(56,189,248,0.18), inset 0 0 18px rgba(56,189,248,0.05)",
              }}
            >
              <div className="flex flex-col items-center justify-center rounded-lg border border-sky-400/20 bg-[#04091c]/70 py-1.5">
                <span className="text-[8.5px] uppercase tracking-[0.2em] text-sky-200/60">Your Rank</span>
                <span className="font-display text-xl font-black text-sky-50">
                  {myEntry ? `#${myEntry.rank_position}` : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={myProfile.player_name} src={myProfile.avatar_url} />
                <div className="min-w-0">
                  <div className="truncate font-display text-[14px] font-bold text-sky-50">You</div>
                  <div className="text-[9.5px] uppercase tracking-[0.22em] text-sky-300/60">
                    {myEntry ? `Hunter ${myEntry.rank_label}` : "Unranked"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-black text-sky-50">
                  {myEntry?.kills ?? 0}
                </div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-sky-300/60">Kills</div>
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
