import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Flame, Plus } from "lucide-react";

interface Reward {
  id: string;
  day: number;
  title: string;
  description: string;
  image_url: string | null;
  bonus_coins: number;
  br_tokens: number;
  discount_percent: number;
  unlock_key: string | null;
  unlock_days: number | null;
  enabled: boolean;
}

const num = (v: string) => Math.max(0, parseInt(v || "0", 10) || 0);

export default function StreakAdmin() {
  const [rows, setRows] = useState<Reward[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await (supabase.from("streak_rewards" as any) as any)
      .select("*")
      .order("day", { ascending: true });
    setRows((data ?? []) as Reward[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const patch = (id: string, p: Partial<Reward>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const save = async (r: Reward) => {
    setSavingId(r.id);
    const { error } = await (supabase.from("streak_rewards" as any) as any)
      .update({
        title: r.title,
        description: r.description,
        image_url: r.image_url || null,
        bonus_coins: r.bonus_coins,
        br_tokens: r.br_tokens,
        discount_percent: r.discount_percent,
        unlock_key: r.unlock_key || null,
        unlock_days: r.unlock_days ?? null,
        enabled: r.enabled,
      })
      .eq("id", r.id);
    setSavingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Day ${r.day} updated — live in the app`);
  };

  const addDay = async () => {
    const nextDay = (rows[rows.length - 1]?.day ?? 0) + 1;
    const { error } = await (supabase.from("streak_rewards" as any) as any).insert({
      day: nextDay, title: `Day ${nextDay} Reward`, description: "",
    });
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-primary text-glow">Daily Streak</h1>
          <p className="text-xs text-muted-foreground">Edit rewards for each streak day — changes appear instantly in the app</p>
        </div>
        <Button onClick={addDay} variant="outline" className="gap-2 border-primary/40 text-xs uppercase tracking-widest">
          <Plus className="h-4 w-4" /> Add Day
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading rewards…</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <SystemPanel key={r.id} title={`Day ${r.day}`} right={
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Enabled</span>
              <Switch checked={r.enabled} onCheckedChange={(v) => patch(r.id, { enabled: v })} />
            </div>
          }>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Flame className="h-4 w-4" />
                <Input
                  value={r.title}
                  onChange={(e) => patch(r.id, { title: e.target.value })}
                  placeholder="Reward title"
                  className="border-primary/30 bg-card"
                />
              </div>
              <Input
                value={r.description ?? ""}
                onChange={(e) => patch(r.id, { description: e.target.value })}
                placeholder="Short description"
                className="border-primary/30 bg-card text-xs"
              />
              <Input
                value={r.image_url ?? ""}
                onChange={(e) => patch(r.id, { image_url: e.target.value })}
                placeholder="Reward image URL (optional)"
                className="border-primary/30 bg-card text-xs"
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Bonus Coins</Label>
                  <Input type="number" value={r.bonus_coins}
                    onChange={(e) => patch(r.id, { bonus_coins: num(e.target.value) })}
                    className="border-primary/30 bg-card" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">BR Tokens</Label>
                  <Input type="number" value={r.br_tokens}
                    onChange={(e) => patch(r.id, { br_tokens: num(e.target.value) })}
                    className="border-primary/30 bg-card" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Discount %</Label>
                  <Input type="number" value={r.discount_percent}
                    onChange={(e) => patch(r.id, { discount_percent: num(e.target.value) })}
                    className="border-primary/30 bg-card" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Unlock Key</Label>
                  <Input value={r.unlock_key ?? ""}
                    onChange={(e) => patch(r.id, { unlock_key: e.target.value })}
                    placeholder="profile_badge…"
                    className="border-primary/30 bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Unlock Days (blank = forever)</Label>
                  <Input type="number" value={r.unlock_days ?? ""}
                    onChange={(e) => patch(r.id, { unlock_days: e.target.value === "" ? null : num(e.target.value) })}
                    className="border-primary/30 bg-card text-xs" />
                </div>
              </div>

              <Button onClick={() => save(r)} disabled={savingId === r.id}
                className="w-full gap-2 bg-primary font-display text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
                <Save className="h-4 w-4" /> {savingId === r.id ? "Saving…" : "Save Day " + r.day}
              </Button>
            </div>
          </SystemPanel>
        ))}
      </div>
    </div>
  );
}
