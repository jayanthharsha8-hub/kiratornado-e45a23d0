import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Check, Lock, Crown, Ticket, Coins, Sparkles, Gift } from "lucide-react";
import { toast } from "sonner";
import { useDailyStreak, type StreakReward } from "@/hooks/useDailyStreak";
import { BottomNav } from "@/components/BottomNav";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";

type Theme = {
  accent: string;
  accentSoft: string;
  bg: string;
  panel: string;
  border: string;
  label: string;
};

const NEON: Theme = {
  accent: "#00D9FF",
  accentSoft: "rgba(0,217,255,0.35)",
  bg: "#020617",
  panel: "linear-gradient(160deg, rgba(7,18,42,0.9), rgba(2,6,23,0.94))",
  border: "rgba(0,217,255,0.32)",
  label: "Daily Streak",
};

const GOLD: Theme = {
  accent: "#F5C542",
  accentSoft: "rgba(245,197,66,0.32)",
  bg: "#050403",
  panel: "linear-gradient(160deg, rgba(32,25,6,0.9), rgba(8,6,3,0.96))",
  border: "rgba(245,197,66,0.34)",
  label: "Prestige Streak",
};

const rewardIcon = (r: StreakReward) => {
  if (r.discount_percent > 0) return Ticket;
  if (r.bonus_coins > 0) return Coins;
  if (r.br_tokens > 0) return Sparkles;
  if (r.unlock_key) return Crown;
  return Gift;
};

const rewardLine = (r: StreakReward) => {
  const parts: string[] = [];
  if (r.bonus_coins > 0) parts.push(`+${r.bonus_coins} Bonus Coins`);
  if (r.br_tokens > 0) parts.push(`+${r.br_tokens} BR Token${r.br_tokens > 1 ? "s" : ""}`);
  if (r.discount_percent > 0) parts.push(`${r.discount_percent}% OFF Coupon`);
  return parts.join(" • ");
};

const DailyStreak = () => {
  const navigate = useNavigate();
  const { rewards, loading, claiming, claim, canClaim, countdown, currentDay, nextDay, broken, prestige, cycles } =
    useDailyStreak();

  const t = prestige ? GOLD : NEON;
  const visible = rewards.filter((r) => r.enabled);
  const progress = Math.min(100, (currentDay / 30) * 100);

  const onClaim = async () => {
    playSound("pulse");
    const { error, data } = await claim();
    if (error) { toast.error(error); return; }
    const reward = (data as any)?.reward;
    toast.success(reward?.title ? `Claimed: ${reward.title}` : "Reward claimed!");
    if ((data as any)?.prestige_unlocked && !prestige) {
      toast.success("Prestige Streak unlocked!");
    }
  };

  return (
    <div className="relative min-h-screen pb-28 overflow-hidden" style={{ background: t.bg }}>
      <Particles />
      <div
        className="pointer-events-none fixed inset-0 -z-0 opacity-70"
        style={{ background: `radial-gradient(700px 340px at 50% -8%, ${t.accentSoft}, transparent 65%)` }}
      />

      <header className="relative z-20 mx-auto flex max-w-md items-center justify-between px-4 pt-4">
        <button
          onClick={() => { playSound("tick"); navigate(-1); }}
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-black/40 text-white backdrop-blur-md transition active:scale-95"
          style={{ borderColor: t.border }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1
          className="font-display text-sm font-bold uppercase tracking-[0.4em]"
          style={{ color: t.accent, textShadow: `0 0 14px ${t.accentSoft}` }}
        >
          {t.label}
        </h1>
        <div className="h-9 w-9" />
      </header>

      <main className="relative z-10 mx-auto max-w-md space-y-3 px-4 pt-4">
        {/* WARNING NOTE */}
        <div
          className="flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{ border: "1px solid rgba(255,86,86,0.4)", background: "rgba(255,60,60,0.08)" }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6B6B]" />
          <p className="text-[11px] font-medium leading-snug text-white/85">
            Missing even one day will reset your Daily Streak back to Day 1.
          </p>
        </div>

        {/* PRESTIGE BANNER */}
        {prestige && (
          <div
            className="relative overflow-hidden rounded-2xl px-4 py-4 text-center"
            style={{ background: t.panel, border: `1px solid ${t.border}`, boxShadow: `0 0 40px -14px ${t.accentSoft}` }}
          >
            <div className="mx-auto mb-2 w-fit animate-float-up">
              <Crown
                className="h-9 w-9 animate-pulse-glow"
                style={{ color: t.accent, filter: `drop-shadow(0 0 12px ${t.accent})` }}
              />
            </div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.28em]" style={{ color: t.accent }}>
              Monarch Ascended
            </p>
            <p className="mt-1.5 text-[11px] leading-snug text-white/80">
              Congratulations! You have unlocked Prestige Streak. Continue your streak to earn exclusive rewards.
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-white/45">
              Cycles completed: {cycles}
            </p>
          </div>
        )}

        {/* PROGRESS + CLAIM */}
        <div
          className="rounded-2xl px-4 py-4"
          style={{ background: t.panel, border: `1px solid ${t.border}`, boxShadow: `0 0 34px -16px ${t.accentSoft}` }}
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/55">Current Streak</p>
              <p
                className="font-display text-[38px] font-black leading-none text-white"
                style={{ textShadow: `0 0 22px ${t.accentSoft}` }}
              >
                Day {currentDay}
              </p>
            </div>
            <p className="font-display text-[11px] uppercase tracking-[0.22em]" style={{ color: t.accent }}>
              {currentDay}/30
            </p>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: prestige
                  ? "linear-gradient(90deg,#8A6A12,#F5C542,#FFF0B8)"
                  : "linear-gradient(90deg,#0B6E8A,#00D9FF,#8FF3FF)",
                boxShadow: `0 0 14px ${t.accent}`,
              }}
            />
          </div>

          {broken && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#FF8A8A]">
              Streak broken — your next claim restarts at Day 1
            </p>
          )}

          <button
            onClick={onClaim}
            disabled={!canClaim || claiming || loading}
            className="mt-4 w-full rounded-xl py-3.5 font-display text-sm font-black uppercase tracking-[0.24em] text-black transition active:scale-[0.98] disabled:cursor-not-allowed"
            style={
              canClaim && !claiming
                ? {
                    background: prestige
                      ? "linear-gradient(135deg,#F5C542,#FFE9A3)"
                      : "linear-gradient(135deg,#00D9FF,#8FF3FF)",
                    boxShadow: `0 0 26px -4px ${t.accent}`,
                  }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: `1px solid ${t.border}` }
            }
          >
            {claiming ? "Claiming…" : canClaim ? `Claim Day ${nextDay} Reward` : `Next reward in ${countdown}`}
          </button>

          {!canClaim && (
            <p className="mt-2 text-center text-[10px] uppercase tracking-[0.22em] text-white/45">
              Come back tomorrow to keep your streak alive
            </p>
          )}
        </div>

        {/* REWARD GRID */}
        <div className="grid grid-cols-3 gap-2.5 pb-4">
          {visible.map((r) => {
            const claimed = r.day <= currentDay;
            const isNext = r.day === nextDay && canClaim;
            const Icon = rewardIcon(r);
            return (
              <div
                key={r.id}
                className="relative overflow-hidden rounded-xl p-2.5 text-center transition"
                style={{
                  background: claimed ? `${t.accentSoft.replace("0.3", "0.12")}` : t.panel,
                  border: `1px solid ${isNext ? t.accent : claimed ? t.border : "rgba(255,255,255,0.08)"}`,
                  boxShadow: isNext ? `0 0 22px -6px ${t.accent}` : undefined,
                  opacity: claimed || isNext ? 1 : 0.82,
                }}
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: t.accent }}>
                  Day {r.day}
                </p>
                <div className="my-1.5 flex h-10 items-center justify-center">
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.title} className="h-10 w-10 rounded-md object-cover" loading="lazy" />
                  ) : (
                    <Icon className="h-6 w-6" style={{ color: t.accent, filter: `drop-shadow(0 0 6px ${t.accentSoft})` }} />
                  )}
                </div>
                <p className="line-clamp-2 text-[9.5px] font-semibold leading-tight text-white/90">{r.title}</p>
                {rewardLine(r) && (
                  <p className="mt-0.5 line-clamp-1 text-[8px] uppercase tracking-wide text-white/45">{rewardLine(r)}</p>
                )}
                <div className="mt-1.5 flex items-center justify-center">
                  {claimed ? (
                    <Check className="h-3.5 w-3.5" style={{ color: t.accent }} />
                  ) : isNext ? (
                    <span className="text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: t.accent }}>
                      Ready
                    </span>
                  ) : (
                    <Lock className="h-3 w-3 text-white/30" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="pb-2 text-center text-[9px] uppercase tracking-[0.18em] text-white/35">
          BR Tokens & coupons are stored in your wallet. Bonus coins cannot be withdrawn.
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default DailyStreak;
