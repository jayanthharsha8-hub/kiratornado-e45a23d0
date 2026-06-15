import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gift, Send, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";

const WalletWithdraw = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins); });
  }, [user]);

  const go = (path: string) => { playSound("tick"); navigate(path); };

  return (
    <div className="wallet-theme relative min-h-screen bg-[#020617] pb-24">
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2.5">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary transition hover:text-primary-glow"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.35em] text-primary text-glow-soft">Withdraw</h1>
          <span className="w-5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-4 pt-8">
        <section className="relative overflow-hidden rounded-xl border border-primary/25 bg-[hsl(210,45%,7%)]/70 p-6 text-center animate-float-up backdrop-blur-md" style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.18), inset 0 0 24px hsl(var(--primary) / 0.04)" }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.12),transparent_70%)]" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Available</p>
            <p className="mt-2 font-display text-5xl font-black text-primary" style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.7), 0 0 45px hsl(var(--primary) / 0.35), 0 0 80px hsl(var(--primary) / 0.15)" }}>
              {coins}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">coins</p>
          </div>
        </section>

        <section className="space-y-3">
          <button
            onClick={() => go("/wallet/redeem")}
            className="flex w-full items-center gap-4 rounded-xl border border-primary/30 bg-[hsl(210,45%,8%)]/60 p-4 text-left backdrop-blur-sm transition hover:border-primary/60 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary" style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.2)" }}>
              <Gift className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-foreground">Redeem Code</p>
              <p className="text-[11px] text-muted-foreground">Generate a redeem code</p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary/70" />
          </button>

          <button
            onClick={() => go("/wallet/upi")}
            className="flex w-full items-center gap-4 rounded-xl border border-primary/30 bg-[hsl(210,45%,8%)]/60 p-4 text-left backdrop-blur-sm transition hover:border-primary/60 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary" style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.2)" }}>
              <Send className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-foreground">UPI Withdraw</p>
              <p className="text-[11px] text-muted-foreground">Send to your UPI ID</p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary/70" />
          </button>
        </section>
      </main>
    </div>
  );
};

export default WalletWithdraw;
