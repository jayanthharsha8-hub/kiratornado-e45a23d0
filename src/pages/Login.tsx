import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HeroLogo } from "@/components/HeroLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ChevronRight, ShieldCheck } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Enter email and password"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { toast.error("Invalid credentials"); return; }
    toast.success("Welcome back, Hunter.");
    localStorage.setItem("userExists", "true");
    navigate("/home", { replace: true });
  };

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/home` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Cyber grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(199 100% 60% / 1) 1px, transparent 1px), linear-gradient(90deg, hsl(199 100% 60% / 1) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, #000 40%, transparent 80%)",
        }}
      />
      {/* Bottom corner brackets */}
      <CornerBrackets />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-6">
        <HeroLogo size={260} className="mt-2" />

        <div className="mt-2 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome Back, <span className="text-primary text-glow">Hunter</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Log in to continue your journey</p>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <NeonField icon={<Mail className="h-5 w-5" />}>
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or Player ID"
              className="h-14 border-0 bg-transparent pl-12 text-base placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </NeonField>

          <NeonField icon={<Lock className="h-5 w-5" />}>
            <Input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-14 border-0 bg-transparent pl-12 pr-12 text-base placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-primary"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </NeonField>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-semibold text-primary text-glow-soft hover:underline">
              Forgot Password?
            </Link>
          </div>

          <NeonButton type="submit" disabled={loading} loading={loading}>
            {loading ? "Signing in..." : "LOG IN"}
          </NeonButton>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
          <span className="text-xs font-semibold tracking-[0.3em] text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          className="group relative flex h-14 w-full items-center gap-4 rounded-sm border border-primary/40 bg-card/60 px-4 text-left transition hover:border-primary hover:shadow-[0_0_18px_hsl(var(--primary)/0.35)]"
        >
          <GoogleIcon className="h-6 w-6" />
          <span className="font-display text-base font-semibold tracking-wide text-foreground">Continue with Google</span>
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-primary" />
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary text-glow-soft hover:underline">Sign up</Link>
        </p>

        <Footer />
      </div>
    </div>
  );
};

/* ---------- shared bits ---------- */

export const NeonField = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="relative rounded-sm border border-primary/40 bg-card/60 transition focus-within:border-primary focus-within:shadow-[0_0_16px_hsl(var(--primary)/0.35)]">
    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary/80">{icon}</span>
    {children}
  </div>
);

export const NeonButton = ({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
  <button
    {...props}
    className="group relative h-14 w-full overflow-hidden rounded-sm border border-primary bg-primary/10 font-display text-base font-bold tracking-[0.4em] text-primary text-glow transition hover:bg-primary/15"
    style={{ boxShadow: "0 0 0 1px hsl(var(--primary) / 0.6), 0 0 22px hsl(var(--primary) / 0.45), inset 0 0 16px hsl(var(--primary) / 0.18)" }}
  >
    {/* Corner cuts */}
    <span className="pointer-events-none absolute left-1 top-1 h-3 w-3 border-l-2 border-t-2 border-primary" />
    <span className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-primary" />
    <span className="relative">{children}</span>
  </button>
);

export const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.8 29 5 24 5 16.3 5 9.7 9.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 43c5 0 9.5-1.7 13-4.6l-6-5c-2 1.4-4.4 2.1-7 2.1-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 38.6 16.2 43 24 43z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6 5C40.9 35.6 44 30.3 44 24c0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

export const CornerBrackets = () => (
  <>
    <span aria-hidden className="pointer-events-none fixed bottom-3 left-3 h-10 w-16 border-b-2 border-l-2 border-primary/70" style={{ boxShadow: "0 0 14px hsl(var(--primary)/0.45)" }} />
    <span aria-hidden className="pointer-events-none fixed bottom-3 right-3 h-10 w-16 border-b-2 border-r-2 border-primary/70" style={{ boxShadow: "0 0 14px hsl(var(--primary)/0.45)" }} />
  </>
);

export const Footer = () => (
  <div className="mt-auto pt-8">
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <ShieldCheck className="h-4 w-4 text-primary" />
      <span>Secure • Fair • Anti-Cheat</span>
    </div>
    <p className="mt-3 text-center text-xs text-muted-foreground">
      By continuing you agree to our{" "}
      <a href="#" className="text-primary hover:underline">Terms</a> &{" "}
      <a href="#" className="text-primary hover:underline">Privacy Policy</a>
    </p>
  </div>
);

export default Login;
