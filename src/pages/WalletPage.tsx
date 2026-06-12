import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, PlayCircle, ChevronRight, Share2, Check, Users, Sparkles, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { BottomNav } from "@/components/BottomNav";
import { TransactionList, type WalletTransaction } from "@/components/TransactionList";
import { playSound } from "@/hooks/useSound";
import { toast } from "sonner";
import heroBanner from "@/assets/wallet-hero.jpg.asset.json";

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

  return (
    <div className="wallet-theme relative min-h-screen bg-[#03060d] pb-24 overflow-hidden">
      <Particles />

      {/* Integrated Hero Header — full bleed, no card chrome */}
      <section className="relative w-full -mt-px">
        <div className="relative h-[320px] w-full overflow-hidden">
          {/* Artwork */}
          <img
            src={heroBanner.url}
            alt="Hunt Play Dominate hunter"
            className="absolute inset-0 h-full w-full object-cover object-[center_18%] select-none"
            draggable={false}
          />
          {/* Atmospheric overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[#03060d]/60 to-[#03060d]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(190_100%_50%/0.28),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,hsl(210_100%_50%/0.25),transparent_55%)]" />
          <div className="absolute inset-0 mix-blend-overlay opacity-40 bg-[linear-gradient(180deg,transparent,hsl(190_100%_50%/0.15))]" />

          {/* Sticky-looking top bar floating over hero */}
          <div className="absolute inset-x-0 top-0 z-20">
            <div className="mx-auto flex max-w-md items-center gap-3 px-3 py-3">
              <button onClick={() => { playSound("tick"); navigate(-1); }} className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-black/50 text-primary backdrop-blur-md transition hover:bg-primary/15">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="mx-auto font-display text-xs font-bold uppercase tracking-[0.5em] text-primary text-glow-soft">Wallet</h1>
              <span className="w-9" />
            </div>
          </div>

          {/* Hero copy */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-7">
            <div className="mx-auto max-w-md">
              <div className="font-display font-black leading-[0.95] tracking-[0.05em]">
                <div className="text-3xl text-foreground/95" style={{ textShadow: "0 0 18px hsl(190 100% 50% / 0.55)" }}>HUNT.</div>
                <div className="text-3xl text-foreground/95" style={{ textShadow: "0 0 18px hsl(190 100% 50% / 0.55)" }}>PLAY.</div>
                <div className="text-4xl text-primary" style={{ textShadow: "0 0 22px hsl(var(--primary) / 0.85), 0 0 48px hsl(var(--primary) / 0.4)" }}>DOMINATE.</div>
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.4em] text-primary/80">Every match · Every coin counts</p>
            </div>
          </div>

          {/* Bottom blend edge */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#03060d]" />
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-10 max-w-md space-y-4 px-3">

        {/* Total Coins — premium glass focal card */}
        <section
          className="relative overflow-hidden rounded-3xl border border-primary/30 p-6 text-center backdrop-blur-2xl animate-float-up"
          style={{
            background: "linear-gradient(160deg, hsl(210 60% 12% / 0.65), hsl(220 50% 4% / 0.85))",
            boxShadow: "0 20px 60px -10px hsl(var(--primary) / 0.35), 0 0 0 1px hsl(var(--primary) / 0.15) inset, 0 0 40px hsl(var(--primary) / 0.18) inset",
          }}
        >
          {/* Glass reflections */}
          <div className="pointer-events-none absolute -top-20 -left-10 h-40 w-60 rotate-12 rounded-full bg-white/[0.04] blur-2xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.22),transparent_60%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-black/40 px-3 py-1 backdrop-blur-md">
              <Coins className="h-3 w-3 text-primary" />
              <p className="text-[9px] uppercase tracking-[0.4em] text-primary/90">Total Kira Coins</p>
            </div>
            <p
              className="mt-3 font-display text-[64px] font-black leading-none text-primary"
              style={{ textShadow: "0 0 26px hsl(var(--primary) / 0.85), 0 0 60px hsl(var(--primary) / 0.45)" }}
            >
              {coins}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Main Balance</p>

            <div className="mt-4 mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-primary/80" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/75">
                Bonus <span className="font-bold text-primary">{bonusCoins}</span>
              </span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => addCoins(30)}
            className="group relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-primary/45 font-display text-xs font-bold uppercase tracking-[0.25em] text-primary backdrop-blur-xl transition active:scale-[0.97]"
            style={{
              background: "linear-gradient(140deg, hsl(210 60% 14% / 0.55), hsl(220 50% 5% / 0.7))",
              boxShadow: "0 8px 24px -8px hsl(var(--primary) / 0.4), inset 0 0 14px hsl(var(--primary) / 0.08)",
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <Plus className="h-4 w-4 transition group-hover:rotate-90" /> Add Coins
          </button>
          <button
            onClick={() => go("/wallet/withdraw")}
            className="relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-primary/45 font-display text-xs font-bold uppercase tracking-[0.25em] text-primary backdrop-blur-xl transition active:scale-[0.97]"
            style={{
              background: "linear-gradient(140deg, hsl(210 60% 14% / 0.55), hsl(220 50% 5% / 0.7))",
              boxShadow: "0 8px 24px -8px hsl(var(--primary) / 0.4), inset 0 0 14px hsl(var(--primary) / 0.08)",
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <PlayCircle className="h-4 w-4" /> Withdraw
          </button>
        </section>

        {/* Referral — compact secondary card */}
        <section
          className="relative overflow-hidden rounded-2xl border border-primary/20 p-4 backdrop-blur-xl"
          style={{
            background: "linear-gradient(150deg, hsl(210 50% 10% / 0.55), hsl(220 50% 4% / 0.75))",
            boxShadow: "0 8px 28px -10px hsl(var(--primary) / 0.25), inset 0 0 18px hsl(var(--primary) / 0.04)",
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/45 bg-primary/10 text-primary"
              style={{ boxShadow: "0 0 14px hsl(var(--primary) / 0.35)" }}
            >
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-foreground">Invite Hunters</h3>
              <p className="text-[10px] text-muted-foreground">Reward: <span className="text-primary font-bold">+5 Bonus Coins</span></p>
            </div>
            <button
              onClick={inviteFriend}
              className="flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-primary transition hover:bg-primary/25 active:scale-95"
              style={{ boxShadow: "0 0 16px hsl(var(--primary) / 0.35)" }}
            >
              <Share2 className="h-3 w-3" /> Invite
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Friend Registers", "Joins 3 Tournaments", "Completes 5 Matches"].map((step, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-black/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] text-foreground/75 backdrop-blur-sm">
                <Check className="h-2.5 w-2.5 text-primary" /> {step}
              </span>
            ))}
          </div>

          <p className="mt-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 leading-relaxed">
            Bonus Coins cannot be withdrawn · Tournament entries only
          </p>
        </section>

        {/* History */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.35em] text-foreground/80">Transactions</h2>
            <button onClick={() => go("/wallet/history")} className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-primary transition hover:text-primary-glow">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div
            className="overflow-hidden rounded-2xl border border-primary/20 backdrop-blur-xl"
            style={{
              background: "linear-gradient(160deg, hsl(210 50% 10% / 0.55), hsl(220 50% 4% / 0.75))",
              boxShadow: "0 8px 24px -10px hsl(var(--primary) / 0.2), inset 0 0 14px hsl(var(--primary) / 0.04)",
            }}
          >
            <div className="px-3">
              <TransactionList items={transactions} />
            </div>
          </div>
        </section>

        <p className="pt-1 text-center text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
          All withdrawals reviewed by Admin
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
