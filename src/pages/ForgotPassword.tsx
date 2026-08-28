import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Enter your email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Password reset link sent to your email.");
  };

  return (
    <div className="relative min-h-screen px-4 py-10 scanline">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--gradient-glow)' }} />
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 pt-6">
          <Logo size={64} />
          <h1 className="font-display text-xl font-black uppercase tracking-[0.25em] text-primary text-glow">ZEOX</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">[ PASSWORD RECOVERY ]</p>
        </div>

        {!sent ? (
          <SystemPanel title="Reset Password">
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[11px] uppercase tracking-widest text-primary/80">Email Address</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hunter@gmail.com" className="border-primary/40 bg-input/60" />
              </div>
              <Button type="submit" disabled={loading} className="mt-2 h-12 w-full bg-primary font-display text-sm font-bold uppercase tracking-[0.3em] text-primary-foreground hover:bg-primary-glow animate-pulse-glow">
                {loading ? "Sending..." : "[ Send Reset Link ]"}
              </Button>
            </form>
          </SystemPanel>
        ) : (
          <SystemPanel title="Link Sent">
            <p className="text-sm text-foreground/85 text-center py-4">
              A password reset link has been sent to <span className="text-primary text-glow-soft">{email}</span>. Check your inbox and follow the link to reset your password.
            </p>
          </SystemPanel>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/login" className="text-primary text-glow-soft underline-offset-4 hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
