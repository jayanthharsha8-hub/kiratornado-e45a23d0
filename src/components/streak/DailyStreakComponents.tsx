import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowLeft,
  BadgePercent,
  CalendarDays,
  Check,
  Coins,
  Crown,
  Gift,
  Home,
  Info,
  LockKeyhole,
  Shield,
  Sparkles,
  Swords,
  Ticket,
  Timer,
  Trophy,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DailyReward, RewardKind, RewardRarity } from "@/lib/streakRewards";

export type RewardStatus = "claimed" | "available" | "locked" | "upcoming";

const rewardIcons: Record<RewardKind, typeof Gift> = {
  token: Ticket,
  xp: Sparkles,
  coupon: BadgePercent,
  frame: Shield,
  coins: Coins,
  username: Crown,
  banner: Trophy,
  effect: Sparkles,
  cosmetic: Shield,
  crate: Gift,
  legendary: Crown,
};

export const RewardVisual = ({ reward, compact = false }: { reward: DailyReward; compact?: boolean }) => {
  const Icon = rewardIcons[reward.kind];
  return (
    <div className={cn("streak-reward-visual", `streak-rarity-${reward.rarity}`, compact && "streak-reward-visual-compact")}>
      {reward.image_url ? (
        <img src={reward.image_url} alt="" className="h-full w-full object-contain" loading="lazy" />
      ) : (
        <>
          <span className="streak-reward-aura" aria-hidden />
          <Icon aria-hidden className="streak-reward-icon" />
          {reward.kind === "xp" && <span className="streak-reward-monogram">XP</span>}
          {reward.kind === "token" && <span className="streak-reward-monogram">×</span>}
        </>
      )}
    </div>
  );
};

export const StreakHeader = ({ onBack, onInfo }: { onBack: () => void; onInfo: () => void }) => (
  <header className="streak-header">
    <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back" className="streak-icon-button">
      <ArrowLeft />
    </Button>
    <div className="min-w-0 text-center">
      <h1 className="streak-page-title">Daily Streak</h1>
      <p className="streak-page-subtitle">Play daily. Earn rewards. Keep your streak alive!</p>
    </div>
    <Button variant="ghost" size="icon" onClick={onInfo} aria-label="Daily streak information" className="streak-icon-button">
      <Info />
    </Button>
  </header>
);

const milestones = [1, 2, 3, 7, 14, 30];

export const StreakProgress = ({ day }: { day: number }) => (
  <div className="streak-progress" aria-label={`Day ${day} of 30`}>
    <div className="streak-progress-track" aria-hidden>
      <span style={{ width: `${Math.min(100, (day / 30) * 100)}%` }} />
    </div>
    {milestones.map((milestone) => {
      const complete = day >= milestone;
      const current = day === milestone || (milestone === 1 && day === 0);
      return (
        <div key={milestone} className={cn("streak-progress-node", complete && "is-complete", current && "is-current")}>
          {complete && milestone < day ? <Check aria-hidden /> : milestone}
        </div>
      );
    })}
  </div>
);

export const NextRewardTimer = ({ countdown, nextReward, canClaim }: { countdown: string; nextReward: DailyReward; canClaim: boolean }) => (
  <div className="streak-next-panel">
    <div className="streak-next-column">
      <p className="streak-kicker">Next reward in</p>
      <div className="streak-timer"><Timer aria-hidden /> <span>{canClaim ? "READY NOW" : countdown}</span></div>
    </div>
    <div className="streak-next-divider" aria-hidden />
    <div className="streak-next-column">
      <p className="streak-kicker">Next reward</p>
      <div className="streak-next-reward">
        <RewardVisual reward={nextReward} compact />
        <span>{nextReward.shortTitle}</span>
      </div>
    </div>
  </div>
);

export const StreakHero = ({ day, countdown, nextReward, canClaim }: { day: number; countdown: string; nextReward: DailyReward; canClaim: boolean }) => {
  const tier: RewardRarity = day >= 30 ? "legendary" : day >= 14 ? "epic" : day >= 7 ? "rare" : "standard";
  return (
    <section className="streak-hero">
      <div className="streak-hero-copy">
        <p className="streak-label">Current streak</p>
        <p className="streak-day">Day {day}</p>
        <p className="streak-support">{day === 0 ? "Claim today's reward" : "Keep it up! Play tomorrow"}<br />to continue your streak.</p>
      </div>
      <div className={cn("streak-emblem", `streak-rarity-${tier}`)} aria-label={`Current streak day ${day}`}>
        <span className="streak-emblem-ring" aria-hidden />
        <span>{day}</span>
      </div>
      <div className="streak-hero-progress"><StreakProgress day={day} /></div>
      <NextRewardTimer countdown={countdown} nextReward={nextReward} canClaim={canClaim} />
    </section>
  );
};

export const DailyRewardCard = ({ reward, status, selected, onSelect }: { reward: DailyReward; status: RewardStatus; selected: boolean; onSelect: () => void }) => (
  <button
    type="button"
    onClick={onSelect}
    data-reward-day={reward.day}
    aria-label={`Day ${reward.day}, ${reward.title}, ${status}`}
    aria-pressed={selected}
    className={cn("streak-reward-card", `streak-rarity-${reward.rarity}`, `is-${status}`, selected && "is-selected")}
  >
    <span className="streak-card-day">Day {reward.day}</span>
    <RewardVisual reward={reward} />
    <span className="streak-card-title">{reward.shortTitle}</span>
    <span className="streak-card-status">
      {status === "claimed" ? <><Check aria-hidden /> Claimed</> : status === "available" ? "Available" : <><LockKeyhole aria-hidden /> {status}</>}
    </span>
  </button>
);

export const DailyRewardCarousel = ({ rewards, currentDay, nextDay, canClaim, selectedDay, onSelect }: {
  rewards: DailyReward[];
  currentDay: number;
  nextDay: number;
  canClaim: boolean;
  selectedDay: number;
  onSelect: (day: number) => void;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const focusDay = canClaim ? nextDay : Math.max(1, currentDay);

  useEffect(() => {
    const item = trackRef.current?.querySelector<HTMLElement>(`[data-reward-day="${focusDay}"]`);
    item?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [focusDay]);

  return (
    <section className="streak-rewards-section">
      <div className="streak-section-heading">
        <h2>Daily Rewards</h2>
        <span><CalendarDays aria-hidden /> 30 Day Cycle</span>
      </div>
      <div ref={trackRef} className="streak-reward-track">
        {rewards.map((reward) => {
          const status: RewardStatus = reward.day <= currentDay
            ? "claimed"
            : reward.day === nextDay && canClaim
              ? "available"
              : reward.day === nextDay
                ? "upcoming"
                : "locked";
          return <DailyRewardCard key={reward.id} reward={reward} status={status} selected={selectedDay === reward.day} onSelect={() => onSelect(reward.day)} />;
        })}
      </div>
      <div className="streak-carousel-hint" aria-hidden><span /> Swipe to explore all 30 rewards <span /></div>
    </section>
  );
};

const milestoneData = [
  { day: 7, rarity: "rare" as const, title: "Epic Avatar Frame" },
  { day: 14, rarity: "epic" as const, title: "Exclusive Banner + XP" },
  { day: 30, rarity: "legendary" as const, title: "Legendary Profile Effect" },
];

export const MilestoneCard = ({ day, rarity, title, unlocked }: { day: number; rarity: RewardRarity; title: string; unlocked: boolean }) => (
  <article className={cn("streak-milestone-card", `streak-rarity-${rarity}`, unlocked && "is-unlocked")}>
    <div className="streak-milestone-badge"><Crown aria-hidden /><strong>{day}</strong><span>Days</span></div>
    <p>{title}</p>
    {unlocked ? <Check aria-label="Unlocked" /> : <LockKeyhole aria-label="Locked" />}
  </article>
);

export const StreakMilestones = ({ currentDay }: { currentDay: number }) => (
  <section className="streak-milestones">
    <div className="streak-section-heading"><h2>Streak Milestones</h2></div>
    <div className="streak-milestone-grid">
      {milestoneData.map((item) => <MilestoneCard key={item.day} {...item} unlocked={currentDay >= item.day} />)}
    </div>
  </section>
);

export const StreakWarning = () => (
  <aside className="streak-warning">
    <span><CalendarDays aria-hidden /></span>
    <div><h2>Don't break your streak!</h2><p>Missed a day? Your streak will reset back to Day 1.</p></div>
  </aside>
);

const streakTabs = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/tournaments", label: "Tournaments", Icon: Trophy },
  { to: "/category/free_match", label: "Matches", Icon: Swords },
  { to: "/wallet", label: "Wallet", Icon: Wallet },
  { to: "/profile", label: "Profile", Icon: User },
];

export const BottomNavigation = () => (
  <nav className="streak-bottom-nav" aria-label="Main navigation">
    {streakTabs.map(({ to, label, Icon }) => (
      <NavLink key={to} to={to} className={cn("streak-nav-link", label === "Profile" && "is-active")}>
        <Icon aria-hidden />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);