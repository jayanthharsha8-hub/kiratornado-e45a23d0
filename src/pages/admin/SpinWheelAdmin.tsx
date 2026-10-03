import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Eye, RotateCcw, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SpinWheel } from "@/components/spin/SpinWheel";
import { defaultSpinRewards, type SpinReward, type SpinRewardType, type SpinSettings } from "@/lib/spinWheel";

const db = supabase as any;
const types: { value: SpinRewardType; label: string }[] = [
  { value: "bonus_coins", label: "Bonus Coins" }, { value: "br_tokens", label: "BR Tokens" },
  { value: "discount_coupon", label: "Discount Coupon (%)" }, { value: "no_luck", label: "No Luck" },
];
const number = (text: string) => Math.max(0, Number.parseInt(text, 10) || 0);

export default function SpinWheelAdmin() {
  const [rows, setRows] = useState<SpinReward[]>(defaultSpinRewards);
  const [settings, setSettings] = useState<SpinSettings>({ enabled: true, daily_limit: 1 });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const load = async () => {
    const [{ data: prizes, error: rewardError }, { data: cfg, error: settingsError }] = await Promise.all([
      db.from("spin_rewards").select("slot,name,reward_type,value,weight,enabled").order("slot"),
      db.from("spin_settings").select("enabled,daily_limit").eq("id", 1).single(),
    ]);
    if (rewardError || settingsError) toast.error("Could not load wheel settings");
    else { setRows(prizes ?? defaultSpinRewards); setSettings(cfg); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const patch = (slot: number, updates: Partial<SpinReward>) => setRows(old => old.map(row => row.slot === slot ? { ...row, ...updates } : row));
  const save = async (prizes = rows, cfg = settings) => {
    if (prizes.length !== 8 || prizes.some(r => !r.name.trim() || r.name.length > 80 || !Number.isInteger(r.value) || r.value < (r.reward_type === "no_luck" ? 0 : 1) || (r.reward_type === "discount_coupon" && r.value > 100) || (r.reward_type === "no_luck" && r.value !== 0) || r.value > 100000 || r.weight < 0 || r.weight > 10000) || cfg.daily_limit < 0 || cfg.daily_limit > 100) {
      toast.error("Check all prize names, values, weights, and daily limit"); return;
    }
    setBusy(true);
    const { error: rewardError } = await db.from("spin_rewards").upsert(prizes, { onConflict: "slot" });
    const { error: settingsError } = rewardError ? { error: null } : await db.from("spin_settings").upsert({ id: 1, ...cfg }, { onConflict: "id" });
    setBusy(false);
    if (rewardError || settingsError) { toast.error((rewardError ?? settingsError).message); await load(); return; }
    toast.success("Spin Wheel saved");
  };
  const reset = () => { setRows(defaultSpinRewards.map(r => ({ ...r }))); setSettings({ enabled: true, daily_limit: 1 }); toast.info("Defaults loaded. Save to apply them."); };
  return <div className="mx-auto max-w-5xl space-y-6 pb-10">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-display text-2xl font-bold uppercase text-primary">Spin Wheel</h1><p className="text-sm text-muted-foreground">Manage prizes and daily spins</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setPreview(!preview)}><Eye /> Preview</Button><Button variant="outline" onClick={reset}><RotateCcw /> Defaults</Button><Button disabled={busy || loading} onClick={() => save()}><Save /> {busy ? "Saving…" : "Save changes"}</Button></div></div>
    {loading ? <p>Loading…</p> : <>
      {preview && <div className="spin-admin-preview"><SpinWheel rewards={rows} /><Button variant="outline" asChild><Link to="/spinwheel">Open player view</Link></Button></div>}
      <div className="flex flex-wrap items-center gap-8 rounded-md border border-primary/25 bg-card p-4"><div className="flex items-center gap-3"><Switch id="wheel-enabled" checked={settings.enabled} onCheckedChange={enabled => setSettings(s => ({ ...s, enabled }))} /><Label htmlFor="wheel-enabled">Spin Wheel enabled</Label></div><div className="flex items-center gap-3"><Label htmlFor="daily-limit">Daily spin limit</Label><Input id="daily-limit" type="number" min={0} max={100} className="w-24" value={settings.daily_limit} onChange={e => setSettings(s => ({ ...s, daily_limit: number(e.target.value) }))} /></div></div>
      <div className="grid gap-3 lg:grid-cols-2">{rows.map(row => <section key={row.slot} className="rounded-md border border-primary/25 bg-card p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-display font-bold text-primary">SECTION {row.slot}</h2><div className="flex items-center gap-2"><Label htmlFor={`enabled-${row.slot}`}>Enabled</Label><Switch id={`enabled-${row.slot}`} checked={row.enabled} onCheckedChange={enabled => patch(row.slot, { enabled })} /></div></div><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><Label htmlFor={`name-${row.slot}`}>Reward name</Label><Input id={`name-${row.slot}`} maxLength={80} value={row.name} onChange={e => patch(row.slot, { name: e.target.value })} /></div><div><Label htmlFor={`type-${row.slot}`}>Type</Label><select id={`type-${row.slot}`} className="flex h-10 w-full rounded-sm border border-input bg-background px-2 text-sm text-foreground" value={row.reward_type} onChange={e => patch(row.slot, { reward_type: e.target.value as SpinRewardType, value: e.target.value === "no_luck" ? 0 : row.value || 1 })}>{types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div><div><Label htmlFor={`value-${row.slot}`}>Value</Label><Input id={`value-${row.slot}`} type="number" min={row.reward_type === "no_luck" ? 0 : 1} max={row.reward_type === "discount_coupon" ? 100 : 100000} disabled={row.reward_type === "no_luck"} value={row.value} onChange={e => patch(row.slot, { value: number(e.target.value) })} /></div><div className="col-span-2"><Label htmlFor={`weight-${row.slot}`}>Probability weight</Label><Input id={`weight-${row.slot}`} type="number" min={0} max={10000} value={row.weight} onChange={e => patch(row.slot, { weight: number(e.target.value) })} /></div></div></section>)}</div>
    </>}
  </div>;
}
