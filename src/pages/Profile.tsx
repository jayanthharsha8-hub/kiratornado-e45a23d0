import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { SystemPanel } from "@/components/SystemPanel";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Edit2, Shield, Swords, Target, Trophy, Award, Crosshair, Crown,
  BadgeCheck, Copy, Coins, ChevronRight, Settings, Calendar, Clock, Star, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/ReportDialog";
import { BottomNav } from "@/components/BottomNav";
import { AvatarPickerDialog } from "@/components/AvatarPickerDialog";

interface Profile {
  username: string; player_name: string; ff_uid: string; player_level: number;
  coins: number; matches_played: number; wins: number; total_kills: number;
  avatar_url: string | null; created_at?: string;
}

const getRank = (level: number) => {
  if (level >= 81) return "S";
  if (level >= 70) return "A";
  if (level >= 61) return "B";
  if (level >= 41) return "C";
  if (level >= 21) return "D";
  return "E";
};

const rankStars = (rank: string) => ({ S: 5, A: 4, B: 3, C: 2, D: 1, E: 1 }[rank] ?? 1);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [editForm, setEditForm] = useState({ player_name: "", ff_uid: "", player_level: "1" });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.from("profiles")
      .select("username,player_name,ff_uid,player_level,coins,matches_played,wins,total_kills,avatar_url,created_at")
      .eq("id", user.id).maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { toast.error("Failed to load profile"); return; }
        if (data) {
          setProfile(data as Profile);
          setEditForm({ player_name: data.player_name, ff_uid: data.ff_uid, player_level: String(data.player_level) });
        }
      });
    return () => { cancelled = true; };
  }, [user]);

  const saveEdit = async () => {
    if (!user || !editForm.player_name.trim()) { toast.error("Player name required"); return; }
    const nextLevel = Number(editForm.player_level);
    if (!Number.isInteger(nextLevel) || nextLevel < 1 || nextLevel > 100) { toast.error("Level must be 1-100"); return; }
    await supabase.from("profiles").update({
      player_name: editForm.player_name.trim(),
      ff_uid: editForm.ff_uid.trim(),
      player_level: nextLevel,
    }).eq("id", user.id);
    toast.success("Profile updated");
    setEditOpen(false);
    setProfile(p => p ? { ...p, player_name: editForm.player_name.trim(), ff_uid: editForm.ff_uid.trim(), player_level: nextLevel } : p);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };

  if (!profile) {
    return (
      <div className="relative min-h-screen scanline pb-24">
        <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "var(--gradient-glow)" }} />
        <div className="mx-auto max-w-md space-y-4 px-4 pt-6">
          <div className="h-10 animate-pulse rounded border border-primary/20 bg-card/40" />
          <div className="h-60 animate-pulse rounded border border-primary/20 bg-card/40" />
          <div className="h-72 animate-pulse rounded border border-primary/20 bg-card/40" />
        </div>
        <BottomNav />
      </div>
    );
  }

  const rank = getRank(profile.player_level);
  const stars = rankStars(rank);
  const winRate = profile.matches_played > 0 ? (profile.wins / profile.matches_played) * 100 : 0;
  const avgKills = profile.matches_played > 0 ? profile.total_kills / profile.matches_played : 0;
  const deaths = Math.max(profile.matches_played - profile.wins, 1);
  const kd = profile.total_kills / deaths;
  const xpCurrent = profile.player_level * 650; // visual only
  const xpMax = 97000;
  const xpPct = Math.min(100, (xpCurrent / xpMax) * 100);
  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
    : "—";

  return (
    <div className="relative min-h-screen scanline pb-28">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "var(--gradient-glow)" }} />

      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/home")} className="flex items-center gap-1 text-primary hover:text-glow-soft">
            <ArrowLeft className="h-4 w-4" /><span className="text-xs uppercase tracking-widest">Back</span>
          </button>
          <Logo size={26} />
          <button onClick={() => setReportOpen(true)} aria-label="Settings" className="rounded border border-primary/40 bg-primary/10 p-1.5 text-primary hover:bg-primary/20">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-4">
        {/* PROFILE HEADER CARD */}
        <section className="relative overflow-hidden rounded-xl border border-primary/50 bg-card/60 p-4 glow-soft animate-float-up">
          {/* corner cuts */}
          <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-primary" />
          <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-primary" />
          <span aria-hidden className="pointer-events-none absolute left-0 bottom-0 h-3 w-3 border-l border-b border-primary" />
          <span aria-hidden className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r border-b border-primary" />

          <div className="flex gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <button
                onClick={() => setAvatarOpen(true)}
                aria-label="Change avatar"
                className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-primary/70 bg-primary/10 animate-pulse-glow"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.player_name} className="h-full w-full object-cover" />
                ) : (
                  <Crown className="h-10 w-10 text-primary" />
                )}
              </button>
              <button
                onClick={() => setAvatarOpen(true)}
                aria-label="Edit avatar"
                className="absolute -top-1 -right-1 rounded-full border border-primary/60 bg-background p-1.5 text-primary hover:bg-primary/20"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              {/* rank chip under avatar */}
              <div className="mt-2 mx-auto flex w-fit items-center gap-1 rounded border border-primary/50 bg-background/70 px-2 py-0.5">
                <span className="font-display text-[10px] font-bold text-primary">{rank}</span>
                <span className="text-[9px] uppercase tracking-widest text-primary/80">Rank Hunter</span>
              </div>
            </div>

            {/* Right side */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="font-display truncate text-lg font-bold uppercase tracking-wider text-foreground text-glow">
                  {profile.player_name}
                </h1>
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
              </div>
              <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>

              <div className="mt-2 inline-flex items-center rounded border border-primary/50 bg-primary/10 px-2.5 py-1">
                <span className="font-display text-[11px] font-bold uppercase tracking-widest text-primary text-glow-soft">
                  Level {profile.player_level}
                </span>
              </div>

              {/* XP bar */}
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full border border-primary/30 bg-background/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow shadow-[0_0_8px_hsl(var(--primary))]"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  XP {xpCurrent.toLocaleString()} / {xpMax.toLocaleString()}
                </div>
              </div>

              <button onClick={() => setEditOpen(true)} aria-label="Edit profile"
                className="absolute right-3 top-3 rounded border border-primary/40 bg-primary/10 p-1.5 text-primary hover:bg-primary/20">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* UID + COINS row */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => copy(profile.ff_uid || "", "UID")} className="flex items-center justify-between rounded border border-primary/30 bg-background/40 px-3 py-2 text-left hover:border-primary/60">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">UID: <span className="text-primary">{profile.ff_uid || "—"}</span></span>
              <Copy className="h-3.5 w-3.5 text-primary/70" />
            </button>
            <div className="flex items-center justify-between rounded border border-primary/30 bg-background/40 px-3 py-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">COINS: <span className="text-primary">{profile.coins.toLocaleString()}</span></span>
              <Coins className="h-3.5 w-3.5 text-primary/70" />
            </div>
          </div>

          {/* ADMIN PANEL — admins only */}
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="mt-4 flex w-full items-center justify-between rounded-lg border-2 border-primary/70 bg-primary/15 px-4 py-3 transition hover:bg-primary/25 glow-soft"
            >
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-display text-sm font-bold uppercase tracking-[0.24em] text-primary text-glow-soft">Admin Panel</span>
              </span>
              <ChevronRight className="h-4 w-4 text-primary" />
            </button>
          )}
        </section>

        {/* HUNTER CHAT ENTRY */}
        <button
          onClick={() => navigate("/hunter-chat")}
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-primary/60 bg-card/60 px-4 py-3 glow-soft transition hover:bg-primary/10"
        >
          <span className="flex items-center gap-3">
            <span className="relative grid h-10 w-10 place-items-center rounded-lg border border-primary/70 bg-primary/15 text-primary animate-pulse-glow">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span className="text-left">
              <span className="block font-display text-sm font-bold uppercase tracking-widest text-foreground text-glow-soft">
                Hunter Chat
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                Live global community
              </span>
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-primary" />
        </button>

        {/* COMBAT STATS */}
        <SystemPanel
          title="Combat Stats"
          right={
            <button className="flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-widest text-primary hover:bg-primary/20">
              View More <ChevronRight className="h-3 w-3" />
            </button>
          }
        >
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Matches" value={profile.matches_played} icon={<Swords className="h-4 w-4" />} />
            <StatBox label="Wins" value={profile.wins} icon={<Trophy className="h-4 w-4" />} />
            <StatBox label="Total Kills" value={profile.total_kills} icon={<Target className="h-4 w-4" />} />
            <StatBox label="K/D Ratio" value={kd.toFixed(2)} icon={<Crosshair className="h-4 w-4" />} />
            <StatBox label="Avg Kills" value={avgKills.toFixed(2)} icon={<Target className="h-4 w-4" />} />
            <StatBox label="Win Rate" value={`${winRate.toFixed(1)}%`} icon={<Award className="h-4 w-4" />} />
          </div>
        </SystemPanel>

        {/* CURRENT RANK */}
        <section className="rounded-xl border border-primary/40 bg-card/60 p-4 glow-soft">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <Shield className="absolute h-20 w-20 text-primary/30" strokeWidth={1} />
              <span className="relative font-display text-3xl font-extrabold text-primary text-glow">{rank}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Rank</div>
              <div className="font-display text-base font-bold uppercase tracking-wider text-foreground text-glow-soft">{rank} Rank Hunter</div>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < stars ? "fill-primary text-primary" : "text-primary/30"}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-primary/20 pt-3">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="uppercase tracking-widest text-muted-foreground">Joined</span>
              <span className="ml-auto font-display text-foreground">{joined}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="uppercase tracking-widest text-muted-foreground">Last Active</span>
              <span className="ml-auto flex items-center gap-1.5 font-display text-[hsl(140_70%_55%)]">
                ONLINE <span className="inline-block h-2 w-2 rounded-full bg-[hsl(140_70%_55%)] shadow-[0_0_6px_hsl(140_70%_55%)]" />
              </span>
            </div>
          </div>
        </section>
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
      {user && (
        <AvatarPickerDialog
          open={avatarOpen}
          onOpenChange={setAvatarOpen}
          userId={user.id}
          currentUrl={profile.avatar_url}
          onPicked={(url) => setProfile(p => p ? { ...p, avatar_url: url } : p)}
        />
      )}

      <BottomNav />
    </div>
  );
};

const StatBox = ({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) => (
  <div className="rounded-lg border border-primary/30 bg-card/40 p-3 text-center">
    <div className="mb-1 flex items-center justify-center text-primary/80">{icon}</div>
    <div className="font-display text-lg font-bold text-foreground text-glow-soft">{value}</div>
    <div className="mt-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
  </div>
);

export default ProfilePage;
