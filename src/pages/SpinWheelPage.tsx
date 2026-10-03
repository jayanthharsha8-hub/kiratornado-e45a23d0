import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SpinWheel } from "@/components/spin/SpinWheel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { defaultSpinRewards, type SpinReward, type SpinResult, type SpinSettings } from "@/lib/spinWheel";
import { playSound } from "@/hooks/useSound";

const db = supabase as any;
const todayUTC = () => new Date().toISOString().slice(0, 10);

export default function SpinWheelPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rewards, setRewards] = useState<SpinReward[]>(defaultSpinRewards);
  const [settings, setSettings] = useState<SpinSettings | null>(null);
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [visibleResult, setVisibleResult] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const lock = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: cfg, error: configError }, { data: prizes, error: prizesError }, { count, error: historyError }] = await Promise.all([
      db.from("spin_settings").select("enabled,daily_limit").eq("id", 1).single(),
      db.from("spin_rewards").select("slot,name,reward_type,value,weight,enabled").order("slot"),
      db.from("spin_history").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("spin_day", todayUTC()),
    ]);
    if (configError || prizesError || historyError) toast.error("Could not load Spin Wheel. Please try again.");
    else { setSettings(cfg); setRewards(prizes ?? []); setUsed(count ?? 0); }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const channel = supabase.channel("spin-wheel-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "spin_rewards" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "spin_settings" }, () => load()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((Date.parse(todayUTC() + "T00:00:00Z") + 86400000 - Date.now()) / 1000)));
    tick(); const interval = setInterval(tick, 1000);
    return () => { clearInterval(interval); if (timeout.current) clearTimeout(timeout.current); };
  }, []);

  const spin = async () => {
    if (lock.current || !settings?.enabled || used >= settings.daily_limit || !rewards.some(r => r.enabled && r.weight > 0)) return;
    lock.current = true; setSpinning(true); playSound("pulse");
    const { data, error } = await db.from("spin_history").insert({ user_id: user?.id, reward_slot: 1, reward_name: "", reward_type: "", reward_value: 0, spin_day: todayUTC() }).select("id,reward_slot,reward_name,reward_type,reward_value,spin_day").single();
    if (error || !data) { toast.error(error?.message ?? "Spin failed. Try again."); setSpinning(false); lock.current = false; await load(); return; }
    const won = data as SpinResult;
    setResult(won);
    setUsed(n => n + 1);
    // Sector 1 is centered at 12 o'clock. The final rotation aligns the chosen sector to the fixed pointer.
    const current = rotation % 360;
    const target = (360 - (won.reward_slot - 1) * 45) % 360;
    setRotation(rotation + 1800 + ((target - current + 360) % 360));
    timeout.current = setTimeout(() => { setSpinning(false); setVisibleResult(true); lock.current = false; playSound("pulse"); }, 5100);
  };

  const time = `${String(Math.floor(remaining / 3600)).padStart(2, "0")}:${String(Math.floor(remaining % 3600 / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const exhausted = settings && used >= settings.daily_limit;

  return <div className="spin-page">
    <main className="spin-shell">
      <header className="spin-topbar">
        <Button size="icon" variant="outline" aria-label="Back to Home" title="Back to Home" onClick={() => navigate("/home")} className="spin-back"><ArrowLeft className="!size-5" /></Button>
        <span className="spin-brand" aria-label="ZEOX">ZEO<span>X</span></span>
        <span className="spin-top-spacer" />
      </header>
      <div className="spin-heading"><h1>SPIN <span>&amp; WIN</span></h1><p>YOUR LUCK. YOUR REWARDS.</p></div>
      <SpinWheel rewards={rewards} rotation={rotation} spinning={spinning} />
      <Button className="spin-main-button" onClick={spin} disabled={loading || spinning || !settings?.enabled || !!exhausted || !rewards.some(r => r.enabled && r.weight > 0)}>
        {spinning ? <><Loader2 className="!size-6 animate-spin" /> SPINNING</> : loading ? "LOADING" : !settings?.enabled ? "UNAVAILABLE" : exhausted ? "COME BACK TOMORROW" : "SPIN"}
      </Button>
      <div className="spin-status">
        <div><CalendarDays aria-hidden="true" /><span><small>DAILY SPINS</small><strong>{settings ? Math.max(0, settings.daily_limit - used) : "–"} / {settings?.daily_limit ?? "–"}</strong></span></div>
        <div><span><small>Next spin in</small><strong><Clock3 aria-hidden="true" /> {exhausted ? time : "00:00:00"}</strong></span></div>
      </div>
    </main>
    <Dialog open={visibleResult} onOpenChange={setVisibleResult}>
      <DialogContent className="spin-result-dialog"><DialogHeader><DialogTitle className="font-display text-2xl text-primary">{result?.reward_type === "no_luck" ? "NO LUCK THIS TIME" : "REWARD UNLOCKED"}</DialogTitle><DialogDescription className="pt-4 font-display text-xl font-bold text-foreground">{result?.reward_name}</DialogDescription></DialogHeader>
        {result?.reward_type === "discount_coupon" && <p className="text-center text-sm text-muted-foreground">{result.reward_value}% off eligible tournaments. Your coupon is ready.</p>}
        <Button className="mt-3 w-full" onClick={() => setVisibleResult(false)}>CONTINUE</Button>
      </DialogContent>
    </Dialog>
  </div>;
}
