import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Gift, Sparkles, Ticket, Wallet, Zap } from "lucide-react";
import { Particles } from "@/components/Particles";
import { CoinPackCard, LimitedOfferCard } from "@/components/store/CoinStoreCards";
import { PurchaseFlow, type StoreItem } from "@/components/store/PurchaseFlow";
import { useCoinStore } from "@/hooks/useCoinStore";
import { playSound } from "@/hooks/useSound";

const StatChip = ({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string | number }) => (
  <div
    className="flex flex-col items-center rounded-xl border border-white/10 px-1.5 py-1.5 backdrop-blur-xl"
    style={{ background: "rgba(255,255,255,0.03)", boxShadow: "0 8px 26px -20px #00D9FF" }}
  >
    <Icon className="h-3.5 w-3.5 text-[#00D9FF]" />
    <span className="mt-0.5 font-display text-sm font-bold leading-none text-white">{value}</span>
    <span className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/40">{label}</span>
  </div>
);

const CoinStore = () => {
  const navigate = useNavigate();
  const { packs, offers, wallet, settings, loading, purchase } = useCoinStore();
  const [selected, setSelected] = useState<StoreItem | null>(null);
  const [amount, setAmount] = useState("");

  const min = settings?.min_deposit_coins ?? 10;
  const rate = Number(settings?.coin_rate ?? 1);
  const upiId = settings?.upi_id ?? "kiratornado@ptyes";
  const manualEnabled = settings?.manual_entry_enabled ?? true;

  const coinsTyped = Number(amount) || 0;
  const payable = Math.ceil(coinsTyped * rate);
  const valid = coinsTyped >= min;

  useEffect(() => { document.title = "Add Coins | ZEOX"; }, []);

  const liveOffers = useMemo(
    () => offers.filter((o) => !o.expires_at || new Date(o.expires_at).getTime() > Date.now()),
    [offers]
  );

  const startManual = () => {
    if (!valid) return;
    playSound("tick");
    setSelected({ manualCoins: coinsTyped, name: `${coinsTyped} Coins`, coins: coinsTyped, bonus_coins: 0, price: payable });
  };

  return (
    <div className="relative min-h-screen pb-8" style={{ background: "radial-gradient(120% 80% at 50% 0%, #0A1730 0%, #050914 45%, #01030A 100%)" }}>
      <Particles />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 px-4 py-2.5 backdrop-blur-xl" style={{ background: "rgba(2,6,23,0.8)" }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" className="rounded-full border border-white/12 p-2 text-white/80 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-display text-sm font-bold uppercase tracking-[0.28em] text-white" style={{ textShadow: "0 0 18px rgba(0,217,255,0.55)" }}>
          Add Coins
        </h1>
      </header>

      <main className="relative z-10 space-y-4 px-4 pt-3">
        {/* Wallet snapshot */}
        <section className="grid grid-cols-4 gap-2">
          <StatChip icon={Coins} label="Coins" value={wallet.coins} />
          <StatChip icon={Gift} label="Bonus" value={wallet.bonus_coins} />
          <StatChip icon={Zap} label="BR Tokens" value={wallet.br_tokens} />
          <StatChip icon={Ticket} label="Coupons" value={wallet.coupons.length} />
        </section>

        {/* Manual entry */}
        {manualEnabled && (
          <section
            className="rounded-2xl border border-[#00D9FF]/25 p-3.5 backdrop-blur-2xl"
            style={{ background: "linear-gradient(160deg, rgba(9,20,44,0.85), rgba(2,6,23,0.92))", boxShadow: "0 18px 50px -28px #00D9FF" }}
          >
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#00D9FF]" />
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.24em] text-white">Enter Coins</h2>
            </div>

            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">
              <Coins className="h-4 w-4 shrink-0 text-[#00D9FF]" />
              <input
                type="number"
                inputMode="numeric"
                min={min}
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={`Min ${min}`}
                aria-label="Coins to add"
                className="h-11 w-full bg-transparent font-display text-lg font-bold text-white outline-none placeholder:text-white/25"
              />
              <span className="shrink-0 font-display text-sm font-bold text-[#00D9FF]">₹{payable}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em]">
              <span className="text-white/40">Minimum deposit: {min} Coins</span>
              <span className="text-white/40">1 Coin = ₹{rate}</span>
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {[50, 100, 250, 500].map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className="rounded-lg border border-white/12 bg-white/[0.03] py-1.5 text-[11px] font-bold text-white/70 transition active:scale-95 hover:border-[#00D9FF]/50 hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>

            <button
              onClick={startManual}
              disabled={!valid}
              className="mt-3 w-full rounded-xl py-3 font-display text-xs font-bold uppercase tracking-[0.22em] text-white transition active:scale-[0.97] disabled:opacity-40"
              style={{ background: "linear-gradient(120deg,#00D9FF,#6E5BFF)", boxShadow: "0 12px 30px -14px #00D9FF" }}
            >
              Continue{valid ? ` • ₹${payable}` : ""}
            </button>
          </section>
        )}

        {/* Limited offers */}
        {liveOffers.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.24em] text-white">Limited Offers</h2>
            </div>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {liveOffers.map((o) => (
                <LimitedOfferCard
                  key={o.id}
                  offer={o}
                  onBuy={(offer) =>
                    setSelected({ offerId: offer.id, name: offer.title, coins: offer.coins, bonus_coins: offer.bonus_coins, price: offer.price })
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Coin packs */}
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Coins className="h-4 w-4 text-[#00D9FF]" />
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.24em] text-white">Coin Packs</h2>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]" />
              ))}
            </div>
          ) : packs.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-xs text-white/45">
              No coin packs available right now. Check back soon, Hunter.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {packs.map((p) => (
                <CoinPackCard
                  key={p.id}
                  pack={p}
                  onBuy={(pack) =>
                    setSelected({ packId: pack.id, name: pack.name, coins: pack.coins, bonus_coins: pack.bonus_coins, price: pack.price })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <PurchaseFlow
        item={selected}
        upiId={upiId}
        qrImageUrl={settings?.qr_image_url}
        onClose={() => { setSelected(null); setAmount(""); }}
        onSubmit={async (item, upiRef) => {
          await purchase({ packId: item.packId, offerId: item.offerId, manualCoins: item.manualCoins, upiRef });
        }}
      />
    </div>
  );
};

export default CoinStore;
