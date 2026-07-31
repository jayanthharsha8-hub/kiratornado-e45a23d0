import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, RefreshCw, ChevronRight, Share2, Check, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { BottomNav } from "@/components/BottomNav";
import { TransactionList, type WalletTransaction } from "@/components/TransactionList";
import { playSound } from "@/hooks/useSound";
import { toast } from "sonner";
import heroBanner from "@/assets/wallet-hero-master.jpg.asset.json";

/* Cyber frame with neon corner brackets — used for wallet card, buttons, invite & transactions */
const CyberFrame = ({ children, className = "", padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) => (
  <div
    className={`relative ${className}`}
    style={{
      background: "linear-gradient(160deg, rgba(7,18,42,0.85), rgba(2,6,23,0.92))",
      border: "1px solid rgba(0,217,255,0.35)",
      borderRadius: 14,
      boxShadow:
        "0 0 0 1px rgba(110,91,255,0.12) inset, 0 0 28px -8px rgba(0,217,255,0.35), 0 0 60px -20px rgba(110,91,255,0.4) inset",
    }}
  >
    {/* Neon corner brackets */}
    {[
      "top-0 left-0 border-l-2 border-t-2 rounded-tl-[14px]",
      "top-0 right-0 border-r-2 border-t-2 rounded-tr-[14px]",
      "bottom-0 left-0 border-l-2 border-b-2 rounded-bl-[14px]",
      "bottom-0 right-0 border-r-2 border-b-2 rounded-br-[14px]",
    ].map((pos, i) => (
      <span
        key={i}
        className={`pointer-events-none absolute ${pos} h-4 w-4`}
        style={{ borderColor: "#00D9FF", filter: "drop-shadow(0 0 4px #00D9FF)" }}
      />
    ))}
    <div className={`${padded ? "p-3" : ""} h-full w-full`}>{children}</div>
  </div>
);

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [bonusCoins, setBonusCoins] = useState(0);
  const [brTokens, setBrTokens] = useState(0);
  const [coupons, setCoupons] = useState<{ id: string; discount_percent: number }[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins,bonus_coins,br_tokens" as any).eq("id", user.id).maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setCoins(data.coins ?? 0);
          setBonusCoins(data.bonus_coins ?? 0);
          setBrTokens(data.br_tokens ?? 0);
        }
      });
    (supabase.from("user_coupons" as any) as any)
      .select("id,discount_percent")
      .eq("user_id", user.id)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setCoupons(data ?? []));
    (supabase.from("transactions" as any) as any)
      .select("id,type,amount,message,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }: { data: WalletTransaction[] | null }) => setTransactions(data ?? []));

    const channel = supabase
      .channel(`wallet-balance-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload) => {
        const n = payload.new as { coins: number; bonus_coins?: number; br_tokens?: number };
        setCoins(n.coins);
        if (typeof n.bonus_coins === "number") setBonusCoins(n.bonus_coins);
        if (typeof n.br_tokens === "number") setBrTokens(n.br_tokens);

      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const go = (path: string) => { playSound("tick"); navigate(path); };


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
    <div className="wallet-theme relative min-h-screen bg-[#020617] pb-20 overflow-hidden">
      <Particles />

      {/* HERO BANNER — edge-to-edge, header overlays artwork */}
      <section className="relative w-full">
        <div className="relative w-full" style={{ background: "linear-gradient(180deg, #03102a 0%, #020617 100%)" }}>
          <img
            src={heroBanner.url}
            alt="Hunt. Play. Dominate. — Every match, every coin counts."
            className="block w-full h-auto select-none"
            draggable={false}
          />
          {/* Top gradient so header is legible without a black strip */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#03102a]/85 via-[#03102a]/30 to-transparent" />
          {/* Bottom fade into page */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-[#020617]" />
        </div>

        {/* Top bar overlay */}
        <header className="absolute inset-x-0 top-0 z-30">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
            <button
              onClick={() => { playSound("tick"); navigate(-1); }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-black/40 text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1
              className="font-display text-sm font-bold uppercase tracking-[0.5em]"
              style={{ color: "#00D9FF", textShadow: "0 2px 14px rgba(0,0,0,0.9), 0 0 12px rgba(0,217,255,0.6)" }}
            >
              Wallet
            </h1>
            <span className="h-9 w-9" aria-hidden />
          </div>
        </header>
      </section>

      <main className="relative z-10 mx-auto max-w-md space-y-2 px-4 pt-2">


        {/* TOTAL COINS — cyber frame */}
        <CyberFrame>
          <div className="text-center py-1">
            <div className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.4em]" style={{ color: "#00D9FF" }}>
              <span style={{ background: "linear-gradient(90deg, transparent, #00D9FF)", height: 1, width: 24 }} />
              Total Coins
              <span style={{ background: "linear-gradient(90deg, #00D9FF, transparent)", height: 1, width: 24 }} />
            </div>
            <p
              className="mt-2 font-display text-[38px] font-black leading-none tracking-wider text-white"
              style={{ textShadow: "0 0 20px rgba(0,217,255,0.9), 0 0 50px rgba(110,91,255,0.5)" }}
            >
              {formattedCoins}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.45em]" style={{ color: "#00BFFF" }}>Coins</p>
            <div
              className="mt-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1"
              style={{
                border: "1px solid rgba(0,217,255,0.45)",
                background: "rgba(0,217,255,0.06)",
                boxShadow: "0 0 14px -4px rgba(0,217,255,0.55) inset",
              }}
            >
              <Sparkles className="h-3 w-3" style={{ color: "#00D9FF" }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/85">
                Bonus Coins: <span className="font-bold" style={{ color: "#00D9FF" }}>{bonusCoins}</span>
              </span>
            </div>
          </div>
        </CyberFrame>

        {/* BR TOKENS & COUPONS */}
        <section className="grid grid-cols-2 gap-2.5">
          <CyberFrame>
            <div className="text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/55">BR Tokens</p>
              <p className="mt-1 font-display text-2xl font-black text-white" style={{ textShadow: "0 0 16px rgba(0,217,255,0.8)" }}>
                {brTokens}
              </p>
              <p className="mt-0.5 text-[8px] uppercase tracking-[0.16em] text-white/40">Battle Royale only • Max 2/day</p>
            </div>
          </CyberFrame>
          <CyberFrame>
            <div className="text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/55">Coupons</p>
              {coupons.length === 0 ? (
                <p className="mt-2 text-[10px] text-white/45">No coupons yet</p>
              ) : (
                <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                  {coupons.slice(0, 4).map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={{ border: "1px solid rgba(0,217,255,0.5)", color: "#00D9FF", background: "rgba(0,217,255,0.08)" }}
                    >
                      {c.discount_percent}% OFF
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/40">One-time use</p>
            </div>
          </CyberFrame>
        </section>



        {/* ACTIONS */}
        <section className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Add Coins", icon: Plus, onClick: () => go("/coin-store") },
            { label: "Withdraw", icon: RefreshCw, onClick: () => go("/wallet/withdraw") },
          ].map(({ label, icon: Icon, onClick }) => (
            <button key={label} onClick={onClick} className="active:scale-[0.97] transition w-full">
              <CyberFrame padded={false} className="h-12 w-full">
                <div className="flex h-full items-center justify-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" style={{ color: "#00D9FF", filter: "drop-shadow(0 0 6px #00D9FF)" }} />
                  <span
                    className="font-display text-xs font-bold uppercase tracking-[0.25em] text-white"
                    style={{ textShadow: "0 0 10px rgba(0,217,255,0.6)" }}
                  >
                    {label}
                  </span>
                </div>
              </CyberFrame>
            </button>
          ))}
        </section>

        {/* INVITE HUNTERS */}
        <CyberFrame>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, rgba(0,217,255,0.18), rgba(110,91,255,0.18))",
                border: "1px solid rgba(0,217,255,0.5)",
                boxShadow: "0 0 16px rgba(0,217,255,0.45)",
                color: "#00D9FF",
              }}
            >
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white">Invite Hunters</h3>
              <p className="text-[10px] text-white/65">
                Invite a friend & earn <span className="font-semibold" style={{ color: "#00D9FF" }}>+5 Bonus Coins</span>
              </p>
            </div>
            <button
              onClick={inviteFriend}
              className="flex items-center gap-1.5 rounded-md px-3.5 py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white active:scale-95 transition"
              style={{
                background: "linear-gradient(135deg, rgba(0,217,255,0.15), rgba(110,91,255,0.18))",
                border: "1px solid rgba(0,217,255,0.55)",
                boxShadow: "0 0 14px rgba(0,217,255,0.5)",
              }}
            >
              <Share2 className="h-3 w-3" /> Invite
            </button>
          </div>

          <div
            className="mt-2 rounded-lg px-3 py-2"
            style={{ border: "1px solid rgba(0,217,255,0.18)", background: "rgba(2,6,23,0.55)" }}
          >
            <div className="flex items-center justify-between gap-1">
              {[
                { n: 1, label: ["Friend", "Registers"], done: true },
                { n: 2, label: ["Joins", "3 Tournaments"], done: true },
                { n: 3, label: ["Completes", "5 Matches"], done: false },
              ].map((step, i, arr) => (
                <div key={step.n} className="flex flex-1 items-center">
                  <div className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={
                        step.done
                          ? {
                              background: "rgba(0,217,255,0.18)",
                              border: "1.5px solid #00D9FF",
                              boxShadow: "0 0 10px rgba(0,217,255,0.7)",
                              color: "#00D9FF",
                            }
                          : { background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(0,191,255,0.45)", color: "#7DD3FC" }
                      }
                    >
                      {step.done ? <Check className="h-3 w-3" /> : <span className="text-[10px] font-bold">{step.n}</span>}
                    </div>
                    <div className="text-center leading-tight">
                      <p className="text-[8px] font-semibold uppercase tracking-wider text-white/85">{step.label[0]}</p>
                      <p className="text-[8px] font-semibold uppercase tracking-wider text-white/85">{step.label[1]}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && <ChevronRight className="mx-0.5 h-3 w-3 shrink-0 text-white/30" />}
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-[8.5px] uppercase tracking-[0.18em] text-white/45 leading-tight">
              Bonus coins cannot be withdrawn.<br/>Usable only for selected tournament entries.
            </p>
          </div>
        </CyberFrame>

        {/* TRANSACTIONS */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.35em] text-white">Transactions</h2>
            <button
              onClick={() => go("/wallet/history")}
              className="flex items-center gap-1 font-display text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: "#00D9FF" }}
            >
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <CyberFrame padded={false}>
            <div className="px-3 py-1">
              <TransactionList items={transactions} />
            </div>
          </CyberFrame>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
