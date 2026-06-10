import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, PlayCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { BottomNav } from "@/components/BottomNav";
import { TransactionList, type WalletTransaction } from "@/components/TransactionList";
import { playSound } from "@/hooks/useSound";
import { toast } from "sonner";

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins); });
    (supabase.from("transactions" as any) as any)
      .select("id,type,amount,message,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }: { data: WalletTransaction[] | null }) => setTransactions(data ?? []));
    const channel = supabase
      .channel(`wallet-balance-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload) => {
        setCoins((payload.new as { coins: number }).coins);
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

  return (
    <div className="wallet-theme relative min-h-screen bg-[#030007] pb-20 scanline">
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-3 px-3 py-2.5">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary transition hover:text-primary-glow"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.35em] text-primary text-glow-soft">Wallet</h1>
          <span className="w-5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-3 pt-5">
        {/* Balance */}
        <section className="relative overflow-hidden rounded-xl border border-primary/25 bg-[hsl(260,40%,6%)]/70 p-6 text-center animate-float-up backdrop-blur-md" style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.18), inset 0 0 24px hsl(var(--primary) / 0.04)" }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.12),transparent_70%)]" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Total Coins</p>
            <p className="mt-2 font-display text-5xl font-black text-primary" style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.7), 0 0 45px hsl(var(--primary) / 0.35), 0 0 80px hsl(var(--primary) / 0.15)" }}>
              {coins}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <button onClick={() => addCoins(30)} className="flex h-14 items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/5 font-display text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/10 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] active:scale-[0.97]">
            <Plus className="h-4 w-4" /> Add Coins
          </button>
          <button onClick={() => go("/wallet/withdraw")} className="flex h-14 items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/5 font-display text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/10 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] active:scale-[0.97]">
            <PlayCircle className="h-4 w-4" /> Withdraw
          </button>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/80">History</h2>
            <button onClick={() => go("/wallet/history")} className="flex items-center gap-1 text-xs text-primary transition hover:text-primary-glow">View All <ChevronRight className="h-3 w-3" /></button>
          </div>
          <div className="rounded-lg border border-primary/15 bg-[hsl(260,40%,5%)]/60 backdrop-blur-sm" style={{ boxShadow: "inset 0 0 12px hsl(var(--primary) / 0.03)" }}>
            <TransactionList items={transactions} />
          </div>
        </section>

        <p className="pt-2 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          All withdrawals reviewed by Admin
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
