import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Enter email and password"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setLoading(false); toast.error("Invalid credentials"); return; }
    setLoading(false);
    toast.success("Welcome back, Hunter.");
    localStorage.setItem("userExists", "true");
    navigate("/home", { replace: true });
  };

  return (
    <div className="relative min-h-screen px-4 py-10 scanline">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--gradient-glow)' }} />
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 pt-6">
          <Logo size={72} />
          <h1 className="font-display text-xl font-black uppercase tracking-[0.25em] text-primary text-glow">KIRA TORNADO</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">[ SYSTEM LOGIN ]</p>
        </div>

        <SystemPanel title="Authenticate">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[11px] uppercase tracking-widest text-primary/80">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hunter@gmail.com" className="border-primary/40 bg-input/60" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] uppercase tracking-widest text-primary/80">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-primary/40 bg-input/60" />
            </div>
            <Button type="submit" disabled={loading} className="mt-2 h-12 w-full bg-primary font-display text-sm font-bold uppercase tracking-[0.3em] text-primary-foreground hover:bg-primary-glow animate-pulse-glow">
              {loading ? "Logging in..." : "[ Enter ]"}
            </Button>
          </form>
          <div className="mt-3 text-center">
            <Link to="/forgot-password" className="text-xs text-primary text-glow-soft underline-offset-4 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </SystemPanel>

        <p className="text-center text-xs text-muted-foreground">
          New hunter? <Link to="/register" className="text-primary text-glow-soft underline-offset-4 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
