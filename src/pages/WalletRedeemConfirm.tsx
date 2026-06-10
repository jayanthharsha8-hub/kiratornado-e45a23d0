import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const genCode = () => {
  const seg = (n: number) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };
  return `${seg(5)}-${seg(5)}`;
};

const WalletRedeemConfirm = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const amount = Number(params.get("amount") || 0);
  const [coins, setCoins] = useState(0);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins); });
  }, [user]);

  const confirm = async () => {
    if (!user || !amount) return;
    if (coins < amount) { toast.error("Not enough coins. Earn more to withdraw."); return; }
    setBusy(true);
    const { error } = await (supabase.rpc as any)("request_withdrawal", {
      _amount: amount,
      _withdraw_type: "redeem",
      _upi_id: null,
      _upi_ref: genCode(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    playSound("pulse");
    setSuccess(true);
    setTimeout(() => navigate("/wallet"), 2600);
  };

  return (
    <div className="wallet-theme relative min-h-screen bg-[#030007] pb-24">
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2.5">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary transition hover:text-primary-glow"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.35em] text-primary text-glow-soft">Confirm</h1>
          <span className="w-5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 pt-10">
        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-[hsl(260,40%,7%)]/60 p-5 text-center backdrop-blur-md space-y-3" style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.15)" }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Coins Selected</p>
            <p className="font-display text-3xl font-black text-foreground">{amount}</p>
          </div>
          <div className="h-px bg-primary/20" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Converted Value</p>
            <p className="font-display text-3xl font-black text-primary text-glow-soft">₹{amount}</p>
          </div>
        </div>

        <button
          onClick={confirm}
          disabled={busy}
          className="w-full rounded-xl border border-primary/60 bg-primary/15 p-4 font-display text-sm font-bold uppercase tracking-[0.3em] text-primary transition hover:bg-primary/25 disabled:opacity-50"
          style={{ boxShadow: "0 0 28px hsl(var(--primary) / 0.45), inset 0 0 12px hsl(var(--primary) / 0.06)" }}
        >
          {busy ? "Processing..." : "Confirm Withdrawal"}
        </button>

        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Coins will be deducted instantly. Admin verifies within 3 hours.
        </p>
      </main>

      {/* Success overlay */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-float-up">
          <div className="mx-6 max-w-sm rounded-xl border border-primary/60 bg-[hsl(260,40%,7%)]/90 p-6 text-center backdrop-blur-md" style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.45), inset 0 0 20px hsl(var(--primary) / 0.05)" }}>
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" style={{ filter: "drop-shadow(0 0 14px hsl(var(--primary) / 0.7))" }} />
            <h2 className="mt-4 font-display text-lg font-bold uppercase tracking-widest text-primary text-glow-soft">Request Submitted</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Withdrawal request submitted successfully.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Admin will verify and process within 3 hours.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletRedeemConfirm;
