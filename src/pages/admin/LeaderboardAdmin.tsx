import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Entry {
  id: string; player_name: string; kills: number; rank_label: string;
  rank_position: number; week_start: string;
}

const RANKS = ["S", "A", "B", "C", "D", "E"];

const emptyForm = { player_name: "", kills: 0, rank_label: "E", rank_position: 10, week_start: new Date().toISOString().slice(0, 10) };

interface Reward { rank_position: number; coins: number }

export default function LeaderboardAdmin() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [rewards, setRewards] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });
  const [savingRewards, setSavingRewards] = useState(false);

  const load = async () => {
    const [{ data }, { data: rw }] = await Promise.all([
      supabase.from("leaderboard_entries").select("*").order("rank_position", { ascending: true }),
      supabase.from("leaderboard_rewards").select("rank_position, coins"),
    ]);
    setEntries((data as Entry[]) ?? []);
    const map: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    ((rw as Reward[]) ?? []).forEach((r) => { map[r.rank_position] = r.coins; });
    setRewards(map);
  };

  useEffect(() => { load(); }, []);

  const saveRewards = async () => {
    setSavingRewards(true);
    const payload = [1, 2, 3].map((r) => ({ rank_position: r, coins: Math.max(0, Number(rewards[r]) || 0) }));
    const { error } = await supabase.from("leaderboard_rewards").upsert(payload, { onConflict: "rank_position" });
    setSavingRewards(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Rewards updated");
    load();
  };

  const save = async () => {
    if (!form.player_name.trim()) { toast.error("Player name required"); return; }
    const payload = {
      player_name: form.player_name.trim(),
      kills: form.kills,
      rank_label: form.rank_label,
      rank_position: form.rank_position,
      week_start: form.week_start,
    };
    if (editing) {
      await supabase.from("leaderboard_entries").update(payload).eq("id", editing);
      toast.success("Entry updated");
    } else {
      await supabase.from("leaderboard_entries").insert(payload);
      toast.success("Entry created");
    }
    setOpen(false); setEditing(null); setForm(emptyForm); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("leaderboard_entries").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const edit = (e: Entry) => {
    setEditing(e.id);
    setForm({ player_name: e.player_name, kills: e.kills, rank_label: e.rank_label, rank_position: e.rank_position, week_start: e.week_start });
    setOpen(true);
  };

  const rankColor = (r: string) => {
    if (r === "S") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    if (r === "A") return "bg-purple-500/20 text-purple-400 border-purple-500/50";
    if (r === "B") return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    if (r === "C") return "bg-green-500/20 text-green-400 border-green-500/50";
    if (r === "D") return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-primary text-glow">Leaderboard</h1>
          <p className="text-xs text-muted-foreground">Manage weekly player rankings</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }} className="gap-2 bg-primary font-display text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
          <Plus className="h-4 w-4" /> Add Entry
        </Button>
      </div>

      <SystemPanel title="Weekly Rewards">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Coin amounts shown on the leaderboard for the top 3 ranks.</p>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((r) => (
              <div key={r} className="space-y-1.5">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Rank {r} Coins</Label>
                <Input
                  type="number"
                  min={0}
                  value={rewards[r] ?? 0}
                  onChange={(e) => setRewards((p) => ({ ...p, [r]: +e.target.value }))}
                  className="border-primary/30 bg-card"
                />
              </div>
            ))}
          </div>
          <Button onClick={saveRewards} disabled={savingRewards} className="bg-primary font-display text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
            {savingRewards ? "Saving..." : "Save Rewards"}
          </Button>
        </div>
      </SystemPanel>


      <SystemPanel>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Kills</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Week</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-display font-bold">#{e.rank_position}</TableCell>
                  <TableCell className="font-medium">{e.player_name}</TableCell>
                  <TableCell>{e.kills}</TableCell>
                  <TableCell><Badge variant="outline" className={rankColor(e.rank_label)}>{e.rank_label} Rank</Badge></TableCell>
                  <TableCell className="text-xs">{e.week_start}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => edit(e)} className="rounded p-1.5 text-primary hover:bg-primary/10"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => del(e.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No entries yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SystemPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-primary/40 bg-background">
          <DialogHeader>
            <DialogTitle className="font-display text-lg uppercase tracking-widest text-primary text-glow-soft">
              {editing ? "Edit Entry" : "Add Leaderboard Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Player Name</Label>
              <Input value={form.player_name} onChange={(e) => setForm(p => ({ ...p, player_name: e.target.value }))} className="border-primary/30 bg-card" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Kills</Label>
                <Input type="number" min={0} value={form.kills} onChange={(e) => setForm(p => ({ ...p, kills: +e.target.value }))} className="border-primary/30 bg-card" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Position</Label>
                <Input type="number" min={1} max={10} value={form.rank_position} onChange={(e) => setForm(p => ({ ...p, rank_position: +e.target.value }))} className="border-primary/30 bg-card" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Rank Label</Label>
                <Select value={form.rank_label} onValueChange={(v) => setForm(p => ({ ...p, rank_label: v }))}>
                  <SelectTrigger className="border-primary/30 bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{RANKS.map(r => <SelectItem key={r} value={r}>{r} Rank</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Week Start</Label>
                <Input type="date" value={form.week_start} onChange={(e) => setForm(p => ({ ...p, week_start: e.target.value }))} className="border-primary/30 bg-card" />
              </div>
            </div>
            <Button onClick={save} className="w-full bg-primary font-display text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
              {editing ? "Update" : "Add Entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
