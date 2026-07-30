import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Gift, Sparkles, Ticket, Zap } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Particles } from "@/components/Particles";
import { CoinPackCard, LimitedOfferCard } from "@/components/store/CoinStoreCards";
import { PurchaseFlow, type StoreItem } from "@/components/store/PurchaseFlow";
import { useCoinStore } from "@/hooks/useCoinStore";

const StatChip = ({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string | number }) => (
  <div
    className="flex flex-col items-center rounded-xl border border-white/10 px-2 py-2 backdrop-blur-xl"
    style={{ background: "rgba(255,255,255,0.03)" }}
  >
    <Icon className="h-3.5 w-3.5 text-[#00D9FF]" />
    <span className="mt-1 font-display text-sm font-bold text-white">{value}</span>
    <span className="text-[8px] uppercase tracking-[0.18em] text-white/40">{label}</span>
  </div>
);

const CoinStore = () => {
  const navigate = useNavigate();
  const { packs, offers, wallet, loading, purchase } = useCoinStore();
  const [selected, setSelected] = useState<StoreItem | null>(null);

  const liveOffers = useMemo(
    () => offers.filter((o) => !o.expires_at || new Date(o.expires_at).getTime() > Date.now()),
    [offers]
  );

  return (
    <div className="relative min-h-screen pb-24" style={{ background: "radial-gradient(120% 80% at 50% 0%, #0A1730 0%, #050914 45%, #01030A 100%)" }}>
      <Particles />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 px-4 py-3 backdrop-blur-xl" style={{ background: "rgba(2,6,23,0.75)" }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" className="rounded-full border border-white/12 p-2 text-white/80 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-sm font-bold uppercase tracking-[0.28em] text-white" style={{ textShadow: "0 0 18px rgba(0,217,255,0.55)" }}>
            Coin Store
          </h1>
          <p className="text-[9px] uppercase tracking-[0.24em] text-white/40">Monarch Treasury</p>
        </div>
      </header>

      <main className="relative z-10 space-y-6 px-4 pt-4">
        {/* Wallet snapshot */}
        <section className="grid grid-cols-4 gap-2">
          <StatChip icon={Coins} label="Coins" value={wallet.coins} />
          <StatChip icon={Gift} label="Bonus" value={wallet.bonus_coins} />
          <StatChip icon={Zap} label="BR Tokens" value={wallet.br_tokens} />
          <StatChip icon={Ticket} label="Coupons" value={wallet.coupons.length} />
        </section>

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
                <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]" />
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
        onClose={() => setSelected(null)}
        onSubmit={async (item, upiRef) => {
          await purchase({ packId: item.packId, offerId: item.offerId, upiRef });
        }}
      />

      <BottomNav />
    </div>
  );
};

export default CoinStore;
