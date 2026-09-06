import type { StreakReward } from "@/hooks/useDailyStreak";

export type RewardKind =
  | "token"
  | "coupon"
  | "badge"
  | "background"
  | "frame"
  | "coins"
  | "username"
  | "crate"
  | "legendary";

export type RewardRarity = "standard" | "rare" | "epic" | "legendary";

export interface DailyReward extends StreakReward {
  kind: RewardKind;
  rarity: RewardRarity;
  shortTitle: string;
}

type RewardPreset = Pick<DailyReward, "day" | "kind" | "rarity" | "shortTitle"> & {
  title: string;
  bonus_coins?: number;
  br_tokens?: number;
  discount_percent?: number;
  unlock_key?: string;
};

export const REWARD_PRESETS: RewardPreset[] = [
  { day: 1, kind: "badge", rarity: "rare", shortTitle: "Profile Badge", title: "Profile Badge", unlock_key: "profile_badge" },
  { day: 2, kind: "token", rarity: "rare", shortTitle: "1 BR Token", title: "1 BR Token", br_tokens: 1 },
  { day: 3, kind: "coupon", rarity: "rare", shortTitle: "20% Discount Coupon", title: "20% Discount Coupon", discount_percent: 20 },
  { day: 4, kind: "background", rarity: "epic", shortTitle: "Profile Background", title: "Profile Background", unlock_key: "profile_background" },
  { day: 5, kind: "coupon", rarity: "legendary", shortTitle: "50% Discount Coupon", title: "50% Discount Coupon", discount_percent: 50 },
  { day: 6, kind: "token", rarity: "rare", shortTitle: "1 BR Token", title: "1 BR Token", br_tokens: 1 },
  { day: 7, kind: "username", rarity: "epic", shortTitle: "Premium Username Colour", title: "Premium Username Colour", unlock_key: "premium_username_colour" },
  { day: 8, kind: "token", rarity: "rare", shortTitle: "1 BR Token", title: "1 BR Token", br_tokens: 1 },
  { day: 9, kind: "frame", rarity: "rare", shortTitle: "Avatar Border", title: "Avatar Border", unlock_key: "avatar_border" },
  { day: 10, kind: "crate", rarity: "epic", shortTitle: "Milestone Cache", title: "Milestone Cache", unlock_key: "milestone_cache" },
  { day: 11, kind: "token", rarity: "rare", shortTitle: "1 BR Token", title: "1 BR Token", br_tokens: 1 },
  { day: 12, kind: "coupon", rarity: "rare", shortTitle: "20% Discount Coupon", title: "20% Discount Coupon", discount_percent: 20 },
  { day: 13, kind: "coins", rarity: "standard", shortTitle: "+5 Bonus Coins", title: "+5 Bonus Coins", bonus_coins: 5 },
  { day: 14, kind: "token", rarity: "epic", shortTitle: "1 BR Token", title: "1 BR Token", br_tokens: 1 },
  { day: 15, kind: "coupon", rarity: "legendary", shortTitle: "50% Discount Coupon", title: "50% Discount Coupon", discount_percent: 50 },
  { day: 16, kind: "coins", rarity: "standard", shortTitle: "+10 Bonus Coins", title: "+10 Bonus Coins", bonus_coins: 10 },
  { day: 17, kind: "token", rarity: "rare", shortTitle: "1 BR Token", title: "1 BR Token", br_tokens: 1 },
  { day: 18, kind: "coupon", rarity: "epic", shortTitle: "20% Discount Coupon", title: "20% Discount Coupon", discount_percent: 20 },
  { day: 19, kind: "token", rarity: "legendary", shortTitle: "2 BR Tokens", title: "2 BR Tokens", br_tokens: 2 },
  { day: 20, kind: "frame", rarity: "epic", shortTitle: "Premium Profile Frame", title: "Premium Profile Frame", unlock_key: "premium_profile_frame" },
  { day: 21, kind: "token", rarity: "rare", shortTitle: "1 BR Token", title: "1 BR Token", br_tokens: 1 },
  { day: 22, kind: "coupon", rarity: "rare", shortTitle: "20% Discount Coupon", title: "20% Discount Coupon", discount_percent: 20 },
  { day: 23, kind: "coins", rarity: "standard", shortTitle: "+10 Bonus Coins", title: "+10 Bonus Coins", bonus_coins: 10 },
  { day: 24, kind: "token", rarity: "rare", shortTitle: "1 BR Token", title: "1 BR Token", br_tokens: 1 },
  { day: 25, kind: "coupon", rarity: "legendary", shortTitle: "20% Discount Coupon", title: "20% Discount Coupon", discount_percent: 20 },
  { day: 26, kind: "token", rarity: "epic", shortTitle: "2 BR Tokens", title: "2 BR Tokens", br_tokens: 2 },
  { day: 27, kind: "coins", rarity: "standard", shortTitle: "+15 Bonus Coins", title: "+15 Bonus Coins", bonus_coins: 15 },
  { day: 28, kind: "token", rarity: "rare", shortTitle: "1 BR Token", title: "1 BR Token", br_tokens: 1 },
  { day: 29, kind: "coupon", rarity: "legendary", shortTitle: "50% Discount Coupon", title: "50% Discount Coupon", discount_percent: 50 },
  { day: 30, kind: "legendary", rarity: "legendary", shortTitle: "Monarch Cache + 1 Spin Wheel Ticket", title: "Monarch Cache + 1 Spin Wheel Ticket", unlock_key: "monarch_cache_spin_ticket" },
];

const inferKind = (reward: StreakReward, fallback: RewardKind): RewardKind => {
  if (reward.br_tokens > 0) return "token";
  if (reward.discount_percent > 0) return "coupon";
  if (reward.bonus_coins > 0) return "coins";
  return fallback;
};

export const normalizeRewards = (remote: StreakReward[]): DailyReward[] =>
  REWARD_PRESETS.map((preset) => {
    const reward = remote.find((item) => item.day === preset.day);
    const base: StreakReward = {
      id: `streak-day-${preset.day}`,
      day: preset.day,
      title: preset.title,
      description: "Daily progression reward",
      image_url: null,
      bonus_coins: preset.bonus_coins ?? 0,
      br_tokens: preset.br_tokens ?? 0,
      discount_percent: preset.discount_percent ?? 0,
      unlock_key: preset.unlock_key ?? null,
      unlock_days: null,
      enabled: true,
    };

    const merged = reward ? { ...base, ...reward } : base;
    return {
      ...merged,
      kind: inferKind(merged, preset.kind),
      rarity: preset.rarity,
      shortTitle: reward?.title || preset.shortTitle,
    };
  });