import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { HeroLogo } from "@/components/HeroLogo";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ChevronRight, ShieldCheck } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Enter email and password"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { toast.error("Invalid email or password"); return; }
    toast.success("Welcome back, Hunter.");
    localStorage.setItem("userExists", "true");
    navigate("/home", { replace: true });
  };

  const onGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/home`,
      });
      if (result.error) {
        toast.error("Could not sign in with Google. Please try again.");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return; // browser redirects
      localStorage.setItem("userExists", "true");
      toast.success("Welcome, Hunter.");
      navigate("/home", { replace: true });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell>
      <HeroLogo size={240} className="mt-2" />

      <div className="mt-1 text-center">
        <h1 className="font-display text-[28px] font-bold tracking-tight">
          Welcome Back, <span className="text-primary text-glow">Hunter</span>
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">Log in to continue your journey</p>
      </div>

      <form onSubmit={onSubmit} className="mt-7 space-y-3.5">
        <NeonField icon={<Mail className="h-[18px] w-[18px]" />}>
          <Input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email or Player ID"
            className="h-13 border-0 bg-transparent pl-12 text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </NeonField>

        <NeonField icon={<Lock className="h-[18px] w-[18px]" />}>
          <Input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-13 border-0 bg-transparent pl-12 pr-12 text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-primary"
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </NeonField>

        <div className="flex justify-end pt-0.5">
          <Link to="/forgot-password" className="text-[13px] font-semibold text-primary text-glow-soft hover:underline">
            Forgot Password?
          </Link>
        </div>

        <NeonButton type="submit" disabled={loading}>
          {loading ? "SIGNING IN..." : "LOG IN"}
        </NeonButton>
      </form>

      <Divider label="OR" />

      <button
        type="button"
        onClick={onGoogle}
        disabled={googleLoading}
        className="group relative flex h-13 w-full items-center gap-4 rounded-[3px] border border-primary/30 bg-card/50 px-4 text-left transition hover:border-primary/70 hover:bg-card/80 disabled:opacity-60"
      >
        <GoogleIcon className="h-[22px] w-[22px]" />
        <span className="font-display text-[14px] font-semibold tracking-wide text-foreground">
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </span>
        <ChevronRight className="ml-auto h-[18px] w-[18px] text-muted-foreground group-hover:text-primary" />
      </button>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold text-primary text-glow-soft hover:underline">Sign up</Link>
      </p>

      <Footer />
    </AuthShell>
  );
};

/* ---------- shared bits ---------- */

export const AuthShell = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen overflow-hidden bg-black text-foreground">
    {/* subtle cyber grid */}
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-[0.05]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(199 100% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(199 100% 60%) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse at center, #000 35%, transparent 80%)",
      }}
    />
    {/* faint top vignette */}
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80 opacity-50"
      style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(199 100% 35% / 0.18), transparent 70%)" }}
    />
    <CornerFrame />
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-8 pt-6">
      {children}
    </div>
  </div>
);

export const NeonField = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="relative rounded-[3px] border border-primary/30 bg-card/50 transition focus-within:border-primary/80 focus-within:shadow-[0_0_12px_hsl(var(--primary)/0.25)]">
    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary/80">{icon}</span>
    {children}
  </div>
);

export const NeonButton = ({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className="group relative h-13 w-full overflow-hidden rounded-[3px] border border-primary/80 bg-primary/[0.06] font-display text-[14px] font-bold tracking-[0.32em] text-primary text-glow transition hover:bg-primary/[0.1] disabled:opacity-60"
    style={{ boxShadow: "0 0 0 1px hsl(var(--primary) / 0.45), 0 0 16px hsl(var(--primary) / 0.28), inset 0 0 12px hsl(var(--primary) / 0.1)" }}
  >
    <span className="pointer-events-none absolute left-1 top-1 h-2.5 w-2.5 border-l-[1.5px] border-t-[1.5px] border-primary" />
    <span className="pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 border-b-[1.5px] border-r-[1.5px] border-primary" />
    <span className="relative">{children}</span>
  </button>
);

export const Divider = ({ label }: { label: string }) => (
  <div className="my-5 flex items-center gap-3">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
    <span className="text-[11px] font-semibold tracking-[0.32em] text-muted-foreground/80">{label}</span>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
  </div>
);

export const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.8 29 5 24 5 16.3 5 9.7 9.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 43c5 0 9.5-1.7 13-4.6l-6-5c-2 1.4-4.4 2.1-7 2.1-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 38.6 16.2 43 24 43z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6 5C40.9 35.6 44 30.3 44 24c0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

export const CornerFrame = () => (
  <svg
    aria-hidden
    className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 w-full"
    viewBox="0 0 400 80"
    preserveAspectRatio="none"
    style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))" }}
  >
    <g fill="none" stroke="hsl(199 100% 60%)" strokeWidth="1.2" opacity="0.85">
      {/* left corner */}
      <polyline points="0,40 30,40 50,60 130,60" />
      <polyline points="0,55 22,55 38,72 130,72" />
      {/* right corner */}
      <polyline points="400,40 370,40 350,60 270,60" />
      <polyline points="400,55 378,55 362,72 270,72" />
    </g>
  </svg>
);

export const Footer = () => (
  <div className="mt-auto pt-8">
    <div className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
      <ShieldCheck className="h-4 w-4 text-primary" />
      <span>Secure • Fair • Anti-Cheat</span>
    </div>
    <p className="mt-2 text-center text-[11px] text-muted-foreground/80">
      By continuing you agree to our{" "}
      <a href="#" className="text-primary hover:underline">Terms</a> &{" "}
      <a href="#" className="text-primary hover:underline">Privacy Policy</a>
    </p>
  </div>
);

export default Login;
