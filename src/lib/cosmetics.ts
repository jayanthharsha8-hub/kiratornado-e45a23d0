/**
 * ZEOX cosmetic catalogue.
 * Items are unlocked through Daily Streak rewards (user_unlocks.unlock_key),
 * by reaching a player level, or are free starter items.
 * Equipped selections are stored on profiles.cosmetics (jsonb).
 */

export type CosmeticSlot =
  | "border"
  | "background"
  | "frame"
  | "username_colour"
  | "name_glow"
  | "badge"
  | "username_style";

export interface CosmeticItem {
  id: string;
  slot: CosmeticSlot;
  name: string;
  /** CSS value used for the preview swatch / applied style */
  value: string;
  unlockKey?: string;
  level?: number;
  free?: boolean;
  hint: string;
}

export const SLOT_LABELS: Record<CosmeticSlot, string> = {
  border: "Avatar Border",
  background: "Profile Background",
  frame: "Profile Frame",
  username_colour: "Username Colour",
  name_glow: "Name Glow",
  badge: "Profile Badge",
  username_style: "Username Style",
};

export const COSMETICS: CosmeticItem[] = [
  // Avatar borders
  { id: "border_default", slot: "border", name: "Standard", value: "hsl(185 100% 50% / 0.7)", free: true, hint: "Default" },
  { id: "border_cyan", slot: "border", name: "Neon Cyan", value: "hsl(185 100% 55%)", unlockKey: "avatar_border", hint: "Streak Day 9" },
  { id: "border_violet", slot: "border", name: "Shadow Violet", value: "hsl(270 90% 65%)", level: 25, hint: "Level 25" },
  { id: "border_gold", slot: "border", name: "Monarch Gold", value: "hsl(45 95% 58%)", unlockKey: "monarch_cache_spin_ticket", hint: "Streak Day 30" },
  { id: "border_magenta", slot: "border", name: "Rift Magenta", value: "hsl(315 90% 62%)", level: 50, hint: "Level 50" },

  // Profile backgrounds
  { id: "bg_default", slot: "background", name: "Deep Void", value: "radial-gradient(120% 90% at 50% 0%, hsl(215 60% 12% / .8), transparent 70%)", free: true, hint: "Default" },
  { id: "bg_abyss", slot: "background", name: "Abyss Blue", value: "radial-gradient(120% 90% at 50% 0%, hsl(200 95% 30% / .55), transparent 72%)", unlockKey: "profile_background", hint: "Streak Day 4" },
  { id: "bg_nebula", slot: "background", name: "Nebula", value: "radial-gradient(120% 90% at 50% 0%, hsl(275 85% 40% / .5), transparent 72%)", level: 30, hint: "Level 30" },
  { id: "bg_ember", slot: "background", name: "Ember Rift", value: "radial-gradient(120% 90% at 50% 0%, hsl(20 90% 45% / .45), transparent 72%)", unlockKey: "milestone_cache", hint: "Streak Day 10" },
  { id: "bg_monarch", slot: "background", name: "Monarch Throne", value: "radial-gradient(120% 90% at 50% 0%, hsl(45 90% 45% / .4), transparent 70%)", unlockKey: "monarch_cache_spin_ticket", hint: "Streak Day 30" },

  // Profile frames
  { id: "frame_none", slot: "frame", name: "None", value: "none", free: true, hint: "Default" },
  { id: "frame_hud", slot: "frame", name: "HUD Frame", value: "hsl(185 100% 55%)", level: 15, hint: "Level 15" },
  { id: "frame_premium", slot: "frame", name: "Premium Frame", value: "hsl(270 90% 68%)", unlockKey: "premium_profile_frame", hint: "Streak Day 20" },
  { id: "frame_royal", slot: "frame", name: "Royal Frame", value: "hsl(45 95% 60%)", unlockKey: "monarch_cache_spin_ticket", hint: "Streak Day 30" },

  // Username colours
  { id: "name_white", slot: "username_colour", name: "Classic", value: "hsl(210 40% 98%)", free: true, hint: "Default" },
  { id: "name_cyan", slot: "username_colour", name: "Cyan", value: "hsl(185 100% 60%)", free: true, hint: "Default" },
  { id: "name_premium", slot: "username_colour", name: "Premium Aurora", value: "hsl(285 95% 72%)", unlockKey: "premium_username_colour", hint: "Streak Day 7" },
  { id: "name_gold", slot: "username_colour", name: "Monarch Gold", value: "hsl(45 95% 62%)", unlockKey: "monarch_cache_spin_ticket", hint: "Streak Day 30" },
  { id: "name_emerald", slot: "username_colour", name: "Emerald", value: "hsl(150 80% 55%)", level: 40, hint: "Level 40" },

  // Name glow
  { id: "glow_none", slot: "name_glow", name: "No Glow", value: "none", free: true, hint: "Default" },
  { id: "glow_soft", slot: "name_glow", name: "Soft Glow", value: "0 0 6px currentColor", free: true, hint: "Default" },
  { id: "glow_strong", slot: "name_glow", name: "Intense Glow", value: "0 0 8px currentColor, 0 0 18px currentColor", level: 20, hint: "Level 20" },
  { id: "glow_prism", slot: "name_glow", name: "Prism Glow", value: "0 0 8px hsl(285 95% 70%), 0 0 20px hsl(185 100% 55%)", unlockKey: "premium_username_colour", hint: "Streak Day 7" },

  // Badges
  { id: "badge_none", slot: "badge", name: "None", value: "none", free: true, hint: "Default" },
  { id: "badge_hunter", slot: "badge", name: "Hunter Badge", value: "shield", unlockKey: "profile_badge", hint: "Streak Day 1" },
  { id: "badge_verified", slot: "badge", name: "Verified", value: "check", level: 25, hint: "Level 25" },
  { id: "badge_monarch", slot: "badge", name: "Monarch Crown", value: "crown", unlockKey: "monarch_cache_spin_ticket", hint: "Streak Day 30" },

  // Username styles
  { id: "style_normal", slot: "username_style", name: "Normal", value: "none", free: true, hint: "Default" },
  { id: "style_upper", slot: "username_style", name: "Uppercase", value: "uppercase", free: true, hint: "Default" },
  { id: "style_wide", slot: "username_style", name: "Wide Tracking", value: "wide", level: 10, hint: "Level 10" },
];

export const TOTAL_COSMETICS = COSMETICS.length;

export type EquippedCosmetics = Partial<Record<CosmeticSlot, string>>;

export const DEFAULT_EQUIPPED: EquippedCosmetics = {
  border: "border_default",
  background: "bg_default",
  frame: "frame_none",
  username_colour: "name_white",
  name_glow: "glow_soft",
  badge: "badge_none",
  username_style: "style_normal",
};

export const isUnlocked = (item: CosmeticItem, unlockKeys: string[], level: number) => {
  if (item.free) return true;
  if (item.unlockKey && unlockKeys.includes(item.unlockKey)) return true;
  if (item.level && level >= item.level) return true;
  return false;
};

export const getItem = (id?: string) => COSMETICS.find((c) => c.id === id);

export const cosmeticsBySlot = (slot: CosmeticSlot) => COSMETICS.filter((c) => c.slot === slot);
