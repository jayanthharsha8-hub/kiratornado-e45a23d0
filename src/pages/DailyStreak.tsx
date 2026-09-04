import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { useDailyStreak } from "@/hooks/useDailyStreak";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import {
  DailyRewardCarousel,
  StreakHeader,
  StreakHero,
  StreakMilestones,
  StreakWarning,
} from "@/components/streak/DailyStreakComponents";
import { playSound } from "@/hooks/useSound";
import { normalizeRewards } from "@/lib/streakRewards";

const DailyStreak = () => {
  const navigate = useNavigate();
  const { rewards, loading, claiming, claim, canClaim, countdown, currentDay, nextDay, broken } =
    useDailyStreak();
  const dailyRewards = useMemo(() => normalizeRewards(rewards), [rewards]);
  const [selectedDay, setSelectedDay] = useState(nextDay);
  const nextReward = dailyRewards[nextDay - 1] ?? dailyRewards[0];

  const onClaim = async () => {
    playSound("pulse");
    const { error, data } = await claim();
    if (error) { toast.error(error); return; }
    const reward = (data as { reward?: { title?: string }; prestige_unlocked?: boolean } | null)?.reward;
    toast.success(reward?.title ? `Claimed: ${reward.title}` : "Reward claimed!");
    if ((data as { prestige_unlocked?: boolean } | null)?.prestige_unlocked) {
      toast.success("Prestige Streak unlocked!");
    }
  };

  if (!nextReward) return null;

  return (
    <div className="streak-page">
      <div className="streak-shell">
        <StreakHeader
          onBack={() => { playSound("tick"); navigate(-1); }}
          onInfo={() => toast.info("Claim once every 24 hours. Missing 48 hours resets your streak.")}
        />
        <main className="streak-content">
          <StreakHero day={currentDay} countdown={countdown} nextReward={nextReward} canClaim={canClaim} />
          {broken && <p className="streak-broken">Streak reset — your next claim begins again at Day 1.</p>}
          <Button className="streak-claim-button" onClick={onClaim} disabled={!canClaim || claiming || loading}>
            {claiming && <LoaderCircle className="animate-spin" aria-hidden />}
            {claiming ? "Claiming" : canClaim ? `Claim Day ${nextDay} Reward` : `Available in ${countdown}`}
          </Button>
          <DailyRewardCarousel
            rewards={dailyRewards}
            currentDay={currentDay}
            nextDay={nextDay}
            canClaim={canClaim}
            selectedDay={selectedDay}
            onSelect={setSelectedDay}
          />
          <StreakMilestones currentDay={currentDay} />
          <StreakWarning />
          <p className="streak-footnote">Progress Tokens and coupons are stored in your wallet. Bonus coins cannot be withdrawn.</p>
        </main>
      </div>
      <BottomNav activeOverride="/profile" />
    </div>
  );
};

export default DailyStreak;
