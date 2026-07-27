import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquare, User, LifeBuoy, Send, Bell, Flame } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Profile { username: string; player_name: string; ff_uid: string; player_level: number; coins: number; }

interface Notif { id: string; title: string; message: string; created_at: string; }

export const SideMenu = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<"menu" | "support" | "feedback" | "notifications">("menu");
  const [feedback, setFeedback] = useState("");
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user || !open) return;
    supabase.from("profiles").select("username,player_name,ff_uid,player_level,coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => data && setProfile(data));
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setNotifs((data as Notif[]) ?? []));
  }, [user, open]);

  const sendFeedback = async () => {
    if (!user || feedback.trim().length < 3) { toast.error("Write a longer message"); return; }
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, message: feedback.trim().slice(0, 1000) });
    if (error) { toast.error(error.message); return; }
    toast.success("Feedback received. Thank you, Hunter.");
    setFeedback(""); setView("menu");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setView("menu"); }}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left" className="border-r border-primary/40 bg-sidebar p-0">
        <SheetHeader className="border-b border-primary/30 p-4">
          <SheetTitle className="flex items-center gap-3">
            <Logo size={40} withText />
          </SheetTitle>
        </SheetHeader>

        <div className="p-4">
          {view === "menu" && (
            <nav className="space-y-2">
              <MenuBtn icon={<User className="h-4 w-4" />} label="My Profile" onClick={() => { setOpen(false); navigate("/profile"); }} />
              <MenuBtn icon={<Flame className="h-4 w-4" />} label="Daily Streak" onClick={() => { setOpen(false); navigate("/daily-streak"); }} />

              <MenuBtn icon={<Bell className="h-4 w-4" />} label="Notifications" onClick={() => setView("notifications")} badge={notifs.length > 0 ? notifs.length : undefined} />
              <MenuBtn icon={<LifeBuoy className="h-4 w-4" />} label="Customer Support" onClick={() => setView("support")} />
              <MenuBtn icon={<MessageSquare className="h-4 w-4" />} label="Feedback" onClick={() => setView("feedback")} />
              <Button onClick={signOut} variant="outline" className="mt-6 w-full border-destructive/50 text-destructive hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </nav>
          )}

          {view === "notifications" && (
            <div className="space-y-3">
              <p className="font-display text-xs uppercase tracking-widest text-primary text-glow-soft">Notifications</p>
              {notifs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {notifs.map(n => (
                    <div key={n.id} className="rounded border border-primary/20 bg-card/50 p-3">
                      <div className="flex items-center gap-2">
                        <Bell className="h-3 w-3 text-primary" />
                        <span className="font-display text-xs font-bold text-foreground">{n.title}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-foreground/80">{n.message}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="ghost" onClick={() => setView("menu")} className="w-full text-primary">Back</Button>
            </div>
          )}

          {view === "support" && (
            <div className="panel rounded-sm p-4 space-y-2 text-sm">
              <p className="text-foreground/90">Need help? Reach our support team:</p>
              <p className="text-primary text-glow-soft">support@kiratornado.app</p>
              <p className="text-xs text-muted-foreground">We reply within 24 hours.</p>
              <Button variant="ghost" onClick={() => setView("menu")} className="mt-3 w-full text-primary">Back</Button>
            </div>
          )}

          {view === "feedback" && (
            <div className="panel rounded-sm p-4 space-y-3">
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={1000} placeholder="Tell us what you think..." className="min-h-[120px] border-primary/40 bg-input/60" />
              <Button onClick={sendFeedback} className="w-full bg-primary font-display uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
                <Send className="mr-2 h-4 w-4" /> Send
              </Button>
              <Button variant="ghost" onClick={() => setView("menu")} className="w-full text-primary">Back</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const MenuBtn = ({ icon, label, onClick, badge }: { icon: React.ReactNode; label: string; onClick: () => void; badge?: number }) => (
  <button onClick={onClick} className="flex w-full items-center gap-3 rounded border border-primary/30 bg-card/60 px-3 py-3 text-left text-sm text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary hover:text-glow-soft">
    {icon}<span className="font-display uppercase tracking-widest text-xs flex-1">{label}</span>
    {badge !== undefined && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{badge}</span>}
  </button>
);
