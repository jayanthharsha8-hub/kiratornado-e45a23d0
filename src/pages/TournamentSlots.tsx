import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, ShieldCheck, Coins, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { toast } from "sonner";
import { playSound } from "@/hooks/useSound";
import SlotActionButton from "@/components/SlotActionButton";

interface Tournament {
  id: string; title: string; category: Category; entry_fee: number;
  total_slots: number; prize_pool: number; scheduled_at: string;
  level_requirement: number;
}

const TournamentSlots = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [filledSet, setFilledSet] = useState<Set<number>>(new Set());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const [profile, setProfile] = useState<{ coins: number; player_level: number } | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => { if (id && user) loadData(); /* eslint-disable-next-line */ }, [id, user]);

  const loadData = async () => {
    if (!id || !user) return;
    const { data: t } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
    if (!t) { navigate("/home"); return; }
    setTournament(t as Tournament);

    const { count } = await supabase.from("registrations").select("id", { count: "exact", head: true }).eq("tournament_id", id);
    // We don't track per-slot index; treat first N slots as filled visually.
    const filled = new Set<number>();
    for (let i = 1; i <= (count ?? 0); i++) filled.add(i);
    setFilledSet(filled);

    const { data: reg } = await supabase.from("registrations").select("id").eq("tournament_id", id).eq("user_id", user.id).maybeSingle();
    if (reg) {
      // Already joined → never show slot page; go straight to match details (replace history)
      navigate(`/tournament/${id}`, { replace: true });
      return;
    }

    // Block joining if match already started
    if (t.scheduled_at && new Date(t.scheduled_at).getTime() <= Date.now()) {
      toast.error("Match already started");
      navigate(`/tournament/${id}`, { replace: true });
      return;
    }

    const { data: prof } = await supabase.from("profiles").select("coins,player_level").eq("id", user.id).maybeSingle();
    if (prof) setProfile(prof as any);
  };

  const confirmJoin = async () => {
    if (!user || !tournament || !selectedSlot || joined || joining) return;
    if (profile && profile.player_level < tournament.level_requirement) {
      toast.error(`Level ${tournament.level_requirement}+ required`);
      return;
    }
    playSound("pulse");
    setJoining(true);
    const { error } = await (supabase.rpc as any)("join_tournament", { _tournament_id: tournament.id });
    setJoining(false);
    if (error) { toast.error(error.message || "Unable to join"); return; }
    toast.success("Slot secured!");
    setJoined(true);
    setTimeout(() => navigate(`/tournament/${tournament.id}`, { replace: true }), 500);
  };

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xs uppercase tracking-[0.4em] text-primary animate-pulse">Loading...</div>
      </div>
    );
  }

  const meta = CATEGORY_META[tournament.category];
  const accent = meta.color;
  const accentSoft = meta.colorSoft;
  const totalSlots = tournament.total_slots;
  const modeLabel =
    tournament.category === "lone_wolf" ? "1V1 DUEL"
    : tournament.category === "classic_squad" ? "SQUAD 4V4"
    : tournament.category === "battle_royale" ? "SOLO BR"
    : "SOLO";

  return (
    <div className="relative min-h-screen bg-background pb-32 text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{ background: `radial-gradient(800px 400px at 50% -10%, ${accentSoft}, transparent 60%)` }} />

      {/* TOP BAR */}
      <header className="mx-auto flex max-w-md items-center justify-between px-4 pt-4">
        <button
          onClick={() => { playSound("tick"); navigate(-1); }}
          className="flex items-center gap-2 rounded-xl border bg-background/40 px-3 py-2 backdrop-blur transition active:scale-95"
          style={{ borderColor: accent, boxShadow: `0 0 12px ${accentSoft}`, color: accent }}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em]">Back</span>
        </button>
        <div className="font-display text-[10px] font-bold uppercase tracking-[0.32em] text-foreground/50 truncate max-w-[55%] text-right">
          {tournament.title}
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 pt-5 pb-4">
        {/* HEADER */}
        <div className="text-center">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.45em]" style={{ color: accent, textShadow: `0 0 10px ${accent}` }}>
            [ Select Slot ]
          </p>
          <h1 className="mt-2 font-display text-2xl font-black uppercase italic tracking-tight">
            {modeLabel}
          </h1>
          <p className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.3em] text-foreground/55">
            {filledSet.size}/{totalSlots} Slots Filled
          </p>
        </div>

        {/* AVAILABLE SLOTS */}
        <section
          className="rounded-2xl border bg-card/40 p-4 backdrop-blur"
          style={{ borderColor: accent, boxShadow: `0 0 18px ${accentSoft}` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[12px] font-bold uppercase tracking-[0.28em]" style={{ color: accent }}>
              Available Slots
            </h2>
            <span className="font-display text-[10px] uppercase tracking-[0.2em] text-foreground/55">
              Tap to select
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-[44vh] overflow-y-auto pr-1">
            {Array.from({ length: totalSlots }, (_, i) => i + 1).map((slot) => {
              const filled = filledSet.has(slot);
              const selected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  disabled={filled || joined}
                  onClick={() => { playSound("tick"); setSelectedSlot(slot); }}
                  className="relative flex h-16 flex-col items-center justify-center rounded-xl border font-display transition active:scale-[0.97] disabled:cursor-not-allowed"
                  style={
                    filled
                      ? { borderColor: "hsl(0 0% 100% / 0.08)", background: "hsl(0 0% 100% / 0.03)", color: "hsl(0 0% 100% / 0.3)" }
                      : selected
                      ? { borderColor: accent, background: `${accent}26`, color: accent, boxShadow: `0 0 22px ${accent}, inset 0 0 14px ${accentSoft}` }
                      : { borderColor: `${accent}55`, background: "hsl(0 0% 100% / 0.02)", color: "hsl(0 0% 100% / 0.85)" }
                  }
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-70">Slot</span>
                  <span className="text-lg font-black leading-none">{String(slot).padStart(2, "0")}</span>
                  {filled && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 text-[8px] uppercase tracking-widest">
                      <Lock className="h-2.5 w-2.5" /> Full
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* SUMMARY */}
        <section className="grid grid-cols-3 gap-2">
          <Stat label="Entry" value={tournament.entry_fee === 0 ? "FREE" : `₹${tournament.entry_fee}`} icon={<Coins className="h-3.5 w-3.5" />} accent={accent} />
          <Stat label="Prize" value={`₹${tournament.prize_pool}`} icon={<Trophy className="h-3.5 w-3.5" />} accent={accent} />
          <Stat label="Balance" value={`${profile?.coins ?? 0}`} icon={<ShieldCheck className="h-3.5 w-3.5" />} accent={accent} />
        </section>

        {/* INSTRUCTIONS */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11.5px] leading-relaxed text-foreground/70">
          <p className="mb-1 font-display text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: accent }}>Instructions</p>
          <ul className="space-y-1">
            <li>• Slot is reserved as soon as you confirm.</li>
            <li>• Room ID unlocks 10 minutes before match start.</li>
            <li>• Use registered IGN only — wrong IGN = removed.</li>
          </ul>
        </section>

      </main>

      <SlotActionButton
        accent={accent}
        accentSoft={accentSoft}
        selected={!!selectedSlot}
        loading={joining}
        success={joined}
        slotNumber={selectedSlot}
        onClick={confirmJoin}
      />
    </div>
  );
};

const Stat = ({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) => (
  <div className="rounded-xl border bg-card/40 px-2 py-2.5 text-center backdrop-blur"
    style={{ borderColor: `${accent}44` }}>
    <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-[0.2em] text-foreground/55">
      <span style={{ color: accent }}>{icon}</span>{label}
    </div>
    <div className="mt-1 font-display text-sm font-black" style={{ color: accent, textShadow: `0 0 8px ${accent}66` }}>
      {value}
    </div>
  </div>
);

export default TournamentSlots;
