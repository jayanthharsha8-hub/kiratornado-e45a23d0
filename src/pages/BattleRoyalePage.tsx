import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, Coins, Trophy, UsersRound, X, Sword } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_META } from "@/lib/tournaments";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Tab = "upcoming" | "live" | "completed";

interface Tournament {
  id: string;
  title: string;
  entry_fee: number;
  prize_pool: number;
  scheduled_at: string;
  total_slots: number;
  joined_players_count: number;
  status: string;
}

const red = "hsl(0 100% 56%)";
const redSoft = "hsl(0 100% 56% / 0.18)";

const BattleRoyalePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("tournaments")
      .select("id,title,entry_fee,prize_pool,scheduled_at,total_slots,joined_players_count,status")
      .eq("category", "battle_royale")
      .eq("status", tab)
      .eq("published", true)
      .order("scheduled_at", { ascending: tab !== "completed" })
      .then(async ({ data }) => {
        const rows = (data ?? []) as Tournament[];
        setTournaments(rows);
        setLoading(false);
      });
  }, [tab]);

  // Real-time shared slot count sync
  useEffect(() => {
    if (!tournaments.length) return;
    const ids = tournaments.map((t) => t.id);
    const channel = supabase
      .channel(`br-slots-${tab}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tournaments" },
        (payload: any) => {
          const updated = payload.new as Tournament | undefined;
          if (!updated || !ids.includes(updated.id)) return;
          setTournaments((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tournaments, tab]);

  return (
    <div className="min-h-screen bg-background px-3 pb-8 pt-4 text-foreground">
      <main className="mx-auto max-w-md space-y-4">
        <section className="relative h-[188px] overflow-hidden" style={{ border: `2px solid ${red}`, boxShadow: `0 0 14px ${redSoft}` }}>
          <img src={CATEGORY_META.battle_royale.image} alt="Battle Royale" className="absolute inset-0 h-full w-full object-cover brightness-75 contrast-125 saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border text-foreground transition active:scale-[0.97]"
            style={{ borderColor: red, boxShadow: `0 0 12px ${redSoft}` }}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="absolute left-4 top-9">
            <h1 className="font-display text-[40px] font-black uppercase leading-[0.85] tracking-normal text-foreground" style={{ textShadow: "0 2px 0 hsl(0 0% 0%)" }}>
              BATTLE<br /><span style={{ color: red }}>ROYALE</span>
            </h1>
            <p className="mt-4 font-display text-sm font-bold uppercase tracking-[0.42em] text-foreground/90">SOLO - 50 PLAYERS</p>
            <div className="mt-3 flex w-[210px] items-center gap-3 border bg-background/55 px-3 py-2" style={{ borderColor: red }}>
              <Trophy className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-[10px] font-bold uppercase text-foreground/85">Total Prize Pool</p>
                <p className="font-display text-2xl font-black" style={{ color: red }}>₹50,000</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 overflow-hidden border bg-card/40" style={{ borderColor: "hsl(0 0% 100% / 0.16)" }}>
          {(["upcoming", "live", "completed"] as Tab[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className="flex h-[58px] items-center justify-center gap-2 border-r text-[13px] font-display font-black uppercase text-foreground/55 transition active:scale-[0.97] last:border-r-0"
              style={{ borderColor: "hsl(0 0% 100% / 0.14)", color: tab === item ? "hsl(0 0% 98%)" : undefined, background: tab === item ? `linear-gradient(180deg, transparent, ${redSoft})` : undefined, boxShadow: tab === item ? `inset 0 -2px 0 ${red}` : undefined }}
            >
              {item === "upcoming" && <CalendarDays className="h-5 w-5" style={{ color: red }} />}
              {item === "live" && <span className="text-xl">⌁</span>}
              {item === "completed" && <Trophy className="h-5 w-5" />}
              {item === "live" ? "Ongoing" : item}
            </button>
          ))}
        </section>

        <section className="space-y-3">
          {loading ? (
            <div className="py-12 text-center font-display text-xs uppercase tracking-[0.35em]" style={{ color: red }}>Loading</div>
          ) : tournaments.length === 0 ? (
            <div className="border py-10 text-center font-display text-xs uppercase tracking-[0.25em] text-foreground/50" style={{ borderColor: red }}>No Battle Royale Matches</div>
          ) : (
            tournaments.map((t) => <BattleRoyaleCard key={t.id} tournament={t} />)
          )}
        </section>

        <div className="flex items-center justify-center gap-3 py-5 font-display text-[11px] font-bold uppercase tracking-[0.28em] text-foreground/25">
          <span className="h-px w-20 bg-foreground/15" />
          <span>▸▸ Lock Join And Win Exciting Rewards ◂◂</span>
          <span className="h-px w-20 bg-foreground/15" />
        </div>
      </main>
    </div>
  );
};

const BattleRoyaleCard = ({ tournament }: { tournament: Tournament }) => {
  const navigate = useNavigate();
  const date = new Date(tournament.scheduled_at);
  const dateText = date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const timeText = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  const count = tournament.joined_players_count;
  const isFull = count >= tournament.total_slots;
  const GREEN = "hsl(142 71% 50%)";

  return (
    <article className="relative flex min-h-[108px] overflow-hidden border bg-card/70 p-2" style={{ borderColor: red, boxShadow: `0 0 10px ${redSoft}` }}>
      <div className="flex h-[92px] w-[92px] shrink-0 items-center justify-center bg-background/70" style={{ borderRight: `1px solid ${redSoft}` }}>
        <Sword className="h-14 w-14" style={{ color: red, filter: `drop-shadow(0 0 8px ${red})` }} />
      </div>
      <div className="min-w-0 flex-1 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-black uppercase leading-none text-foreground">BATTLE ROYALE</h2>
            <p className="mt-2 font-display text-sm font-bold uppercase" style={{ color: red }}>SOLO - 50 PLAYERS</p>
          </div>
          {isFull ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color: GREEN, borderColor: GREEN, background: "hsl(142 71% 45% / 0.15)", boxShadow: "0 0 10px hsl(142 71% 45% / 0.5)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
              FULL
            </span>
          ) : (
            <div className="flex items-center gap-1 text-sm font-bold text-foreground tabular-nums">
              <UsersRound className="h-4 w-4" /> {count}/{tournament.total_slots}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div className="space-y-2 text-xs font-semibold text-foreground/65">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {dateText}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {timeText}</span>
            </div>
          </div>
          <div className="border-l px-2" style={{ borderColor: "hsl(0 0% 100% / 0.12)" }}>
            <p className="text-[10px] uppercase text-foreground/55">Entry Fee</p>
            <p className="font-display text-sm font-black text-orange-300"><Coins className="mr-1 inline h-4 w-4 text-yellow-400" />₹{tournament.entry_fee}</p>
          </div>
          <div className="border-l px-2" style={{ borderColor: "hsl(0 0% 100% / 0.12)" }}>
            <p className="text-[10px] uppercase text-foreground/55">Prize Pool</p>
            <p className="font-display text-sm font-black" style={{ color: red }}><Trophy className="mr-1 inline h-4 w-4 text-yellow-400" />₹{tournament.prize_pool}</p>
          </div>
          <Button
            disabled={isFull}
            onClick={() => {
              if (isFull) { toast.error("Match already full"); return; }
              navigate(`/tournament-slots/${tournament.id}`);
            }}
            className="h-11 border px-3 font-display text-xs font-black uppercase disabled:opacity-100 disabled:cursor-not-allowed"
            style={
              isFull
                ? { borderColor: GREEN, color: "#FFFFFF", background: `linear-gradient(135deg, ${GREEN}, ${GREEN}cc)`, boxShadow: `0 0 14px ${GREEN}` }
                : { borderColor: red, color: "hsl(0 0% 98%)", background: "transparent", boxShadow: `0 0 14px ${redSoft}` }
            }
          >
            {isFull ? "Match Full" : "Join Now"}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default BattleRoyalePage;