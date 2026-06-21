import freeMatchImg from "@/assets/card-free-match.jpg";
import battleRoyaleImg from "@/assets/card-battle-royale.jpg";
import classicSquadImg from "@/assets/card-classic-squad.jpg";
import loneWolfImg from "@/assets/card-lone-wolf.jpg";
import customRoomsImg from "@/assets/card-custom-rooms.jpg";
import weeklyRankingsImg from "@/assets/card-top-rankers.jpg";

export type Category =
  | "free_match"
  | "battle_royale"
  | "classic_squad"
  | "lone_wolf"
  | "custom_rooms"
  | "weekly_rankings";

export type CategoryTheme = {
  title: string;
  subtitle: string;
  rules: string[];
  image: string;
  /** Tailwind-friendly hex for inline styles only (glow shadows, badge bg). UI text uses semantic tokens. */
  color: string;
  colorSoft: string;
  prize: number;
};

export const CATEGORY_META: Record<Category, CategoryTheme> = {
  free_match: {
    title: "Free Matches",
    subtitle: "Daily • Free Entry",
    image: freeMatchImg,
    color: "hsl(191 100% 50%)",
    colorSoft: "hsl(191 100% 50% / 0.2)",
    prize: 5000,
    rules: ["Entry: Free", "Slots: 50 players", "Daily 5 matches"],
  },
  battle_royale: {
    title: "Battle Royale",
    subtitle: "Solo • Survival Mode",
    image: battleRoyaleImg,
    color: "hsl(0 100% 62%)",
    colorSoft: "hsl(0 100% 62% / 0.2)",
    prize: 50000,
    rules: ["Entry Fee: 5 coins", "Slots: 50 players", "Solo players only"],
  },
  classic_squad: {
    title: "Clash Squad",
    subtitle: "4v4 • Squad War",
    image: classicSquadImg,
    color: "hsl(271 91% 65%)",
    colorSoft: "hsl(271 91% 65% / 0.2)",
    prize: 25000,
    rules: ["Entry Fee: 10 coins", "Slots: 8 teams (4 vs 4)"],
  },
  lone_wolf: {
    title: "Lone Wolf",
    subtitle: "Duel • 2 Players",
    image: loneWolfImg,
    color: "hsl(142 71% 45%)",
    colorSoft: "hsl(142 71% 45% / 0.2)",
    prize: 10000,
    rules: ["Entry Fee: 10 coins", "Slots: 2 vs 2 (4 players total)"],
  },
  custom_rooms: {
    title: "Custom Rooms",
    subtitle: "Private • Custom Match",
    image: customRoomsImg,
    color: "hsl(54 100% 55%)",
    colorSoft: "hsl(54 100% 55% / 0.2)",
    prize: 15000,
    rules: ["Entry Fee: Custom", "Private rooms with your squad"],
  },
  weekly_rankings: {
    title: "Weekly Rankings",
    subtitle: "Weekly Top Hunters",
    image: weeklyRankingsImg,
    color: "hsl(28 100% 55%)",
    colorSoft: "hsl(28 100% 55% / 0.2)",
    prize: 20000,
    rules: ["Compete weekly", "Top players win coin rewards"],
  },
};
