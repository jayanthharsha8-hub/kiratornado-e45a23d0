import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Gamepad2, Star, Ticket, Shield, Swords } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CornerFrame } from "@/pages/Login";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [level, setLevel] = useState("");
  const [ref, setRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("profile_completed, player_name, ff_uid, player_level, referral_code")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.profile_completed) { navigate("/home", { replace: true }); return; }
      if (data) {
        if (data.player_name && data.player_name !== "New Hunter" && data.player_name !== "Player") setName(data.player_name);
        if (data.ff_uid) setUid(data.ff_uid);
        if (data.player_level && data.player_level > 1) setLevel(String(data.player_level));
        if (data.referral_code) setRef(data.referral_code);
      }
      setChecking(false);
    })();
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const trimmedName = name.trim();
    const trimmedUid = uid.trim();
    const lvl = parseInt(level, 10);
    if (!trimmedName) { toast.error("Enter your name"); return; }
    if (!trimmedUid || !/^\d{5,15}$/.test(trimmedUid)) { toast.error("Enter a valid Free Fire UID"); return; }
    if (!Number.isFinite(lvl) || lvl < 1) { toast.error("Enter your current level"); return; }
    if (lvl < 25) { toast.error("Minimum Level 25 required to join KIRA TORNADO"); return; }

    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        player_name: trimmedName,
        ff_uid: trimmedUid,
        player_level: lvl,
        referral_code: ref.trim() || null,
        profile_completed: true,
      })
      .eq("id", user.id);
    setSubmitting(false);
    if (error) { toast.error(error.message || "Could not save profile"); return; }
    toast.success(`Welcome Hunter, ${trimmedName}`);
    navigate("/home", { replace: true });
  };

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-xs uppercase tracking-[0.4em] text-primary text-glow animate-flicker">Loading…</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(199 100% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(199 100% 60%) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, #000 35%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px]"
        style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(199 100% 45% / 0.22), transparent 70%)" }}
      />
      <CornerFrame />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-10">
        {/* Hunter emblem */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/50 bg-gradient-to-b from-primary/20 to-transparent animate-pulse-glow">
            <Swords className="h-9 w-9 text-primary text-glow" />
            <span className="absolute -inset-1 rounded-full border border-primary/20" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="font-display text-[24px] font-extrabold leading-tight tracking-tight">
            COMPLETE YOUR <span className="text-primary text-glow">HUNTER</span> PROFILE
          </h1>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            One final step before entering the arena.
          </p>
        </div>

        {/* Glass card */}
        <form
          onSubmit={onSubmit}
          className="relative mt-7 overflow-hidden rounded-[10px] border border-primary/30 p-5 backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(180deg, hsl(220 60% 9% / 0.75), hsl(222 50% 4% / 0.85))",
            boxShadow:
              "0 0 0 1px hsl(var(--primary) / 0.35), 0 0 24px hsl(var(--primary) / 0.18), inset 0 0 24px hsl(var(--primary) / 0.05)",
          }}
        >
          <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-primary" />
          <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-primary" />

          <Field icon={<User className="h-[18px] w-[18px]" />} label="Your Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={40}
              className="h-12 border-0 bg-transparent pl-11 text-[15px] placeholder:text-muted-foreground/55 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </Field>

          <Field icon={<Gamepad2 className="h-[18px] w-[18px]" />} label="Free Fire UID">
            <Input
              value={uid}
              onChange={(e) => setUid(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter your UID"
              inputMode="numeric"
              maxLength={15}
              className="h-12 border-0 bg-transparent pl-11 text-[15px] placeholder:text-muted-foreground/55 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </Field>

          <Field icon={<Star className="h-[18px] w-[18px]" />} label="Level (min 25)">
            <Input
              value={level}
              onChange={(e) => setLevel(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="Enter your current level"
              inputMode="numeric"
              className="h-12 border-0 bg-transparent pl-11 text-[15px] placeholder:text-muted-foreground/55 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </Field>

          <Field icon={<Ticket className="h-[18px] w-[18px]" />} label="Referral Code (Optional)">
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase().slice(0, 16))}
              placeholder="Enter referral code"
              className="h-12 border-0 bg-transparent pl-11 text-[15px] placeholder:text-muted-foreground/55 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="group relative mt-2 flex h-14 w-full items-center justify-center overflow-hidden rounded-[8px] border border-primary/70 font-display text-[13px] font-bold tracking-[0.32em] text-primary transition hover:bg-primary/10 disabled:opacity-60"
            style={{
              background:
                "linear-gradient(180deg, hsl(199 100% 50% / 0.10), hsl(199 100% 50% / 0.02))",
              boxShadow:
                "0 0 18px hsl(var(--primary) / 0.35), inset 0 0 14px hsl(var(--primary) / 0.12)",
            }}
          >
            <span className="pointer-events-none absolute left-1.5 top-1.5 h-2 w-2 border-l border-t border-primary" />
            <span className="pointer-events-none absolute right-1.5 bottom-1.5 h-2 w-2 border-r border-b border-primary" />
            {submitting ? "SAVING…" : "ENTER THE ARENA"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] tracking-wide text-muted-foreground/70">
          <Shield className="h-3.5 w-3.5 text-primary/80" />
          <span>Verified Hunters Only • Anti-Cheat Active</span>
        </div>
      </div>
    </div>
  );
};

const Field = ({
  icon, label, children,
}: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="mb-3.5">
    <div className="mb-1.5 text-[10.5px] font-semibold tracking-[0.28em] text-primary/80">
      {label.toUpperCase()}
    </div>
    <div className="relative rounded-[6px] border border-primary/25 bg-black/40 transition focus-within:border-primary/70">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/70">{icon}</span>
      {children}
    </div>
  </div>
);

export default Onboarding;
