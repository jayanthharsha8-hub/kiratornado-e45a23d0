import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Hash, KeyRound, Copy } from "lucide-react";
import { Particles } from "@/components/Particles";
import { BottomNav } from "@/components/BottomNav";
import { SystemPanel } from "@/components/SystemPanel";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { playSound } from "@/hooks/useSound";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type JoinedMatch = {
  id: string;
  title: string;
  category: Category;
  scheduled_at: string;
  status: "upcoming" | "live" | "completed" | "cancelled";
  room_id: string | null;
  room_password: string | null;
  total_slots: number;
  joined_players_count: number;
};

const STATUS_COLOR: Record<JoinedMatch["status"], string> = {
  upcoming: "#00cfff",
  live: "#22c55e",
  completed: "#a855f7",
  cancelled: "#ff3b3b",
};

const Tournaments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<JoinedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("registrations")
        .select("tournament_id, tournaments(id, title, category, scheduled_at, status, room_id, room_password, total_slots, joined_players_count)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const list: JoinedMatch[] = (data ?? [])
        .map((r: any) => r.tournaments)
        .filter(Boolean);
      setMatches(list);
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

  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    playSound("tick");
    toast.success(`${label} copied`);
  };

  return (
    <div className="relative min-h-screen pb-20 scanline">
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-3 py-2">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-display text-lg font-bold uppercase tracking-widest text-foreground text-glow">My Matches</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3 px-3 pt-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80">[ Joined Tournaments ]</p>

        {loading ? (
          <div className="text-center text-xs uppercase tracking-[0.4em] text-primary/70 animate-flicker py-12">Loading...</div>
        ) : matches.length === 0 ? (
          <SystemPanel title="Status">
            <div className="py-8 text-center">
              <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">No matches joined yet</p>
              <button
                onClick={() => { playSound("pulse"); navigate("/home"); }}
                className="mt-4 rounded border border-primary px-4 py-2 text-xs font-display uppercase tracking-widest text-primary hover:bg-primary/10 hover:glow-soft"
              >
                Browse Arenas
              </button>
            </div>
          </SystemPanel>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const meta = CATEGORY_META[m.category];
              const sColor = STATUS_COLOR[m.status];
              return (
                <div
                  key={m.id}
                  className="relative overflow-hidden rounded-sm border bg-card/60 p-3 backdrop-blur"
                  style={{ borderColor: meta.color, boxShadow: `0 0 12px ${meta.colorSoft}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: meta.color }}>{meta.title}</p>
                      <h3 className="font-display text-sm font-black uppercase tracking-wider text-foreground text-glow truncate">{m.title}</h3>
                    </div>
                    <span
                      className="rounded-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest animate-pulse-glow"
                      style={{ borderColor: sColor, color: sColor, backgroundColor: `${sColor}22` }}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-foreground/80">
                    <div className="flex items-center gap-1.5 rounded-sm border border-primary/25 bg-background/35 px-2 py-1.5">
                      <span className="text-primary">Mode</span> {meta.title}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-sm border border-primary/25 bg-background/35 px-2 py-1.5">
                      <span className="text-primary">Players</span> {m.joined_players_count}/{m.total_slots}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-foreground/80">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {new Date(m.scheduled_at).toLocaleString()}
                  </div>

                  {(m.room_id || m.room_password) && m.status !== "completed" && (
                    <div className="mt-3 space-y-2 rounded border border-primary/30 bg-background/40 p-2.5">
                      {m.room_id && (
                        <button
                          onClick={() => copy(m.room_id!, "Room ID")}
                          className="flex w-full items-center justify-between rounded px-1 py-1 text-xs hover:bg-primary/10"
                        >
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Hash className="h-3.5 w-3.5 text-primary" /> Room ID
                          </span>
                          <span className="flex items-center gap-1.5 text-primary text-glow-soft font-mono">
                            {m.room_id} <Copy className="h-3 w-3" />
                          </span>
                        </button>
                      )}
                      {m.room_password && (
                        <button
                          onClick={() => copy(m.room_password!, "Password")}
                          className="flex w-full items-center justify-between rounded px-1 py-1 text-xs hover:bg-primary/10"
                        >
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <KeyRound className="h-3.5 w-3.5 text-primary" /> Password
                          </span>
                          <span className="flex items-center gap-1.5 text-primary text-glow-soft font-mono">
                            {m.room_password} <Copy className="h-3 w-3" />
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Tournaments;
