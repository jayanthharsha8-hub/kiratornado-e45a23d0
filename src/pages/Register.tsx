import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { HeroLogo } from "@/components/HeroLogo";
import { AuthShell, GoogleIcon, Footer, Divider } from "@/pages/Login";
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
      <HeroLogo size={240} className="mt-2" />

      <div className="mt-1 text-center">
        <h1 className="font-display text-[28px] font-bold tracking-tight">
          Enter the <span className="text-primary text-glow">Arena</span>
        </h1>
        <p className="mt-1.5 text-[12px] tracking-[0.18em] text-muted-foreground/90">COMPETE • WIN • CONQUER</p>
      </div>

      <div className="mt-7 space-y-3.5">
        <PrimaryCardButton
          icon={<GoogleIcon className="h-7 w-7" />}
          title={googleLoading ? "Connecting..." : "Continue with Google"}
          subtitle="Instant • Secure • Auto-verified"
          onClick={onGoogle}
          disabled={googleLoading}
        />
        <PrimaryCardButton
          icon={<Mail className="h-6 w-6 text-primary" />}
          title="Sign up with Email"
          subtitle="Email OTP verification"
          onClick={() => navigate("/register/email")}
        />
      </div>

      <Divider label="ALREADY A HUNTER?" />

      <div className="grid grid-cols-2 gap-3">
        <SecondaryButton icon={<Lock className="h-[18px] w-[18px] text-primary" />} label="Email Sign In" onClick={() => navigate("/login")} />
        <SecondaryButton icon={<GoogleIcon className="h-[18px] w-[18px]" />} label="Google Sign In" onClick={onGoogle} />
      </div>

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary text-glow-soft hover:underline">Sign in</Link>
      </p>

      <Footer />
    </AuthShell>
  );
};

const PrimaryCardButton = ({
  icon, title, subtitle, onClick, disabled,
}: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="group relative flex w-full items-center gap-4 rounded-[3px] border border-primary/30 bg-card/50 px-4 py-3.5 text-left transition hover:border-primary/70 hover:bg-card/80 disabled:opacity-60"
    style={{ boxShadow: "inset 0 0 14px hsl(var(--primary)/0.06)" }}
  >
    <div className="flex h-10 w-10 shrink-0 items-center justify-center">{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="font-display text-[15px] font-semibold leading-tight">{title}</div>
      <div className="mt-0.5 text-[12px] text-muted-foreground/85">{subtitle}</div>
    </div>
    <ChevronRight className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary" />
  </button>
);

const SecondaryButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-12 items-center justify-center gap-2 rounded-[3px] border border-primary/30 bg-card/40 text-[13px] font-semibold text-foreground transition hover:border-primary/70 hover:bg-card/70"
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Register;
