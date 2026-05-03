import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, Shield } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6).max(72),
  player_name: z.string().trim().min(2).max(40),
  ff_uid: z.string().trim().regex(/^\d{6,15}$/, "FF UID must be 6-15 digits"),
  player_level: z.coerce.number().int().min(30).max(99),
  referral_code: z.string().trim().max(20).optional().or(z.literal("")),
});

const LEVELS = Array.from({ length: 70 }, (_, i) => i + 30);

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", player_name: "", ff_uid: "", player_level: "30", referral_code: "",
  });

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: {
          username: parsed.data.email.split("@")[0],
          player_name: parsed.data.player_name,
          ff_uid: parsed.data.ff_uid,
          player_level: parsed.data.player_level,
          referral_code: parsed.data.referral_code || null,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("already") ? "Email already registered" : error.message);
      return;
    }
    localStorage.setItem("userExists", "true");
    await supabase.auth.signOut();
    toast.success("Hunter registered. Please login to continue.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative min-h-screen px-4 py-8 scanline">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--gradient-glow)' }} />
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 pt-4">
          <Logo size={64} />
          <h1 className="font-display text-xl font-black uppercase tracking-[0.25em] text-primary text-glow">KIRA TORNADO</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">[ SYSTEM REGISTRATION ]</p>
        </div>

        <SystemPanel title="New Hunter">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-widest text-primary/80">Email (Gmail)</Label>
              <Input id="email" type="email" value={form.email} onChange={update("email")} placeholder="hunter@gmail.com" className="border-primary/40 bg-input/60 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-[11px] uppercase tracking-widest text-primary/80">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={update("password")} placeholder="Min 6 characters" className="border-primary/40 bg-input/60 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="player_name" className="text-[11px] uppercase tracking-widest text-primary/80">Player Name</Label>
              <Input id="player_name" value={form.player_name} onChange={update("player_name")} placeholder="Sung Jin-Woo" className="border-primary/40 bg-input/60 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ff_uid" className="text-[11px] uppercase tracking-widest text-primary/80">Free Fire UID</Label>
              <Input id="ff_uid" value={form.ff_uid} onChange={update("ff_uid")} placeholder="1234567890" className="border-primary/40 bg-input/60 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] uppercase tracking-widest text-primary/80">Player Level</Label>
              <Select value={form.player_level} onValueChange={(v) => setForm({ ...form, player_level: v })}>
                <SelectTrigger className="border-primary/40 bg-input/60 text-foreground">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="referral_code" className="text-[11px] uppercase tracking-widest text-primary/80">Referral Code (optional)</Label>
              <Input id="referral_code" value={form.referral_code} onChange={update("referral_code")} placeholder="---" className="border-primary/40 bg-input/60 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary" />
            </div>

            <Button type="submit" disabled={loading} className="mt-2 h-12 w-full bg-primary font-display text-sm font-bold uppercase tracking-[0.3em] text-primary-foreground hover:bg-primary-glow animate-pulse-glow">
              {loading ? "Registering..." : "[ Register ]"}
            </Button>
          </form>
        </SystemPanel>

        <SystemPanel title="System Notice">
          <ul className="space-y-2 text-xs text-foreground/85">
            <li className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0 text-primary" /> Multiple accounts are not allowed.</li>
            <li className="flex gap-2"><Shield className="h-4 w-4 shrink-0 text-primary" /> Hackers and cheaters will be permanently banned.</li>
          </ul>
        </SystemPanel>

        <p className="text-center text-xs text-muted-foreground">
          Already a hunter? <Link to="/login" className="text-primary text-glow-soft underline-offset-4 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
