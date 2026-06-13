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
import heroBanner from "@/assets/wallet-hero.jpg.asset.json";

/* Corner HUD bracket */
const Corner = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
  const base = "pointer-events-none absolute h-4 w-4 border-primary";
  const map = {
    tl: "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
    tr: "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
    bl: "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
    br: "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
  } as const;
  return <span className={`${base} ${map[pos]}`} style={{ boxShadow: "0 0 10px hsl(var(--primary) / 0.7)" }} />;
};

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

  const formattedCoins = coins.toLocaleString();

  return (
    <div className="wallet-theme relative min-h-screen bg-[#03060d] pb-24 overflow-hidden">
      <Particles />

      {/* HERO HEADER — full bleed, integrated */}
      <section className="relative w-full">
        <div className="relative h-[360px] w-full overflow-hidden">
          <img
            src={heroBanner.url}
            alt="Hunt Play Dominate"
            className="absolute inset-0 h-full w-full object-cover object-[60%_15%] select-none"
            draggable={false}
          />
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#03060d]/55 to-[#03060d]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(190_100%_50%/0.25),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,hsl(200_100%_55%/0.35),transparent_45%)]" />

          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 z-20">
            <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
              <button onClick={() => { playSound("tick"); navigate(-1); }} className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 bg-black/55 text-primary backdrop-blur-md transition hover:bg-primary/15">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="font-display text-sm font-bold uppercase tracking-[0.55em] text-primary" style={{ textShadow: "0 0 12px hsl(var(--primary) / 0.8)" }}>Wallet</h1>
              <button onClick={() => go("/wallet/history")} className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/50 bg-black/55 text-primary backdrop-blur-md transition hover:bg-primary/15">
                <ScrollText className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* HUNT PLAY DOMINATE */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-8">
            <div className="mx-auto max-w-md">
              <div className="font-display font-black leading-[0.95] tracking-[0.04em]">
                <div className="text-4xl text-foreground" style={{ textShadow: "0 0 18px hsl(190 100% 50% / 0.55)" }}>HUNT.</div>
                <div className="mt-1 text-4xl text-foreground" style={{ textShadow: "0 0 18px hsl(190 100% 50% / 0.55)" }}>PLAY.</div>
                <div className="mt-1 text-5xl text-primary" style={{ textShadow: "0 0 22px hsl(var(--primary) / 0.9), 0 0 50px hsl(var(--primary) / 0.45)" }}>DOMINATE.</div>
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-black/60 px-3 py-1.5 backdrop-blur-md">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/85">Every Match,</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Every Coin</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/65">Counts</span>
              </div>
            </div>
          </div>

          {/* Bottom blend */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#03060d]" />
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-md space-y-4 px-4 -mt-2">

        {/* TOTAL KIRA COINS — HUD card */}
        <section
          className="relative overflow-hidden rounded-2xl border border-primary/40 px-6 py-7 text-center backdrop-blur-2xl animate-float-up"
          style={{
            background: "linear-gradient(160deg, hsl(210 60% 11% / 0.7), hsl(220 55% 4% / 0.9))",
            boxShadow: "0 18px 50px -12px hsl(var(--primary) / 0.4), inset 0 0 30px hsl(var(--primary) / 0.12), 0 0 0 1px hsl(var(--primary) / 0.15) inset",
          }}
        >
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.18),transparent_60%)]" />

          <div className="relative">
            {/* Title with diamonds */}
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-6 bg-primary/60" />
              <span className="text-primary text-[10px]">◆</span>
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary/95">Total Kira Coins</p>
              <span className="text-primary text-[10px]">◆</span>
              <span className="h-px w-6 bg-primary/60" />
            </div>

            <p
              className="mt-4 font-display text-[58px] font-black leading-none text-foreground"
              style={{ textShadow: "0 0 28px hsl(var(--primary) / 0.9), 0 0 60px hsl(var(--primary) / 0.5)" }}
            >
              {formattedCoins}
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.45em] text-primary/80">Coins</p>

            <div className="mt-5 mx-auto inline-flex items-center gap-2 rounded-full border border-primary/40 bg-black/40 px-4 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/80">
                Bonus Coins: <span className="font-bold text-primary">{bonusCoins}</span>
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
              className="group relative flex h-14 items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-primary/45 font-display text-xs font-bold uppercase tracking-[0.25em] text-primary backdrop-blur-xl transition active:scale-[0.97]"
              style={{
                background: "linear-gradient(140deg, hsl(210 60% 13% / 0.6), hsl(220 50% 5% / 0.75))",
                boxShadow: "0 8px 22px -8px hsl(var(--primary) / 0.45), inset 0 0 14px hsl(var(--primary) / 0.1)",
              }}
            >
              <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/60 text-primary">
                <Icon className="h-3 w-3" />
              </span>
              {label}
            </button>
          ))}
        </section>

        {/* INVITE HUNTERS */}
        <section
          className="relative overflow-hidden rounded-2xl border border-primary/35 p-4 backdrop-blur-xl"
          style={{
            background: "linear-gradient(150deg, hsl(210 55% 11% / 0.6), hsl(220 50% 4% / 0.8))",
            boxShadow: "0 10px 30px -10px hsl(var(--primary) / 0.3), inset 0 0 18px hsl(var(--primary) / 0.06)",
          }}
        >
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/55 bg-primary/15 text-primary"
              style={{ boxShadow: "0 0 16px hsl(var(--primary) / 0.4), inset 0 0 10px hsl(var(--primary) / 0.2)" }}
            >
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base font-bold uppercase tracking-[0.18em] text-foreground" style={{ textShadow: "0 0 8px hsl(var(--primary) / 0.4)" }}>Invite Hunters</h3>
              <p className="text-[11px] text-muted-foreground">Invite a friend & earn <span className="text-primary font-bold">+5 Bonus Coins</span></p>
            </div>
            <button
              onClick={inviteFriend}
              className="flex items-center gap-1.5 rounded-lg border border-primary/55 bg-primary/10 px-3.5 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition hover:bg-primary/20 active:scale-95"
              style={{ boxShadow: "0 0 14px hsl(var(--primary) / 0.4), inset 0 0 8px hsl(var(--primary) / 0.15)" }}
            >
              <Share2 className="h-3.5 w-3.5" /> Invite
            </button>
          </div>

          {/* Progress steps */}
          <div
            className="mt-4 rounded-xl border border-primary/25 px-3 py-3"
            style={{ background: "hsl(220 55% 4% / 0.55)" }}
          >
            <div className="flex items-center justify-between gap-1">
              {[
                { n: 1, label: ["Friend", "Registers"], done: true },
                { n: 2, label: ["Joins", "3 Tournaments"], done: true },
                { n: 3, label: ["Completes", "5 Matches"], done: false },
              ].map((step, i, arr) => (
                <div key={step.n} className="flex flex-1 items-center">
                  <div className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border ${step.done ? "border-primary bg-primary/15 text-primary" : "border-primary/50 bg-black/40 text-primary/70"}`}
                      style={{ boxShadow: step.done ? "0 0 10px hsl(var(--primary) / 0.5)" : undefined }}
                    >
                      {step.done ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{step.n}</span>}
                    </div>
                    <div className="text-center leading-tight">
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-foreground/85">{step.label[0]}</p>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-foreground/85">{step.label[1]}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <ChevronRight className="mx-0.5 h-3 w-3 shrink-0 text-primary/60" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80 leading-relaxed">
            Bonus Coins cannot be withdrawn.<br />Usable only for selected tournament entries.
          </p>
        </section>

        {/* TRANSACTIONS */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.35em] text-foreground" style={{ textShadow: "0 0 8px hsl(var(--primary) / 0.4)" }}>Transactions</h2>
            <button onClick={() => go("/wallet/history")} className="flex items-center gap-1 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-primary transition hover:text-primary-glow">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div
            className="relative overflow-hidden rounded-2xl border border-primary/30 backdrop-blur-xl"
            style={{
              background: "linear-gradient(160deg, hsl(210 55% 10% / 0.55), hsl(220 50% 4% / 0.8))",
              boxShadow: "0 10px 26px -12px hsl(var(--primary) / 0.3), inset 0 0 16px hsl(var(--primary) / 0.06)",
            }}
          >
            <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
            <div className="px-4 py-1">
              <TransactionList items={transactions} />
            </div>
          </div>
        </section>

        <p className="pt-2 text-center text-[9px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          All withdrawals reviewed by Admin
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
