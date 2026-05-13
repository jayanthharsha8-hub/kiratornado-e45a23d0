import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { HeroLogo } from "@/components/HeroLogo";
import { NeonField, NeonButton, AuthShell, Footer } from "@/pages/Login";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Lock, User, Hash, Award, Gift, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6).max(72),
  player_name: z.string().trim().min(2).max(40),
  ff_uid: z.string().trim().regex(/^\d{6,15}$/, "FF UID must be 6-15 digits"),
  player_level: z.coerce.number().int().min(30).max(99),
  referral_code: z.string().trim().max(20).optional().or(z.literal("")),
});

const LEVELS = Array.from({ length: 70 }, (_, i) => i + 30);

const RegisterEmail = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", player_name: "", ff_uid: "", player_level: "30", referral_code: "",
  });
  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
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
    if (error) { toast.error(error.message.includes("already") ? "Email already registered" : error.message); return; }
    localStorage.setItem("userExists", "true");
    await supabase.auth.signOut();
    toast.success("Hunter registered. Please login to continue.");
    navigate("/login", { replace: true });
  };

  return (
    <AuthShell>
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-2 self-start text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

        <HeroLogo size={200} />

        <div className="mt-1 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            New <span className="text-primary text-glow">Hunter</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your account to begin</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <NeonField icon={<Mail className="h-5 w-5" />}>
            <Input type="email" value={form.email} onChange={update("email")} placeholder="Email"
              className="h-14 border-0 bg-transparent pl-12 placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0" />
          </NeonField>
          <NeonField icon={<Lock className="h-5 w-5" />}>
            <Input type="password" value={form.password} onChange={update("password")} placeholder="Password (min 6)"
              className="h-14 border-0 bg-transparent pl-12 placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0" />
          </NeonField>
          <NeonField icon={<User className="h-5 w-5" />}>
            <Input value={form.player_name} onChange={update("player_name")} placeholder="Player Name"
              className="h-14 border-0 bg-transparent pl-12 placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0" />
          </NeonField>
          <NeonField icon={<Hash className="h-5 w-5" />}>
            <Input value={form.ff_uid} onChange={update("ff_uid")} placeholder="Free Fire UID"
              className="h-14 border-0 bg-transparent pl-12 placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0" />
          </NeonField>

          <div className="relative rounded-sm border border-primary/40 bg-card/60 transition focus-within:border-primary focus-within:shadow-[0_0_16px_hsl(var(--primary)/0.35)]">
            <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-primary/80"><Award className="h-5 w-5" /></span>
            <Select value={form.player_level} onValueChange={(v) => setForm({ ...form, player_level: v })}>
              <SelectTrigger className="h-14 border-0 bg-transparent pl-12 text-base focus:ring-0">
                <SelectValue placeholder="Player Level" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {LEVELS.map((l) => (<SelectItem key={l} value={String(l)}>Level {l}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <NeonField icon={<Gift className="h-5 w-5" />}>
            <Input value={form.referral_code} onChange={update("referral_code")} placeholder="Referral code (optional)"
              className="h-14 border-0 bg-transparent pl-12 placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0" />
          </NeonField>

          <div className="pt-2">
            <NeonButton type="submit" disabled={loading}>
              {loading ? "REGISTERING..." : "REGISTER"}
            </NeonButton>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already a hunter?{" "}
          <Link to="/login" className="font-semibold text-primary text-glow-soft hover:underline">Sign in</Link>
        </p>

        <Footer />
    </AuthShell>
  );
};

export default RegisterEmail;
