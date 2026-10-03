export type SpinRewardType = "bonus_coins" | "br_tokens" | "discount_coupon" | "no_luck";
export interface SpinReward { slot: number; name: string; reward_type: SpinRewardType; value: number; weight: number; enabled: boolean; }
export interface SpinSettings { enabled: boolean; daily_limit: number; }
export interface SpinResult { id: string; reward_slot: number; reward_name: string; reward_type: SpinRewardType; reward_value: number; spin_day: string; }
export const defaultSpinRewards: SpinReward[] = [
  { slot: 1, name: "5 BONUS COINS", reward_type: "bonus_coins", value: 5, weight: 1, enabled: true },
  { slot: 2, name: "1 BR TOKEN", reward_type: "br_tokens", value: 1, weight: 1, enabled: true },
  { slot: 3, name: "10 BONUS COINS", reward_type: "bonus_coins", value: 10, weight: 1, enabled: true },
  { slot: 4, name: "1 DISCOUNT COUPON", reward_type: "discount_coupon", value: 20, weight: 1, enabled: true },
  { slot: 5, name: "15 BONUS COINS", reward_type: "bonus_coins", value: 15, weight: 1, enabled: true },
  { slot: 6, name: "2 BR TOKENS", reward_type: "br_tokens", value: 2, weight: 1, enabled: true },
  { slot: 7, name: "NO LUCK", reward_type: "no_luck", value: 0, weight: 1, enabled: true },
  { slot: 8, name: "20 BONUS COINS", reward_type: "bonus_coins", value: 20, weight: 1, enabled: true },
];
