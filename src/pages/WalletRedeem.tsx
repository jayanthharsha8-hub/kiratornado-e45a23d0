import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";

const AMOUNTS = [30, 50, 100];

const WalletRedeem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins); });
  }, [user]);

  const next = () => {
    if (selected == null) return;
    playSound("pulse");
    navigate(`/wallet/redeem/confirm?amount=${selected}`);
  };

  return (
    <div className="wallet-theme relative min-h-screen bg-[#020617] pb-24">
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2.5">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary transition hover:text-primary-glow"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.35em] text-primary text-glow-soft">Redeem Code</h1>
          <span className="w-5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-4 pt-8">
        <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-[hsl(210,45%,7%)]/70 p-5 text-center backdrop-blur-md" style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.18), inset 0 0 24px hsl(var(--primary) / 0.04)" }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.12),transparent_70%)]" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Available</p>
            <p className="mt-1 font-display text-3xl font-black text-primary text-glow-soft">{coins} <span className="text-sm tracking-widest">COINS</span></p>
          </div>
        </div>

        <section>
          <h2 className="mb-4 text-center font-display text-xs font-bold uppercase tracking-[0.35em] text-foreground/80">Select Amount</h2>
          <div className="grid grid-cols-3 gap-3">
            {AMOUNTS.map(a => {
              const locked = coins < a;
              const active = selected === a;
              return (
                <button
                  key={a}
                  disabled={locked}
                  onClick={() => { playSound("tick"); setSelected(a); }}
                  className={`aspect-square rounded-xl border font-display text-2xl font-black uppercase transition ${
                    locked
                      ? "border-muted/30 bg-[hsl(210,45%,7%)]/30 text-muted-foreground/40"
                      : active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-primary/40 bg-[hsl(210,45%,8%)]/60 text-foreground hover:border-primary"
                  }`}
                  style={active ? { boxShadow: "0 0 24px hsl(var(--primary) / 0.55), inset 0 0 12px hsl(var(--primary) / 0.08)" } : undefined}
                >
                  {a}
                </button>
              );
            })}
          </div>
          {coins < 30 && (
            <p className="mt-4 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
              Earn more coins to unlock withdrawal
            </p>
          )}
        </section>

        <button
          onClick={next}
          disabled={selected == null}
          className="w-full rounded-xl border border-primary/60 bg-primary/15 p-4 font-display text-sm font-bold uppercase tracking-[0.3em] text-primary transition hover:bg-primary/25 disabled:opacity-40"
          style={selected != null ? { boxShadow: "0 0 28px hsl(var(--primary) / 0.5), inset 0 0 12px hsl(var(--primary) / 0.06)" } : undefined}
        >
          Next
        </button>
      </main>
    </div>
  );
};

export default WalletRedeem;
