import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Particles } from "@/components/Particles";
import { TransactionList, type WalletTransaction } from "@/components/TransactionList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playSound } from "@/hooks/useSound";

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    if (!user) return;
    (supabase.from("transactions" as any) as any)
      .select("id,type,amount,message,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: WalletTransaction[] | null }) => setItems(data ?? []));
  }, [user]);

  return (
    <div className="wallet-theme relative min-h-screen bg-[#020617] pb-8 scanline">
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-3 px-3 py-2.5">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary transition hover:text-primary-glow"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.35em] text-primary text-glow-soft">History</h1>
          <span className="w-5" />
        </div>
      </header>
      <main className="mx-auto max-w-md px-3 pt-4">
        <div className="rounded-lg border border-primary/15 bg-[hsl(210,40%,6%)]/60 backdrop-blur-sm" style={{ boxShadow: "inset 0 0 12px hsl(var(--primary) / 0.03)" }}>
          <TransactionList items={items} />
        </div>
      </main>
    </div>
  );
};

export default TransactionHistory;
