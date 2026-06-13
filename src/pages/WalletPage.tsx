import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, ChevronRight, Share2, Check, Users, Sparkles, ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { BottomNav } from "@/components/BottomNav";
import { TransactionList, type WalletTransaction } from "@/components/TransactionList";
import { playSound } from "@/hooks/useSound";
import { toast } from "sonner";
import heroBanner from "@/assets/wallet-hero-banner.jpg";

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [bonusCoins, setBonusCoins] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins,bonus_coins" as any).eq("id", user.id).maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setCoins(data.coins ?? 0);
          setBonusCoins(data.bonus_coins ?? 0);
        }
      });
    (supabase.from("transactions" as any) as any)
      .select("id,type,amount,message,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }: { data: WalletTransaction[] | null }) => setTransactions(data ?? []));
    const channel = supabase
      .channel(`wallet-balance-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload) => {
        const n = payload.new as { coins: number; bonus_coins?: number };
        setCoins(n.coins);
        if (typeof n.bonus_coins === "number") setBonusCoins(n.bonus_coins);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const go = (path: string) => { playSound("tick"); navigate(path); };

  const addCoins = async (amount: number) => {
    if (!user) return;
    playSound("tick");
    const { error } = await supabase.from("wallet_requests").insert({ user_id: user.id, type: "add", amount });
    if (error) { toast.error(error.message); return; }
    toast.success("Coin request sent to admin");
  };

  const inviteFriend = async () => {
    playSound("tick");
    const link = `${window.location.origin}/register?ref=${user?.id ?? ""}`;
    const text = "Join me on Kira Tornado — Hunt. Play. Dominate.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Kira Tornado", text, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Invite link copied");
      }
    } catch { /* user cancelled */ }
  };

  // Soft frosted glass card — no brackets, no HUD chrome
  const glassCard =
    "relative overflow-hidden rounded-3xl border border-primary/20 backdrop-blur-2xl";
  const glassStyle = {
    background: "linear-gradient(160deg, hsl(210 50% 12% / 0.55), hsl(220 45% 5% / 0.75))",
    boxShadow:
      "0 20px 50px -20px hsl(var(--primary) / 0.35), 0 0 0 1px hsl(var(--primary) / 0.08) inset, 0 0 40px -10px hsl(var(--primary) / 0.15)",
  } as const;

  const formattedCoins = coins.toLocaleString();

  return (
    <div className="wallet-theme relative min-h-screen bg-[#03060d] pb-24 overflow-hidden">
      <Particles />

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
          <button
            onClick={() => { playSound("tick"); navigate(-1); }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-foreground backdrop-blur-md transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-sm font-bold uppercase tracking-[0.45em] text-foreground/95" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}>
            Wallet
          </h1>
          <button
            onClick={() => go("/wallet/history")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-foreground backdrop-blur-md transition hover:bg-white/10"
          >
            <ScrollText className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* HERO BANNER — full width, full artwork visible */}
      <section className="relative w-full">
        <div className="relative h-[300px] w-full overflow-hidden">
          <img
            src={heroBanner}
            alt="Hunt. Play. Dominate."
            className="absolute inset-0 h-full w-full object-cover object-center select-none"
            draggable={false}
          />
          {/* Soft bottom blend only */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#03060d]" />
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-md space-y-4 px-4 -mt-6">

        {/* TOTAL KIRA COINS */}
        <section className={`${glassCard} px-6 py-7 text-center animate-float-up`} style={glassStyle}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,hsl(var(--primary)/0.18),transparent_65%)]" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/90">
              Total Kira Coins
            </p>
            <p
              className="mt-4 font-display text-[60px] font-black leading-none text-foreground"
              style={{ textShadow: "0 0 26px hsl(var(--primary) / 0.85), 0 0 60px hsl(var(--primary) / 0.4)" }}
            >
              {formattedCoins}
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-foreground/55">Coins</p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white/[0.03] px-4 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/75">
                Bonus: <span className="font-bold text-primary">{bonusCoins}</span>
              </span>
            </div>
          </div>
        </section>

        {/* ACTIONS */}
        <section className="grid grid-cols-2 gap-3">
          {[
            { label: "Add Coins", icon: Plus, onClick: () => addCoins(30) },
            { label: "Withdraw", icon: RefreshCw, onClick: () => go("/wallet/withdraw") },
          ].map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="group relative flex h-14 items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-primary/25 font-display text-xs font-bold uppercase tracking-[0.25em] text-primary backdrop-blur-xl transition active:scale-[0.97]"
              style={{
                background: "linear-gradient(140deg, hsl(210 55% 13% / 0.55), hsl(220 45% 5% / 0.75))",
                boxShadow: "0 10px 28px -12px hsl(var(--primary) / 0.45), 0 0 0 1px hsl(var(--primary) / 0.08) inset",
              }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon className="h-3.5 w-3.5" />
              </span>
              {label}
            </button>
          ))}
        </section>

        {/* INVITE HUNTERS */}
        <section className={`${glassCard} p-4`} style={glassStyle}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary"
              style={{ boxShadow: "0 0 18px hsl(var(--primary) / 0.35)" }}
            >
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base font-bold tracking-[0.04em] text-foreground">Invite Hunters</h3>
              <p className="text-[11px] text-muted-foreground">Earn <span className="text-primary font-semibold">+5 Bonus Coins</span> per friend</p>
            </div>
            <button
              onClick={inviteFriend}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground transition hover:opacity-90 active:scale-95"
              style={{ boxShadow: "0 0 18px hsl(var(--primary) / 0.55)" }}
            >
              <Share2 className="h-3.5 w-3.5" /> Invite
            </button>
          </div>

          {/* Progress steps */}
          <div className="mt-4 rounded-2xl border border-white/5 bg-black/30 px-3 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-1">
              {[
                { n: 1, label: ["Friend", "Registers"], done: true },
                { n: 2, label: ["Joins", "3 Tournaments"], done: true },
                { n: 3, label: ["Completes", "5 Matches"], done: false },
              ].map((step, i, arr) => (
                <div key={step.n} className="flex flex-1 items-center">
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${step.done ? "bg-primary/20 text-primary border border-primary/50" : "bg-white/[0.04] text-foreground/55 border border-white/10"}`}
                      style={step.done ? { boxShadow: "0 0 12px hsl(var(--primary) / 0.5)" } : undefined}
                    >
                      {step.done ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{step.n}</span>}
                    </div>
                    <div className="text-center leading-tight">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-foreground/80">{step.label[0]}</p>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-foreground/80">{step.label[1]}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <ChevronRight className="mx-0.5 h-3 w-3 shrink-0 text-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
            Bonus Coins are non-withdrawable · Use in select tournaments
          </p>
        </section>

        {/* TRANSACTIONS */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.3em] text-foreground">Transactions</h2>
            <button onClick={() => go("/wallet/history")} className="flex items-center gap-1 font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-primary transition hover:text-primary-glow">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className={`${glassCard}`} style={glassStyle}>
            <div className="px-4 py-1">
              <TransactionList items={transactions} />
            </div>
          </div>
        </section>

        <p className="pt-2 text-center text-[9px] font-medium uppercase tracking-[0.3em] text-muted-foreground/70">
          All withdrawals reviewed by Admin
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
