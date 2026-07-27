import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Ticket, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  discountPercent: number | null;
  entryFee: number;
  brTokens: number;
  tokenEligible: boolean;
  accent: string;
  onApplyCoupon: () => void;
  onUseToken: () => void;
  onSkip: () => void;
}

export const CouponPrompt = ({
  open, onOpenChange, discountPercent, entryFee, brTokens, tokenEligible, accent,
  onApplyCoupon, onUseToken, onSkip,
}: Props) => {
  const discounted = discountPercent
    ? Math.max(0, entryFee - Math.floor((entryFee * discountPercent) / 100))
    : entryFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[330px] border-primary/40 bg-[#050B18] p-5 text-center">
        {discountPercent ? (
          <>
            <Ticket className="mx-auto h-8 w-8" style={{ color: accent, filter: `drop-shadow(0 0 10px ${accent})` }} />
            <p className="mt-2 text-[12px] text-white/80">You have a Discount Coupon available.</p>
            <p
              className="font-display text-[34px] font-black leading-none"
              style={{ color: accent, textShadow: `0 0 20px ${accent}88` }}
            >
              {discountPercent}% OFF
            </p>
            <p className="text-[11px] text-white/60">
              Entry fee <span className="line-through">{entryFee}</span>{" "}
              <span className="font-bold text-white">{discounted}</span> coins
            </p>
            <p className="mt-1 text-[12px] font-semibold text-white/85">Apply Discount?</p>
          </>
        ) : (
          <>
            <Sparkles className="mx-auto h-8 w-8" style={{ color: accent, filter: `drop-shadow(0 0 10px ${accent})` }} />
            <p className="mt-2 text-[12px] text-white/80">
              You have {brTokens} BR Token{brTokens > 1 ? "s" : ""}. Use one for free entry?
            </p>
          </>
        )}

        <div className="mt-3 space-y-2">
          {discountPercent && (
            <button
              onClick={onApplyCoupon}
              className="w-full rounded-xl py-3 font-display text-xs font-black uppercase tracking-[0.2em] text-black active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${accent}, #ffffff)`, boxShadow: `0 0 20px -6px ${accent}` }}
            >
              Apply Coupon
            </button>
          )}
          {tokenEligible && brTokens > 0 && (
            <button
              onClick={onUseToken}
              className="w-full rounded-xl border py-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-white active:scale-[0.98]"
              style={{ borderColor: accent, background: `${accent}1a` }}
            >
              Use 1 BR Token (Free Entry)
            </button>
          )}
          <button
            onClick={onSkip}
            className="w-full rounded-xl border border-white/15 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-white/70 active:scale-[0.98]"
          >
            Skip
          </button>
        </div>
        <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/35">
          Coupons are one-time use • Max 2 BR Tokens per day
        </p>
      </DialogContent>
    </Dialog>
  );
};
