import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Gift, Globe, ChevronDown, Trophy, Medal, Award } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
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
    tone: "leaderboard-podium-gold",
    Icon: Trophy,
    label: "Gold",
  },
  2: {
    tone: "leaderboard-podium-silver",
    Icon: Medal,
    label: "Silver",
  },
  3: {
    tone: "leaderboard-podium-bronze",
    Icon: Award,
    label: "Bronze",
  },
} as const;

const initials = (name: string) =>
  name.split(/\s|_/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";

const Avatar = ({ name, src, size = 44 }: { name: string; src?: string | null; size?: number }) => (
  <div
    className="leaderboard-avatar relative flex shrink-0 items-center justify-center overflow-hidden rounded-full"
    style={{ width: size, height: size }}
  >
    {src ? (
      <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
    ) : (
      <span className="font-display text-[11px] font-bold uppercase text-primary/80">{initials(name)}</span>
    )}
  </div>
);

const PodiumCard = ({
  entry,
  rank,
  coins,
  avatar,
  isMe,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  coins: number;
  avatar?: string | null;
  isMe: boolean;
}) => {
  const meta = PODIUM[rank];
  const { Icon } = meta;
  return (
    <article className={cn("leaderboard-podium-card", meta.tone, rank === 1 && "leaderboard-podium-first", isMe && "leaderboard-is-me")}>
      <div className="leaderboard-podium-rank" aria-label={`Rank ${rank}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>#{rank}</span>
      </div>
      <Avatar name={entry.player_name} src={avatar} size={rank === 1 ? 50 : 44} />
      <div className="mt-1.5 w-full min-w-0 text-center">
        <div className="truncate font-display text-[11px] font-bold text-foreground">
          {entry.player_name}
        </div>
        <div className="mt-0.5 text-[8px] font-semibold uppercase text-muted-foreground">
          {entry.rank_label}{isMe ? " · You" : ""}
        </div>
      </div>
      <div className="mt-1.5 flex items-end justify-center gap-1">
        <span className="font-display text-lg font-black leading-none text-foreground">{entry.kills}</span>
        <span className="text-[7px] font-bold uppercase text-muted-foreground">Kills</span>
      </div>
      <div className="leaderboard-podium-reward">
        <Gift className="h-2.5 w-2.5" />
        {coins.toLocaleString()}
      </div>
    </article>
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
  const podiumEntries = entries.slice(0, 3);
  const remainingEntries = entries.slice(3);
  const podiumOrder = [2, 1, 3] as const;

  return (
    <div className="leaderboard-theme relative min-h-screen overflow-hidden pb-24">
      <div aria-hidden className="leaderboard-backdrop pointer-events-none fixed inset-0 -z-10" />

      {/* Header */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-md items-center justify-between px-3 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-9 rounded-md border-primary/20 bg-card/60 px-2.5 text-foreground/80 backdrop-blur-md hover:border-primary/40 hover:bg-primary/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-[9px] font-semibold uppercase">Back</span>
          </Button>
          <div className="relative">
            <Avatar name={myProfile?.player_name ?? "You"} src={myProfile?.avatar_url} size={36} />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-success" />
          </div>
        </div>

        <div className="leaderboard-logo relative mx-auto -mt-7 w-28 animate-fade-in">
          <img
            src={zeoxLeaderboardLogo}
            alt="ZEOX — Esports Platform"
            className="h-auto w-full select-none"
            draggable={false}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-md px-3">
        {/* Title */}
        <section className="-mt-1 text-center animate-fade-in">
          <p className="font-display text-[8px] font-semibold uppercase text-primary/65">Hunter Rankings</p>
          <h1 className="leaderboard-title mt-0.5 font-display text-[24px] font-black uppercase leading-none">
            Leaderboard
          </h1>
          <p className="mt-1 text-[8px] font-medium uppercase text-muted-foreground">Compete · Rise · Dominate</p>
        </section>

        {/* Tabs + Region */}
        <section className="mt-3 flex items-center gap-1.5 animate-fade-in">
          <div className="leaderboard-control flex min-w-0 flex-1 items-center gap-0.5 p-1">
            {TABS.map((t) => {
              const active = t === tab;
              return (
                <Button
                  key={t}
                  variant="ghost"
                  onClick={() => setTab(t)}
                  className={cn(
                    "h-8 min-w-0 flex-1 rounded-md px-1 text-[8px] font-bold uppercase transition-all duration-300",
                    active
                      ? "leaderboard-tab-active text-foreground"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  )}
                >
                  {t}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            className="leaderboard-control h-10 shrink-0 gap-1 rounded-md px-2.5 text-[8px] font-bold uppercase text-foreground/85"
          >
            <Globe className="text-primary/80" />
            All
            <ChevronDown className="opacity-70" />
          </Button>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="font-display text-[10px] uppercase text-primary/60 animate-pulse">Loading rankings…</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="leaderboard-surface mt-3 rounded-lg p-7 text-center text-sm text-muted-foreground">
            No rankings this week. Check back soon, Hunter.
          </div>
        ) : (
          <>
            <section className="mt-3 animate-fade-in" aria-labelledby="podium-heading">
              <div className="mb-1.5 flex items-center justify-center gap-1.5">
                <Trophy className="h-3 w-3 text-primary/80" />
                <h2 id="podium-heading" className="font-display text-[8px] font-bold uppercase text-foreground/75">
                  Weekly Elite · Rewards
                </h2>
              </div>
              <div className="grid grid-cols-3 items-end gap-1.5">
                {podiumOrder.map((rank) => {
                  const entry = podiumEntries.find((item) => item.rank_position === rank);
                  if (!entry) return <div key={rank} />;
                  const isMe = Boolean(myProfile && entry.player_name.toLowerCase() === myProfile.player_name.toLowerCase());
                  return (
                    <PodiumCard
                      key={entry.id}
                      entry={entry}
                      rank={rank}
                      coins={rewardFor(rank)}
                      avatar={avatarFor(entry.player_name)}
                      isMe={isMe}
                    />
                  );
                })}
              </div>
            </section>

            {remainingEntries.length > 0 && (
              <div className="mt-3 grid grid-cols-[38px,minmax(0,1fr),52px] items-center gap-2 px-2 text-[8px] font-display font-semibold uppercase text-muted-foreground">
                <span>Rank</span>
                <span>Hunter</span>
                <span className="text-right">Kills</span>
              </div>
            )}

            <ul className="mt-1.5 space-y-1.5">
            {remainingEntries.map((e, i) => {
              const isMe = myProfile && e.player_name.toLowerCase() === myProfile.player_name.toLowerCase();
              const avatar = avatarFor(e.player_name);
              return (
                <li
                  key={e.id}
                  className={cn(
                    "leaderboard-row group grid grid-cols-[38px,minmax(0,1fr),52px] items-center gap-2 rounded-lg px-2 py-2 animate-fade-in",
                    isMe && "leaderboard-is-me"
                  )}
                  style={{ animationDelay: `${80 + i * 25}ms` }}
                >
                  <div className="leaderboard-rank-number">
                    <span className="text-[9px] text-primary/45">#</span>{e.rank_position}
                  </div>

                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar name={e.player_name} src={avatar} size={36} />
                    <div className="min-w-0">
                      <div className="truncate font-display text-[12px] font-bold text-foreground">{e.player_name}</div>
                      <div className="mt-0.5 truncate text-[8px] font-semibold uppercase text-muted-foreground">
                        {e.rank_label} {isMe && <span className="text-primary/80">· You</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display text-base font-black leading-none text-foreground">{e.kills}</div>
                    <div className="mt-0.5 text-[7px] font-semibold uppercase text-muted-foreground">Kills</div>
                  </div>
                </li>
              );
            })}
            </ul>
          </>
        )}

        {/* Your Rank */}
        {myProfile && (
          <section className="mt-2.5 animate-fade-in">
            <div className="leaderboard-my-rank grid grid-cols-[54px,minmax(0,1fr),48px] items-center gap-2 rounded-lg p-2">
              <div className="flex flex-col items-center justify-center rounded-md border border-primary/15 bg-background/35 py-1">
                <span className="text-[7px] font-semibold uppercase text-muted-foreground">Your Rank</span>
                <span className="font-display text-lg font-black text-foreground">
                  {myEntry ? `#${myEntry.rank_position}` : "—"}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <Avatar name={myProfile.player_name} src={myProfile.avatar_url} size={34} />
                <div className="min-w-0">
                  <div className="truncate font-display text-[12px] font-bold text-foreground">You</div>
                  <div className="truncate text-[8px] font-semibold uppercase text-muted-foreground">
                    {myEntry ? `Hunter ${myEntry.rank_label}` : "Unranked"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-base font-black text-foreground">{myEntry?.kills ?? 0}</div>
                <div className="text-[7px] font-semibold uppercase text-muted-foreground">Kills</div>
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
