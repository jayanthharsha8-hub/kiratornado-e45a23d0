import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SystemPanel } from "@/components/SystemPanel";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Edit2, Shield, Swords, Target, Trophy, Award, Star, Crosshair, Crown } from "lucide-react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/ReportDialog";
import { BottomNav } from "@/components/BottomNav";

const ADMIN_EMAIL = "jayanthharsha8@gmail.com";

interface Profile {
  username: string; player_name: string; ff_uid: string; player_level: number;
  coins: number; matches_played: number; wins: number; total_kills: number; avatar_url: string | null;
}

const RANK_LABELS = ["E", "D", "C", "B", "A", "S"];
const getRank = (level: number) => {
  if (level >= 90) return "S";
  if (level >= 75) return "A";
  if (level >= 60) return "B";
  if (level >= 45) return "C";
  if (level >= 30) return "D";
  return "E";
};

const RANK_COLORS: Record<string, string> = {
  S: "text-yellow-400 border-yellow-400/60 bg-yellow-400/10",
  A: "text-purple-400 border-purple-400/60 bg-purple-400/10",
  B: "text-blue-400 border-blue-400/60 bg-blue-400/10",
  C: "text-green-400 border-green-400/60 bg-green-400/10",
  D: "text-orange-400 border-orange-400/60 bg-orange-400/10",
  E: "text-muted-foreground border-muted bg-muted/20",
};

const ACHIEVEMENTS = [
  { id: "first_match", label: "First Match", desc: "Play your first match", icon: Swords, check: (p: Profile) => p.matches_played >= 1 },
  { id: "first_win", label: "First Win", desc: "Win a match", icon: Trophy, check: (p: Profile) => p.wins >= 1 },
  { id: "kills_10", label: "10 Kills", desc: "Reach 10 total kills", icon: Target, check: (p: Profile) => p.total_kills >= 10 },
  { id: "kills_50", label: "50 Kills", desc: "Reach 50 total kills", icon: Crosshair, check: (p: Profile) => p.total_kills >= 50 },
  { id: "matches_10", label: "Veteran", desc: "Play 10 matches", icon: Star, check: (p: Profile) => p.matches_played >= 10 },
];

interface MatchHistory { id: string; tournament_title: string; created_at: string; }

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<MatchHistory[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ player_name: "", ff_uid: "", player_level: "1" });
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("username,player_name,ff_uid,player_level,coins,matches_played,wins,total_kills,avatar_url")
      .eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data as Profile);
          setEditForm({ player_name: data.player_name, ff_uid: data.ff_uid, player_level: String(data.player_level) });
        }
      });

    supabase.from("registrations")
      .select("id, created_at, tournaments(title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setHistory((data ?? []).map((r: any) => ({
          id: r.id,
          tournament_title: r.tournaments?.title ?? "Unknown",
          created_at: r.created_at,
        })));
      });
  }, [user]);

  const saveEdit = async () => {
    if (!user || !editForm.player_name.trim()) { toast.error("Player name required"); return; }
    const nextLevel = Number(editForm.player_level);
    if (!Number.isInteger(nextLevel) || nextLevel < 1 || nextLevel > 100) { toast.error("Level must be a number from 1 to 100"); return; }
    await supabase.from("profiles").update({
      player_name: editForm.player_name.trim(),
      ff_uid: editForm.ff_uid.trim(),
      player_level: nextLevel,
    }).eq("id", user.id);
    toast.success("Profile updated");
    setEditOpen(false);
    setProfile(p => p ? { ...p, player_name: editForm.player_name.trim(), ff_uid: editForm.ff_uid.trim(), player_level: nextLevel } : p);
  };

  if (!profile) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-xs uppercase tracking-[0.4em] text-primary text-glow animate-flicker">Loading...</div>
    </div>
  );

  const rank = getRank(profile.player_level);
  const winRate = profile.matches_played > 0 ? ((profile.wins / profile.matches_played) * 100).toFixed(1) : "0.0";
  const avgKills = profile.matches_played > 0 ? (profile.total_kills / profile.matches_played).toFixed(1) : "0.0";

  return (
    <div className="relative min-h-screen scanline pb-24">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--gradient-glow)' }} />

      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/home")} className="flex items-center gap-1 text-primary hover:text-glow-soft">
            <ArrowLeft className="h-4 w-4" /><span className="text-xs uppercase tracking-widest">Back</span>
          </button>
          <Logo size={28} />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        {/* Profile Card */}
        <div className="animate-float-up rounded border border-primary/50 bg-card/60 p-5 glow-soft text-center relative">
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={() => setEditOpen(true)} className="rounded border border-primary/40 bg-primary/10 p-2 text-primary hover:bg-primary/20">
              <Edit2 className="h-4 w-4" />
            </button>
            <button onClick={() => setReportOpen(true)} className="rounded border border-destructive/40 bg-destructive/10 p-2 text-destructive hover:bg-destructive/20">
              <Shield className="h-4 w-4" />
            </button>
          </div>

          {/* Avatar */}
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/60 bg-primary/10 animate-pulse-glow">
            <Crown className="h-10 w-10 text-primary" />
          </div>

          <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground text-glow">{profile.player_name}</h2>
          <p className="text-xs text-muted-foreground">@{profile.username}</p>

          {/* Rank Badge */}
          <div className="mx-auto mt-3 flex items-center justify-center gap-2">
            <div className={`flex h-12 w-12 items-center justify-center rounded border-2 font-display text-lg font-bold animate-pulse-glow ${RANK_COLORS[rank]}`}>
              {rank}
            </div>
            <div className="text-left">
              <div className="font-display text-sm font-bold text-foreground">{rank} Rank Hunter</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Level {profile.player_level}</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-primary/20 bg-background/40 p-2">
              <span className="text-muted-foreground">UID:</span> <span className="text-primary">{profile.ff_uid}</span>
            </div>
            <div className="rounded border border-primary/20 bg-background/40 p-2">
              <span className="text-muted-foreground">Coins:</span> <span className="text-primary">{profile.coins}</span>
            </div>
          </div>

          {user?.email === ADMIN_EMAIL && (
            <Button onClick={() => navigate("/admin")} className="mt-4 w-full bg-primary font-display text-xs uppercase tracking-[0.24em] text-primary-foreground hover:bg-primary-glow">
              ADMIN PANEL
            </Button>
          )}
        </div>

        {/* Stats */}
        <SystemPanel title="Combat Stats">
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Matches" value={profile.matches_played} icon={<Swords className="h-4 w-4" />} />
            <StatBox label="Wins" value={profile.wins} icon={<Trophy className="h-4 w-4" />} />
            <StatBox label="Total Kills" value={profile.total_kills} icon={<Target className="h-4 w-4" />} />
            <StatBox label="Avg Kills" value={avgKills} icon={<Crosshair className="h-4 w-4" />} />
            <StatBox label="Win Rate" value={`${winRate}%`} icon={<Award className="h-4 w-4" />} />
            <StatBox label="Level" value={profile.player_level} icon={<Star className="h-4 w-4" />} />
          </div>
        </SystemPanel>

        {/* Achievements */}
        <SystemPanel title="Achievements">
          <div className="space-y-2">
            {ACHIEVEMENTS.map(a => {
              const unlocked = a.check(profile);
              return (
                <div key={a.id} className={`flex items-center gap-3 rounded border p-3 transition ${unlocked ? "border-primary/50 bg-primary/10" : "border-muted bg-card/30 opacity-50"}`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded border ${unlocked ? "border-primary text-primary" : "border-muted text-muted-foreground"}`}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-display text-xs font-bold uppercase tracking-widest ${unlocked ? "text-primary text-glow-soft" : "text-muted-foreground"}`}>{a.label}</div>
                    <div className="text-[10px] text-muted-foreground">{a.desc}</div>
                  </div>
                  {unlocked && <div className="text-[10px] font-display uppercase tracking-widest text-primary">Unlocked</div>}
                </div>
              );
            })}
          </div>
        </SystemPanel>

        {/* Match History */}
        <SystemPanel title="Match History">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No matches yet. Join a tournament, Hunter.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between rounded border border-primary/20 bg-card/40 p-3">
                  <div>
                    <div className="font-display text-xs font-bold text-foreground">{h.tournament_title}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</div>
                  </div>
                  <Swords className="h-4 w-4 text-primary/50" />
                </div>
              ))}
            </div>
          )}
        </SystemPanel>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-primary/40 bg-background max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg uppercase tracking-widest text-primary text-glow-soft">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Player Name</Label>
              <Input value={editForm.player_name} onChange={e => setEditForm(p => ({ ...p, player_name: e.target.value }))} className="border-primary/30 bg-card" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Free Fire UID</Label>
              <Input value={editForm.ff_uid} onChange={e => setEditForm(p => ({ ...p, ff_uid: e.target.value }))} className="border-primary/30 bg-card" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Player Level</Label>
              <Input type="number" min={1} max={100} inputMode="numeric" value={editForm.player_level} onChange={e => setEditForm(p => ({ ...p, player_level: e.target.value }))} className="border-primary/30 bg-card" />
            </div>
            <Button onClick={saveEdit} className="w-full bg-primary font-display text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} />
      <BottomNav />
    </div>
  );
};

const StatBox = ({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) => (
  <div className="rounded border border-primary/30 bg-card/40 p-3 text-center">
    <div className="flex items-center justify-center gap-1 text-primary/80 mb-1">{icon}</div>
    <div className="font-display text-lg font-bold text-foreground text-glow-soft">{value}</div>
    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
  </div>
);

export default ProfilePage;
