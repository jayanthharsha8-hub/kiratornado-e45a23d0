import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HeroLogo } from "@/components/HeroLogo";
import { GoogleIcon, CornerBrackets, Footer } from "@/pages/Login";
import { ChevronRight, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/home` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
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
      <CornerBrackets />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-6">
        <HeroLogo size={260} className="mt-2" />

        <div className="mt-1 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Enter the <span className="text-primary text-glow">Arena</span>
          </h1>
          <p className="mt-2 text-sm tracking-wider text-muted-foreground">Compete • Win • Conquer</p>
        </div>

        <div className="mt-8 space-y-4">
          <PrimaryCardButton
            icon={<GoogleIcon className="h-7 w-7" />}
            title="Continue with Google"
            subtitle="Instant • Secure • Auto-verified"
            onClick={onGoogle}
          />
          <PrimaryCardButton
            icon={<Mail className="h-7 w-7 text-primary" />}
            title="Sign up with Email"
            subtitle="Email OTP verification"
            onClick={() => navigate("/register/email")}
          />
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary text-glow-soft hover:underline">Sign in</Link>
          </p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SecondaryButton icon={<Lock className="h-5 w-5 text-primary" />} label="Email Sign In" onClick={() => navigate("/login")} />
          <SecondaryButton icon={<GoogleIcon className="h-5 w-5" />} label="Google Sign In" onClick={onGoogle} />
        </div>

        <Footer />
      </div>
    </div>
  );
};

const PrimaryCardButton = ({
  icon, title, subtitle, onClick,
}: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative flex w-full items-center gap-4 rounded-sm border border-primary/45 bg-card/60 px-4 py-4 text-left transition hover:border-primary hover:shadow-[0_0_22px_hsl(var(--primary)/0.4)]"
    style={{ boxShadow: "inset 0 0 18px hsl(var(--primary)/0.08)" }}
  >
    <div className="flex h-11 w-11 shrink-0 items-center justify-center">{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="font-display text-base font-semibold leading-tight">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
    </div>
    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
  </button>
);

const SecondaryButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-14 items-center justify-center gap-2 rounded-sm border border-primary/40 bg-card/50 text-sm font-semibold text-foreground transition hover:border-primary hover:shadow-[0_0_16px_hsl(var(--primary)/0.35)]"
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Register;
