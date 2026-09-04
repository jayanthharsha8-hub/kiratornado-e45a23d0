import type { StreakReward } from "@/hooks/useDailyStreak";

export type RewardKind =
  | "token"
  | "xp"
  | "coupon"
  | "frame"
  | "coins"
  | "username"
  | "banner"
  | "effect"
  | "cosmetic"
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
  { day: 1, kind: "token", rarity: "rare", shortTitle: "Progress Token", title: "Progress Token", br_tokens: 1 },
  { day: 2, kind: "xp", rarity: "standard", shortTitle: "200 XP", title: "200 XP" },
  { day: 3, kind: "coupon", rarity: "rare", shortTitle: "20% Coupon", title: "20% Discount Coupon", discount_percent: 20 },
  { day: 4, kind: "frame", rarity: "rare", shortTitle: "Profile Frame", title: "Profile Frame", unlock_key: "profile_frame_blue" },
  { day: 5, kind: "xp", rarity: "standard", shortTitle: "300 XP", title: "300 XP" },
  { day: 6, kind: "coins", rarity: "standard", shortTitle: "+5 Bonus Coins", title: "+5 Bonus Coins", bonus_coins: 5 },
  { day: 7, kind: "username", rarity: "epic", shortTitle: "Username Color", title: "Premium Username Color", unlock_key: "username_color_blue" },
  { day: 8, kind: "token", rarity: "rare", shortTitle: "Progress Token", title: "Progress Token", br_tokens: 1 },
  { day: 9, kind: "banner", rarity: "rare", shortTitle: "Avatar Banner", title: "Avatar Banner", unlock_key: "avatar_banner_blue" },
  { day: 10, kind: "xp", rarity: "standard", shortTitle: "400 XP", title: "400 XP" },
  { day: 11, kind: "coupon", rarity: "epic", shortTitle: "50% Coupon", title: "50% Discount Coupon", discount_percent: 50 },
  { day: 12, kind: "coins", rarity: "rare", shortTitle: "+10 Bonus Coins", title: "+10 Bonus Coins", bonus_coins: 10 },
  { day: 13, kind: "token", rarity: "rare", shortTitle: "Progress Token", title: "Progress Token", br_tokens: 1 },
  { day: 14, kind: "frame", rarity: "epic", shortTitle: "Exclusive Frame", title: "Exclusive Profile Frame", unlock_key: "profile_frame_purple" },
  { day: 15, kind: "xp", rarity: "standard", shortTitle: "500 XP", title: "500 XP" },
  { day: 16, kind: "username", rarity: "epic", shortTitle: "Username Color", title: "Premium Username Color", unlock_key: "username_color_purple" },
  { day: 17, kind: "coins", rarity: "rare", shortTitle: "+15 Bonus Coins", title: "+15 Bonus Coins", bonus_coins: 15 },
  { day: 18, kind: "token", rarity: "epic", shortTitle: "2 Progress Tokens", title: "2 Progress Tokens", br_tokens: 2 },
  { day: 19, kind: "effect", rarity: "epic", shortTitle: "Profile Effect", title: "Premium Profile Effect", unlock_key: "profile_effect_purple" },
  { day: 20, kind: "xp", rarity: "standard", shortTitle: "600 XP", title: "600 XP" },
  { day: 21, kind: "coupon", rarity: "rare", shortTitle: "20% Coupon", title: "20% Discount Coupon", discount_percent: 20 },
  { day: 22, kind: "coins", rarity: "rare", shortTitle: "+20 Bonus Coins", title: "+20 Bonus Coins", bonus_coins: 20 },
  { day: 23, kind: "token", rarity: "epic", shortTitle: "2 Progress Tokens", title: "2 Progress Tokens", br_tokens: 2 },
  { day: 24, kind: "cosmetic", rarity: "epic", shortTitle: "Avatar Cosmetic", title: "Exclusive Avatar Cosmetic", unlock_key: "avatar_cosmetic_purple" },
  { day: 25, kind: "xp", rarity: "standard", shortTitle: "700 XP", title: "700 XP" },
  { day: 26, kind: "coins", rarity: "rare", shortTitle: "+25 Bonus Coins", title: "+25 Bonus Coins", bonus_coins: 25 },
  { day: 27, kind: "token", rarity: "epic", shortTitle: "2 Progress Tokens", title: "2 Progress Tokens", br_tokens: 2 },
  { day: 28, kind: "banner", rarity: "epic", shortTitle: "Exclusive Banner", title: "Exclusive Banner", unlock_key: "exclusive_banner" },
  { day: 29, kind: "crate", rarity: "epic", shortTitle: "Reward Crate", title: "Premium Reward Crate", unlock_key: "premium_reward_crate" },
  { day: 30, kind: "legendary", rarity: "legendary", shortTitle: "Legendary Effect", title: "Legendary Profile Effect", unlock_key: "legendary_profile_effect" },
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