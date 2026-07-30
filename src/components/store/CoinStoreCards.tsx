import { Coins, Crown, Sparkles, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { CoinOffer, CoinPack, formatCountdown } from "@/hooks/useCoinStore";

const BADGES: Record<string, { label: string; color: string; icon: typeof Star }> = {
  popular: { label: "Most Popular", color: "#00D9FF", icon: Star },
  best_value: { label: "Best Value", color: "#8B5CF6", icon: Zap },
  monarch: { label: "Monarch", color: "#F5C542", icon: Crown },
};

const accentFor = (pack: CoinPack) => BADGES[pack.badge ?? ""]?.color ?? "#3B82F6";

/** Premium glass card for a single coin pack. */
export const CoinPackCard = ({ pack, onBuy }: { pack: CoinPack; onBuy: (p: CoinPack) => void }) => {
  const badge = pack.badge ? BADGES[pack.badge] : undefined;
  const accent = accentFor(pack);
  const BadgeIcon = badge?.icon ?? Star;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-[250ms] hover:-translate-y-0.5"
      style={{ background: `linear-gradient(140deg, ${accent}66, rgba(255,255,255,0.04) 45%, ${accent}44)` }}
    >
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-2xl p-4 backdrop-blur-xl transition-all duration-[250ms]"
        style={{
          background: "linear-gradient(160deg, rgba(8,17,38,0.92), rgba(2,6,23,0.96))",
          boxShadow: `0 12px 34px -18px ${accent}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity duration-[250ms] group-hover:opacity-70"
          style={{ background: accent }}
        />

        {pack.banner_url && (
          <img
            src={pack.banner_url}
            alt={`${pack.name} coin pack artwork`}
            loading="lazy"
            className="mb-3 h-24 w-full rounded-xl object-cover"
          />
        )}

        {badge && (
          <span
            className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] animate-pulse-glow"
            style={{ color: accent, border: `1px solid ${accent}80`, background: `${accent}1a` }}
          >
            <BadgeIcon className="h-3 w-3" /> {badge.label}
          </span>
        )}

        <div className="relative flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: `${accent}1f`, border: `1px solid ${accent}66`, boxShadow: `0 0 18px -6px ${accent}` }}
          >
            <Coins className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-sm font-bold uppercase tracking-[0.14em] text-white">{pack.name}</h3>
            <p className="text-[11px] text-white/50">{pack.description || `${pack.coins + pack.bonus_coins} total coins`}</p>
          </div>
        </div>

        <div className="relative mt-4 flex items-end justify-between">
          <div>
            <p className="font-display text-2xl font-extrabold leading-none text-white" style={{ textShadow: `0 0 16px ${accent}80` }}>
              {pack.coins}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">Coins</p>
          </div>
          {pack.bonus_coins > 0 && (
            <span
              className="rounded-full px-2 py-1 text-[10px] font-bold"
              style={{ color: "#4ADE80", border: "1px solid rgba(74,222,128,0.45)", background: "rgba(74,222,128,0.1)" }}
            >
              +{pack.bonus_coins} Bonus
            </span>
          )}
        </div>

        <button
          onClick={() => onBuy(pack)}
          className="relative mt-4 w-full overflow-hidden rounded-xl py-2.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-[250ms] active:scale-[0.97]"
          style={{
            background: `linear-gradient(120deg, ${accent}, #6E5BFF)`,
            boxShadow: `0 10px 26px -12px ${accent}`,
          }}
        >
          <span className="relative z-10">Buy Now · ₹{pack.price}</span>
          <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-500 group-hover:translate-x-full" />
        </button>
      </div>
    </div>
  );
};

/** Horizontal limited-time offer card with live countdown and animated border. */
export const LimitedOfferCard = ({ offer, onBuy }: { offer: CoinOffer; onBuy: (o: CoinOffer) => void }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!offer.expires_at) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [offer.expires_at]);

  const remaining = offer.expires_at ? new Date(offer.expires_at).getTime() - now : null;
  if (remaining !== null && remaining <= 0) return null;

  return (
    <div
      className="relative w-[248px] shrink-0 snap-start overflow-hidden rounded-2xl p-[1px]"
      style={{ background: "linear-gradient(120deg, #00D9FF, #8B5CF6, #00D9FF)", backgroundSize: "200% 100%", animation: "storeBorder 4s linear infinite" }}
    >
      <div
        className="flex h-full flex-col rounded-2xl p-3 backdrop-blur-xl"
        style={{ background: "linear-gradient(160deg, rgba(8,17,38,0.94), rgba(2,6,23,0.97))" }}
      >
        {offer.banner_url && (
          <img src={offer.banner_url} alt={`${offer.title} offer artwork`} loading="lazy" className="mb-2 h-20 w-full rounded-lg object-cover" />
        )}
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#00D9FF]" />
          <h4 className="truncate font-display text-xs font-bold uppercase tracking-[0.14em] text-white">{offer.title}</h4>
        </div>
        {offer.subtitle && <p className="mt-0.5 truncate text-[10px] text-white/45">{offer.subtitle}</p>}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-xl font-extrabold text-white">{offer.coins}</span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Coins</span>
          {offer.bonus_coins > 0 && <span className="text-[10px] font-bold text-[#4ADE80]">+{offer.bonus_coins}</span>}
        </div>

        {remaining !== null && (
          <div className="mt-2 rounded-lg border border-[#00D9FF]/25 bg-[#00D9FF]/5 px-2 py-1 text-center">
            <p className="text-[8px] uppercase tracking-[0.22em] text-white/45">Offer Ends In</p>
            <p className="font-display text-sm font-bold tabular-nums text-[#00D9FF]">{formatCountdown(remaining)}</p>
          </div>
        )}

        <button
          onClick={() => onBuy(offer)}
          className="mt-2.5 w-full rounded-lg py-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white transition active:scale-[0.97]"
          style={{ background: "linear-gradient(120deg,#00D9FF,#6E5BFF)", boxShadow: "0 8px 22px -12px #00D9FF" }}
        >
          Grab · ₹{offer.price}
        </button>
      </div>
    </div>
  );
};
