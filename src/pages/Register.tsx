import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { HeroLogo } from "@/components/HeroLogo";
import { AuthShell, GoogleIcon, Footer } from "@/pages/Login";
import { ChevronRight, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

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
      if (result.redirected) return;
      localStorage.setItem("userExists", "true");
      navigate("/home", { replace: true });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell>
      <HeroLogo size={200} className="mt-4" />

      <div className="mt-2 text-center">
        <h1 className="font-display text-[34px] leading-[1.05] font-extrabold tracking-tight">
          ENTER THE <span className="text-primary text-glow-soft">ARENA</span>
        </h1>
        <p className="mt-3 text-[10px] tracking-[0.42em] text-muted-foreground/70">
          COMPETE &nbsp;•&nbsp; WIN &nbsp;•&nbsp; CONQUER
        </p>
      </div>

      <div className="mt-9 space-y-3">
        <SlimCardButton
          icon={<GoogleIcon className="h-[22px] w-[22px]" />}
          title={googleLoading ? "Connecting..." : "Continue with Google"}
          subtitle="Instant • Secure • Auto-verified"
          onClick={onGoogle}
          disabled={googleLoading}
        />
        <SlimCardButton
          icon={<Mail className="h-[20px] w-[20px] text-primary/90" />}
          title="Sign up with Email"
          subtitle="Email OTP verification"
          onClick={() => navigate("/register/email")}
        />
      </div>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-primary/15" />
        <span className="text-[10px] font-medium tracking-[0.32em] text-muted-foreground/60">
          ALREADY A HUNTER?
        </span>
        <div className="h-px flex-1 bg-primary/15" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SlimSecondary icon={<Lock className="h-4 w-4 text-primary/90" />} label="Email Sign In" onClick={() => navigate("/login")} />
        <SlimSecondary icon={<GoogleIcon className="h-4 w-4" />} label="Google Sign In" onClick={onGoogle} />
      </div>

      <p className="mt-6 text-center text-[12px] text-muted-foreground/70">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary/90 hover:text-primary">Sign in</Link>
      </p>

      <Footer />
    </AuthShell>
  );
};

const SlimCardButton = ({
  icon, title, subtitle, onClick, disabled,
}: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="group relative flex w-full items-center gap-4 rounded-[6px] border border-primary/20 bg-card/30 px-4 py-3 text-left transition hover:border-primary/50 hover:bg-card/50 disabled:opacity-60"
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center">{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="text-[14px] font-semibold leading-tight text-foreground">{title}</div>
      <div className="mt-0.5 text-[11px] tracking-wide text-muted-foreground/70">{subtitle}</div>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition group-hover:text-primary" />
  </button>
);

const SlimSecondary = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-11 items-center justify-center gap-2 rounded-[6px] border border-primary/20 bg-card/20 text-[12.5px] font-medium text-foreground/90 transition hover:border-primary/50 hover:bg-card/40"
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Register;
