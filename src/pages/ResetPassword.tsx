import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check for recovery session from URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type === "recovery") {
      setReady(true);
    } else {
      // Also check if user has an active session (they clicked the link)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true);
      });
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset successful");
    navigate("/login", { replace: true });
  };

  if (!ready) {
    return (
      <div className="relative min-h-screen px-4 py-10 scanline">
        <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--gradient-glow)' }} />
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-20">
          <Logo size={64} />
          <p className="text-xs uppercase tracking-[0.4em] text-primary text-glow animate-flicker">Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-10 scanline">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--gradient-glow)' }} />
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 pt-6">
          <Logo size={64} />
          <h1 className="font-display text-xl font-black uppercase tracking-[0.25em] text-primary text-glow">ZEOX</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">[ SET NEW PASSWORD ]</p>
        </div>

        <SystemPanel title="New Password">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[11px] uppercase tracking-widest text-primary/80">New Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="border-primary/40 bg-input/60" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] uppercase tracking-widest text-primary/80">Confirm Password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="border-primary/40 bg-input/60" />
            </div>
            <Button type="submit" disabled={loading} className="mt-2 h-12 w-full bg-primary font-display text-sm font-bold uppercase tracking-[0.3em] text-primary-foreground hover:bg-primary-glow animate-pulse-glow">
              {loading ? "Updating..." : "[ Reset Password ]"}
            </Button>
          </form>
        </SystemPanel>
      </div>
    </div>
  );
};

export default ResetPassword;
