import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Copy, QrCode } from "lucide-react";

const UPI_ID = "kiratornado@ptyes";
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=0a0f1c&color=00e5ff&qzone=2&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=ZEOX&cu=INR`)}`;

const AMOUNTS = [10, 20, 50, 100];

export const WalletDialog = ({ open, onOpenChange, coins }: { open: boolean; onOpenChange: (b: boolean) => void; coins: number }) => {
  const { user } = useAuth();
  const [addAmt, setAddAmt] = useState("");
  const [addRef, setAddRef] = useState("");
  const [wAmt, setWAmt] = useState("");
  const [wUpi, setWUpi] = useState("");
  const [busy, setBusy] = useState(false);

  const [wType, setWType] = useState<"redeem" | "upi">("upi");

  const submit = async (type: "add" | "withdraw") => {
    if (!user) return;
    const amount = Number(type === "add" ? addAmt : wAmt);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (type === "withdraw" && wType === "redeem" && amount < 30) { toast.error("Minimum redeem: 30 coins"); return; }
    if (type === "withdraw" && wType === "upi" && amount < 10) { toast.error("Minimum UPI withdrawal: 10 coins"); return; }
    if (type === "withdraw" && amount > coins) { toast.error("Insufficient coins"); return; }
    if (type === "withdraw" && wType === "upi" && !wUpi.trim()) { toast.error("Enter UPI ID"); return; }
    setBusy(true);
    const { error } = await supabase.from("wallet_requests").insert({
      user_id: user.id, type, amount,
      upi_ref: type === "add" ? addRef || null : null,
      upi_id: type === "withdraw" ? wUpi || null : null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Request sent. Admin will review shortly.");
    setAddAmt(""); setAddRef(""); setWAmt(""); setWUpi("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="wallet-theme panel max-w-md border-primary/60 bg-[hsl(260,40%,6%)]/95 p-5 backdrop-blur-xl" style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.25), inset 0 0 20px hsl(var(--primary) / 0.04)" }}>
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-[0.25em] text-primary text-glow">
            [ My Wallet ]
          </DialogTitle>
        </DialogHeader>

        {/* Balance Display */}
        <div className="relative overflow-hidden rounded-xl border border-primary/40 bg-[hsl(260,40%,8%)]/60 p-4 space-y-3" style={{ boxShadow: "inset 0 0 16px hsl(var(--primary) / 0.05)" }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),transparent_70%)]" />
          <div className="relative text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total Coins</div>
            <div className="font-display text-3xl font-bold text-primary text-glow">{coins}</div>
          </div>
          <div className="relative grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-primary/20 bg-black/30 p-2">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">TopUp</div>
              <div className="font-display text-sm text-foreground">--</div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-black/30 p-2">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Winning</div>
              <div className="font-display text-sm text-foreground">--</div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-black/30 p-2">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Referral</div>
              <div className="font-display text-sm text-foreground">--</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="add" className="mt-2">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="add">Add Coins</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4 pt-4">
            {/* Quick Amount Selection */}
            <div className="grid grid-cols-4 gap-2">
              {AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAddAmt(String(a))}
                  className={`rounded-lg border py-2 text-xs font-display uppercase tracking-widest transition ${
                    addAmt === String(a)
                      ? "border-primary bg-primary/20 text-primary text-glow"
                      : "border-primary/30 bg-[hsl(260,40%,8%)]/40 text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/40 bg-[hsl(260,40%,8%)]/60 p-4" style={{ boxShadow: "inset 0 0 16px hsl(var(--primary) / 0.05)" }}>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary/80"><QrCode className="h-4 w-4" /> Scan UPI QR</div>
              <img src={QR_URL} alt="UPI QR" width={200} height={200} className="rounded glow-soft" loading="lazy" />
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(UPI_ID); toast.success("UPI ID copied"); }}
                className="flex items-center gap-2 text-sm text-primary text-glow-soft hover:underline"
              >
                {UPI_ID} <Copy className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-widest text-primary/80">Amount (coins)</Label>
              <Input type="number" value={addAmt} onChange={(e) => setAddAmt(e.target.value)} placeholder="50" className="border-primary/40 bg-[hsl(260,40%,8%)]/60" />
              <Label className="text-[11px] uppercase tracking-widest text-primary/80">UPI Ref / Txn ID</Label>
              <Input value={addRef} onChange={(e) => setAddRef(e.target.value)} placeholder="123456789012" className="border-primary/40 bg-[hsl(260,40%,8%)]/60" />
              <Button onClick={() => submit("add")} disabled={busy} className="w-full bg-primary font-display uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
                Submit Request
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setWType("upi")} className={`rounded-lg border py-2 text-xs font-display uppercase tracking-widest transition ${wType === "upi" ? "border-primary bg-primary/20 text-primary" : "border-primary/30 bg-[hsl(260,40%,8%)]/40 text-muted-foreground"}`}>UPI Withdraw</button>
              <button onClick={() => setWType("redeem")} className={`rounded-lg border py-2 text-xs font-display uppercase tracking-widest transition ${wType === "redeem" ? "border-primary bg-primary/20 text-primary" : "border-primary/30 bg-[hsl(260,40%,8%)]/40 text-muted-foreground"}`}>Redeem Code</button>
            </div>
            <Label className="text-[11px] uppercase tracking-widest text-primary/80">Amount (min {wType === "upi" ? "10" : "30"})</Label>
            <Input type="number" value={wAmt} onChange={(e) => setWAmt(e.target.value)} placeholder={wType === "upi" ? "10" : "30"} className="border-primary/40 bg-[hsl(260,40%,8%)]/60" />
            {wType === "upi" && (
              <>
                <Label className="text-[11px] uppercase tracking-widest text-primary/80">UPI ID</Label>
                <Input value={wUpi} onChange={(e) => setWUpi(e.target.value)} placeholder="you@upi" className="border-primary/40 bg-[hsl(260,40%,8%)]/60" />
              </>
            )}
            <Button onClick={() => submit("withdraw")} disabled={busy} className="w-full bg-primary font-display uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
              {wType === "upi" ? "Request UPI Withdrawal" : "Redeem Coins"}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              {wType === "upi" ? "Min 10 coins. Must have played 3+ matches. 1 request/day." : "Min 30 coins. Must have played 3+ matches."}
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
