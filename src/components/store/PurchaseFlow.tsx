import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Coins, Copy, Loader2, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export interface StoreItem {
  packId?: string;
  offerId?: string;
  manualCoins?: number;
  name: string;
  coins: number;
  bonus_coins: number;
  price: number;
}

const qrFor = (upiId: string, amount: number) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=020617&color=00D9FF&qzone=2&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=ZEOX&cu=INR&am=${amount}`
  )}`;

type Step = "summary" | "payment" | "utr" | "success";

const Row = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</span>
    <span className={`font-display text-sm font-bold ${accent ? "text-[#00D9FF]" : "text-white"}`}>{value}</span>
  </div>
);

const PrimaryButton = ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...rest}
    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-display text-xs font-bold uppercase tracking-[0.22em] text-white transition active:scale-[0.97] disabled:opacity-60"
    style={{ background: "linear-gradient(120deg,#00D9FF,#6E5BFF)", boxShadow: "0 12px 30px -14px #00D9FF" }}
  >
    {children}
  </button>
);

/** Order summary → payment → UTR entry → success animation flow. */
export const PurchaseFlow = ({
  item,
  upiId,
  qrImageUrl,
  onClose,
  onSubmit,
}: {
  item: StoreItem | null;
  upiId: string;
  qrImageUrl?: string | null;
  onClose: () => void;
  onSubmit: (item: StoreItem, upiRef: string) => Promise<void>;
}) => {
  const [step, setStep] = useState<Step>("summary");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (item) { setStep("summary"); setRef(""); setBusy(false); }
  }, [item]);

  if (!item) return null;
  const total = item.coins + item.bonus_coins;

  const submit = async () => {
    if (ref.trim().length < 4) { toast.error("Enter the UTR / transaction reference"); return; }
    setBusy(true);
    try {
      await onSubmit(item, ref.trim());
      setStep("success");
    } catch (e: any) {
      toast.error(e?.message ?? "Purchase failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm overflow-hidden rounded-2xl border-[#00D9FF]/35 p-5 backdrop-blur-2xl"
        style={{ background: "linear-gradient(160deg, rgba(8,17,38,0.96), rgba(2,6,23,0.98))", boxShadow: "0 24px 70px -30px #00D9FF" }}
      >
        {step === "summary" && (
          <div className="animate-fade-in">
            <h2 className="font-display text-base font-bold uppercase tracking-[0.22em] text-[#00D9FF]">Order Summary</h2>
            <div className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1">
              <Row label="Item" value={item.name} />
              <Row label="Coins" value={String(item.coins)} />
              {item.bonus_coins > 0 && <Row label="Bonus" value={`+${item.bonus_coins}`} />}
              <Row label="Total Coins" value={String(total)} accent />
              <Row label="Payable" value={`₹${item.price}`} accent />
            </div>
            <PrimaryButton onClick={() => setStep("payment")}>Continue</PrimaryButton>
            <button onClick={onClose} className="mt-2 w-full rounded-xl border border-white/12 py-2.5 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:text-white">
              Cancel
            </button>
          </div>
        )}

        {step === "payment" && (
          <div className="animate-fade-in">
            <h2 className="font-display text-base font-bold uppercase tracking-[0.22em] text-[#00D9FF]">Pay ₹{item.price}</h2>
            <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/50"><QrCode className="h-3.5 w-3.5" /> Scan UPI QR</span>
              <img
                src={qrImageUrl || qrFor(upiId, item.price)}
                alt="UPI payment QR code"
                width={190}
                height={190}
                className="rounded-lg"
                loading="lazy"
              />
              <button
                onClick={() => { navigator.clipboard.writeText(upiId); toast.success("UPI ID copied"); }}
                className="flex items-center gap-1.5 text-xs text-[#00D9FF]"
              >
                {upiId} <Copy className="h-3 w-3" />
              </button>
            </div>
            <PrimaryButton onClick={() => setStep("utr")}>I&apos;ve Paid</PrimaryButton>
            <button onClick={onClose} className="mt-2 w-full rounded-xl border border-white/12 py-2.5 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:text-white">
              Cancel
            </button>
          </div>
        )}

        {step === "utr" && (
          <div className="animate-fade-in">
            <h2 className="font-display text-base font-bold uppercase tracking-[0.22em] text-[#00D9FF]">Enter UTR</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-white/50">
              Paste the 12-digit UTR / transaction reference from your UPI app so we can verify the payment.
            </p>
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="UTR / transaction reference"
              className="mt-3 border-[#00D9FF]/30 bg-white/[0.04]"
            />
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-white/45">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#4ADE80]" />
              Verification is automatic once your payment is matched.
            </div>
            <PrimaryButton onClick={submit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit UTR
            </PrimaryButton>
            <button onClick={() => setStep("payment")} className="mt-2 w-full rounded-xl border border-white/12 py-2.5 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:text-white">
              Back
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="animate-scale-in text-center">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#4ADE80]/20 animate-ping" />
              <CheckCircle2 className="relative h-16 w-16 text-[#4ADE80]" style={{ filter: "drop-shadow(0 0 16px #4ADE80)" }} />
            </div>
            <h2 className="mt-3 font-display text-base font-bold uppercase tracking-[0.18em] text-white">Payment Submitted</h2>
            <p className="mt-2 flex items-center justify-center gap-2 font-display text-2xl font-extrabold text-[#00D9FF]" style={{ textShadow: "0 0 20px rgba(0,217,255,0.6)" }}>
              <Coins className="h-6 w-6" /> +{total} Coins
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-white/50">
              Your UTR is being verified. Coins land in your wallet automatically once approved.
            </p>
            <PrimaryButton onClick={onClose}>Continue</PrimaryButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
