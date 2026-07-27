import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StreakReward {
  id: string;
  day: number;
  title: string;
  description: string;
  image_url: string | null;
  bonus_coins: number;
  br_tokens: number;
  discount_percent: number;
  unlock_key: string | null;
  unlock_days: number | null;
  enabled: boolean;
}

export interface StreakState {
  current_day: number;
  last_claim_at: string | null;
  longest_streak: number;
  prestige_unlocked: boolean;
  cycles_completed: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const useDailyStreak = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<StreakReward[]>([]);
  const [state, setState] = useState<StreakState | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(Date.now());
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const [{ data: rw }, streak] = await Promise.all([
      (supabase.from("streak_rewards" as any) as any).select("*").order("day", { ascending: true }),
      user
        ? (supabase.from("user_streaks" as any) as any).select("*").eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (!mounted.current) return;
    setRewards((rw ?? []) as StreakReward[]);
    setState(
      (streak?.data as StreakState) ?? {
        current_day: 0,
        last_claim_at: null,
        longest_streak: 0,
        prestige_unlocked: false,
        cycles_completed: 0,
      },
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, [load]);

  // Live admin updates
  useEffect(() => {
    const channel = supabase
      .channel("streak-rewards-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "streak_rewards" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const lastClaim = state?.last_claim_at ? new Date(state.last_claim_at).getTime() : null;
  const nextClaimAt = lastClaim ? lastClaim + DAY_MS : null;
  const canClaim = !nextClaimAt || now >= nextClaimAt;
  const msLeft = nextClaimAt ? Math.max(0, nextClaimAt - now) : 0;
  // Streak breaks if more than 48h passed since the last claim
  const broken = !!lastClaim && now > lastClaim + 2 * DAY_MS;
  const currentDay = broken ? 0 : state?.current_day ?? 0;
  const nextDay = currentDay >= 30 ? 1 : currentDay + 1;

  const countdown = useMemo(() => {
    const total = Math.floor(msLeft / 1000);
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [msLeft]);

  const claim = useCallback(async () => {
    setClaiming(true);
    const { data, error } = await (supabase.rpc as any)("claim_daily_streak");
    setClaiming(false);
    if (error) return { error: error.message as string, data: null };
    await load();
    return { error: null, data };
  }, [load]);

  return {
    rewards,
    state,
    loading,
    claiming,
    claim,
    canClaim,
    countdown,
    currentDay,
    nextDay,
    broken,
    prestige: !!state?.prestige_unlocked,
    cycles: state?.cycles_completed ?? 0,
  };
};
