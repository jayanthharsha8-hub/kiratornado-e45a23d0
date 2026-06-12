import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, PlayCircle, ChevronRight, Share2, Check, Users, Sparkles } from "lucide-react";
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
    <div className="wallet-theme relative min-h-screen bg-[#050505] pb-24 scanline">
      <Particles />

      <header className="sticky top-0 z-30 border-b border-primary/25 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-3 px-3 py-2.5">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary transition hover:text-primary-glow">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.4em] text-primary text-glow-soft">Wallet</h1>
          <span className="w-5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-3 pt-4">
        {/* Hero Banner */}
        <section
          className="relative overflow-hidden rounded-2xl border border-primary/30 animate-float-up"
          style={{ boxShadow: "0 0 35px hsl(var(--primary) / 0.25), inset 0 0 30px hsl(var(--primary) / 0.05)" }}
        >
          <img
            src={heroBanner.url}
            alt="Hunt Play Dominate — Every match, every coin counts"
            className="block w-full h-auto select-none"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/20 rounded-2xl" />
        </section>

        {/* Balance */}
        <section
          className="relative overflow-hidden rounded-2xl border border-primary/25 bg-[hsl(210,45%,7%)]/70 p-6 text-center backdrop-blur-md"
          style={{ boxShadow: "0 0 32px hsl(var(--primary) / 0.20), inset 0 0 26px hsl(var(--primary) / 0.05)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.16),transparent_70%)]" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Total Coins</p>
            <p
              className="mt-2 font-display text-6xl font-black text-primary"
              style={{ textShadow: "0 0 22px hsl(var(--primary) / 0.75), 0 0 50px hsl(var(--primary) / 0.4), 0 0 90px hsl(var(--primary) / 0.18)" }}
            >
              {coins}
            </p>
            <div className="mt-4 mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/80">
                Bonus <span className="text-primary font-bold">{bonusCoins}</span>
              </span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => addCoins(30)}
            className="group flex h-14 items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/[0.06] font-display text-xs font-bold uppercase tracking-widest text-primary backdrop-blur-md transition hover:bg-primary/15 hover:shadow-[0_0_24px_hsl(var(--primary)/0.45)] active:scale-[0.97]"
          >
            <Plus className="h-4 w-4 transition group-hover:rotate-90" /> Add Coins
          </button>
          <button
            onClick={() => go("/wallet/withdraw")}
            className="flex h-14 items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/[0.06] font-display text-xs font-bold uppercase tracking-widest text-primary backdrop-blur-md transition hover:bg-primary/15 hover:shadow-[0_0_24px_hsl(var(--primary)/0.45)] active:scale-[0.97]"
          >
            <PlayCircle className="h-4 w-4" /> Withdraw
          </button>
        </section>

        {/* Referral Card */}
        <section
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-[hsl(210,45%,7%)]/70 p-5 backdrop-blur-md"
          style={{ boxShadow: "0 0 26px hsl(var(--primary) / 0.18), inset 0 0 20px hsl(var(--primary) / 0.04)" }}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.25),transparent_70%)]" />
          <div className="relative flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/50 bg-primary/10 text-primary"
              style={{ boxShadow: "0 0 18px hsl(var(--primary) / 0.4)" }}
            >
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-bold uppercase tracking-widest text-foreground text-glow-soft">Invite Hunters</h3>
              <p className="text-[11px] text-muted-foreground">
                Invite a friend and earn <span className="text-primary font-bold">+5 Bonus Coins</span>
              </p>
            </div>
          </div>

          <ul className="relative mt-4 space-y-2">
            {["Friend Registers", "Joins 3 Tournaments", "Completes 5 Matches"].map((step, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-primary/15 bg-black/30 px-3 py-2 backdrop-blur-sm">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/60 bg-primary/15 text-primary"
                  style={{ boxShadow: "0 0 10px hsl(var(--primary) / 0.45)" }}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/85">{step}</span>
              </li>
            ))}
          </ul>

          <div
            className="relative mt-4 rounded-xl border border-primary/40 bg-primary/[0.08] px-3 py-2.5 text-center backdrop-blur-sm"
            style={{ boxShadow: "inset 0 0 14px hsl(var(--primary) / 0.1)" }}
          >
            <p className="font-display text-sm font-black uppercase tracking-[0.25em] text-primary text-glow-soft">
              Reward: +5 Bonus Coins
            </p>
          </div>

          <button
            onClick={inviteFriend}
            className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/60 bg-primary/15 py-3 font-display text-xs font-bold uppercase tracking-[0.3em] text-primary transition hover:bg-primary/25 active:scale-[0.98]"
            style={{ boxShadow: "0 0 22px hsl(var(--primary) / 0.4), inset 0 0 12px hsl(var(--primary) / 0.08)" }}
          >
            <Share2 className="h-4 w-4" /> Invite Friend
          </button>

          <p className="relative mt-3 text-center text-[9px] uppercase tracking-[0.25em] text-muted-foreground/80 leading-relaxed">
            Bonus Coins cannot be withdrawn.<br />
            Usable only for selected tournament entries.
          </p>
        </section>

        {/* History */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/85">History</h2>
            <button onClick={() => go("/wallet/history")} className="flex items-center gap-1 text-xs text-primary transition hover:text-primary-glow">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div
            className="rounded-xl border border-primary/20 bg-[hsl(210,45%,7%)]/60 backdrop-blur-sm"
            style={{ boxShadow: "inset 0 0 14px hsl(var(--primary) / 0.05)" }}
          >
            <TransactionList items={transactions} />
          </div>
        </section>

        <p className="pt-1 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          All withdrawals reviewed by Admin
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
