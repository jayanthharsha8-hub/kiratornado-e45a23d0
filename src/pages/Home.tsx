import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Wallet,
  Bell,
  Plus,
  CalendarCheck,
  Disc3,
  UserPlus,
  Tag,
  Gift,
  Headphones,
  Trophy,
  ChevronRight,
  Users,
  Gem,
  Clock,
  MessageSquare,
  ArrowRight,
  Flame,
  Parachute,
  Swords,
  Crown,
  DoorOpen,
  Dog,
} from "lucide-react";
import { SideMenu } from "@/components/SideMenu";
import { BottomNav } from "@/components/BottomNav";
import { Particles } from "@/components/Particles";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

/* ---------------- Neon Card (reusable frame) ---------------- */
const NeonCard = ({
  children,
  className,
  glow = "blue",
  radius = 18,
  onClick,
  as: As = "div" as any,
  style,
  ...rest
}: {
  children?: React.ReactNode;
  className?: string;
  glow?: "blue" | "purple" | "mixed" | "red" | "green" | "yellow" | "orange" | "pink";
  radius?: number;
  onClick?: () => void;
  as?: any;
  style?: React.CSSProperties;
} & Record<string, any>) => {
  const glows: Record<string, { border: string; shadow: string }> = {
    blue: {
      border: "rgba(0,229,255,0.55)",
      shadow:
        "0 0 0 1px rgba(0,229,255,0.35), 0 0 18px rgba(0,229,255,0.20), inset 0 0 22px rgba(0,229,255,0.06)",
    },
    purple: {
      border: "rgba(168,85,247,0.55)",
      shadow:
        "0 0 0 1px rgba(168,85,247,0.35), 0 0 18px rgba(168,85,247,0.20), inset 0 0 22px rgba(168,85,247,0.06)",
    },
    mixed: {
      border: "rgba(120,160,255,0.55)",
      shadow:
        "0 0 0 1px rgba(0,229,255,0.28), 0 0 20px rgba(0,229,255,0.18), 0 0 26px rgba(168,85,247,0.16), inset 0 0 20px rgba(120,160,255,0.05)",
    },
    red: { border: "rgba(255,80,80,0.6)", shadow: "0 0 0 1px rgba(255,80,80,0.4), 0 0 18px rgba(255,80,80,0.22)" },
    green: { border: "rgba(80,255,140,0.55)", shadow: "0 0 0 1px rgba(80,255,140,0.35), 0 0 18px rgba(80,255,140,0.2)" },
    yellow: { border: "rgba(255,210,80,0.6)", shadow: "0 0 0 1px rgba(255,210,80,0.4), 0 0 18px rgba(255,210,80,0.22)" },
    orange: { border: "rgba(255,150,60,0.6)", shadow: "0 0 0 1px rgba(255,150,60,0.4), 0 0 18px rgba(255,150,60,0.22)" },
    pink: { border: "rgba(255,90,180,0.6)", shadow: "0 0 0 1px rgba(255,90,180,0.4), 0 0 18px rgba(255,90,180,0.22)" },
  };
  const g = glows[glow];
  return (
    <As
      onClick={onClick}
      className={cn(
        "relative bg-[#0A0F1C]/85 backdrop-blur-sm transition-all duration-[250ms] hover:-translate-y-[1px]",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
      style={{
        borderRadius: radius,
        border: `1.2px solid ${g.border}`,
        boxShadow: g.shadow,
        ...style,
      }}
      {...rest}
    >
      {children}
    </As>
  );
};

/* ---------------- Placeholder Art ---------------- */
const ArtPlaceholder = ({
  label,
  from = "#0b1a3a",
  to = "#1a0b3a",
  className,
  style,
}: {
  label?: string;
  from?: string;
  to?: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={cn("relative overflow-hidden", className)}
    style={{
      background: `linear-gradient(135deg, ${from} 0%, #05070D 55%, ${to} 100%)`,
      ...style,
    }}
  >
    {/* diagonal shine */}
    <div
      className="absolute inset-0 opacity-40"
      style={{
        background:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 14px)",
      }}
    />
    {/* soft radial */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 50% 40%, rgba(0,229,255,0.20), transparent 60%), radial-gradient(circle at 70% 80%, rgba(168,85,247,0.18), transparent 55%)",
      }}
    />
    {label && (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-[10px] uppercase tracking-[0.3em] text-white/40">
          {label}
        </span>
      </div>
    )}
  </div>
);

/* ---------------- Header ---------------- */
const Header = ({ coins, onWallet }: { coins: number; onWallet: () => void }) => (
  <header
    className="flex items-center gap-3"
    style={{ height: 72 }}
  >
    {/* Logo 52x52 */}
    <SideMenu>
      <button
        aria-label="Open menu"
        className="relative flex items-center gap-2"
        onClick={() => playSound("tick")}
      >
        <div
          className="grid place-items-center rounded-full border-[1.2px]"
          style={{
            width: 52,
            height: 52,
            borderColor: "rgba(0,229,255,0.7)",
            background:
              "radial-gradient(circle, rgba(0,229,255,0.18), rgba(10,15,28,0.6))",
            boxShadow:
              "0 0 12px rgba(0,229,255,0.45), inset 0 0 8px rgba(0,229,255,0.25)",
          }}
        >
          <Crown className="h-6 w-6 text-cyan-300" strokeWidth={2} />
        </div>
        {/* Title 125px */}
        <div className="leading-none" style={{ width: 125 }}>
          <div
            className="font-display font-black uppercase text-white"
            style={{
              fontSize: 18,
              letterSpacing: "0.06em",
              textShadow: "0 0 10px rgba(0,229,255,0.6)",
            }}
          >
            KIRA
          </div>
          <div
            className="font-display font-bold uppercase text-white/70"
            style={{ fontSize: 11, letterSpacing: "0.28em" }}
          >
            TORNADO
          </div>
        </div>
      </button>
    </SideMenu>

    {/* Menu button 46x46 */}
    <SideMenu>
      <button
        aria-label="Menu"
        className="grid place-items-center rounded-[12px] border-[1.2px] transition hover:scale-[1.03]"
        style={{
          width: 46,
          height: 46,
          borderColor: "rgba(0,229,255,0.55)",
          background: "rgba(10,15,28,0.75)",
          boxShadow: "0 0 10px rgba(0,229,255,0.25)",
        }}
        onClick={() => playSound("tick")}
      >
        <Menu className="h-5 w-5 text-cyan-300" />
      </button>
    </SideMenu>

    <div className="flex-1" />

    {/* Wallet card 160x54 */}
    <button
      onClick={onWallet}
      className="group flex items-center gap-2 px-3 transition hover:scale-[1.02]"
      style={{
        width: 160,
        height: 54,
        borderRadius: 14,
        border: "1.2px solid rgba(0,229,255,0.6)",
        background:
          "linear-gradient(135deg, rgba(0,229,255,0.10), rgba(10,15,28,0.9))",
        boxShadow:
          "0 0 14px rgba(0,229,255,0.3), inset 0 0 10px rgba(0,229,255,0.08)",
      }}
    >
      <Wallet className="h-6 w-6 shrink-0 text-cyan-300" strokeWidth={2} />
      <div className="min-w-0 flex-1 text-left leading-tight">
        <div
          className="truncate font-display font-black text-white"
          style={{
            fontSize: 16,
            letterSpacing: "0.02em",
            textShadow: "0 0 8px rgba(0,229,255,0.55)",
          }}
        >
          {coins.toLocaleString()}
        </div>
        <div
          className="font-display font-semibold text-cyan-300/80"
          style={{ fontSize: 9, letterSpacing: "0.24em" }}
        >
          COINS
        </div>
      </div>
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-black"
        style={{
          background: "rgba(0,229,255,0.9)",
          boxShadow: "0 0 8px rgba(0,229,255,0.9)",
        }}
      >
        <Plus className="h-3 w-3" strokeWidth={3} />
      </span>
    </button>

    {/* Notification 42x42 */}
    <button
      aria-label="Notifications"
      className="relative grid place-items-center rounded-full border-[1.2px] transition hover:scale-[1.05]"
      style={{
        width: 42,
        height: 42,
        borderColor: "rgba(0,229,255,0.5)",
        background: "rgba(10,15,28,0.75)",
        boxShadow: "0 0 8px rgba(0,229,255,0.22)",
      }}
      onClick={() => playSound("tick")}
    >
      <Bell className="h-5 w-5 text-cyan-200" />
      <span
        className="absolute right-1 top-1 h-2 w-2 rounded-full"
        style={{ background: "#ff3860", boxShadow: "0 0 6px #ff3860" }}
      />
    </button>
  </header>
);

/* ---------------- Main Banner ---------------- */
const MainBanner = () => {
  const [index, setIndex] = useState(0);
  const slides = [0, 1, 2, 3];
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <NeonCard glow="mixed" className="overflow-hidden" style={{ height: 190, padding: 18 }}>
        <ArtPlaceholder
          label="MEGA TOURNAMENT"
          from="#0d1a3f"
          to="#2a0d3f"
          className="absolute inset-0"
        />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span
              className="rounded-md px-2 py-1 font-display text-[9px] font-bold uppercase tracking-[0.2em] text-white"
              style={{
                background: "linear-gradient(90deg, #6d28d9, #a855f7)",
                boxShadow: "0 0 12px rgba(168,85,247,0.55)",
              }}
            >
              Mega Event
            </span>
            <div className="text-right leading-tight">
              <div className="font-display text-[10px] font-semibold uppercase tracking-widest text-white/70">
                15 — 20 JUN
              </div>
              <div
                className="font-display text-sm font-black text-white"
                style={{ textShadow: "0 0 6px rgba(0,229,255,0.6)" }}
              >
                8:00 PM
              </div>
            </div>
          </div>

          <div>
            <h2
              className="font-display font-black uppercase leading-[0.95]"
              style={{
                fontSize: 26,
                background:
                  "linear-gradient(90deg, #ffffff, #a855f7 60%, #00e5ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.02em",
              }}
            >
              MEGA
              <br />
              TOURNAMENT
            </h2>
            <div className="mt-2 flex items-end justify-between">
              <button
                className="group flex items-center gap-2 rounded-[10px] border-[1.2px] px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-widest text-white transition hover:scale-[1.03]"
                style={{
                  borderColor: "rgba(0,229,255,0.7)",
                  background: "rgba(0,229,255,0.08)",
                  boxShadow: "0 0 10px rgba(0,229,255,0.35)",
                }}
              >
                Join Now
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <div
                className="rounded-[10px] border-[1.2px] px-3 py-1 text-right"
                style={{
                  borderColor: "rgba(0,229,255,0.55)",
                  background: "rgba(0,229,255,0.06)",
                }}
              >
                <div className="font-display text-[8px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                  Prize Pool
                </div>
                <div
                  className="font-display text-sm font-black text-cyan-300"
                  style={{ textShadow: "0 0 8px rgba(0,229,255,0.6)" }}
                >
                  ₹50,000
                </div>
              </div>
            </div>
          </div>
        </div>
      </NeonCard>
      {/* Slider dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: index === i ? 24 : 10,
              height: 6,
              borderRadius: 999,
              background:
                index === i
                  ? "linear-gradient(90deg, #00e5ff, #a855f7)"
                  : "rgba(255,255,255,0.15)",
              boxShadow:
                index === i ? "0 0 8px rgba(0,229,255,0.55)" : "none",
              transition: "all 250ms",
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* ---------------- Quick Actions ---------------- */
const QUICK_ACTIONS = [
  { icon: CalendarCheck, label: "Daily Check-In", color: "#00e5ff" },
  { icon: Disc3, label: "Spin & Win", color: "#a855f7" },
  { icon: UserPlus, label: "Invite Friends", color: "#00e5ff" },
  { icon: Tag, label: "Offers", color: "#ffb020" },
  { icon: Gift, label: "Redeem", color: "#4ade80" },
  { icon: Headphones, label: "Support", color: "#c084fc" },
];

const QuickActions = () => (
  <NeonCard glow="blue" style={{ height: 88 }} className="px-2">
    <div className="grid h-full grid-cols-6 items-center">
      {QUICK_ACTIONS.map(({ icon: Icon, label, color }) => (
        <button
          key={label}
          onClick={() => playSound("tick")}
          className="flex h-full flex-col items-center justify-center gap-1.5 px-1 transition hover:-translate-y-0.5"
        >
          <div
            className="grid place-items-center rounded-[10px]"
            style={{
              width: 36,
              height: 36,
              border: `1.2px solid ${color}`,
              background: `${color}14`,
              boxShadow: `0 0 10px ${color}55`,
            }}
          >
            <Icon style={{ width: 20, height: 20, color }} strokeWidth={2} />
          </div>
          <span
            className="text-center font-display font-semibold uppercase leading-tight text-white/80"
            style={{ fontSize: 9, letterSpacing: "0.05em" }}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  </NeonCard>
);

/* ---------------- Top Tournaments ---------------- */
type TopTourney = {
  name: string;
  sub: string;
  slots: string;
  gems: number;
  time: string;
  prize: string;
  glow: "red" | "purple" | "blue";
  from: string;
  to: string;
  prizeColor: string;
};

const TOP_TOURNEYS: TopTourney[] = [
  {
    name: "SOLO WARS",
    sub: "SOLO • FULL MAP",
    slots: "50/50",
    gems: 20,
    time: "06:00 PM",
    prize: "₹5,000",
    glow: "red",
    from: "#3a0d0d",
    to: "#1a0b0b",
    prizeColor: "#ff5c5c",
  },
  {
    name: "CLASH FURY",
    sub: "SQUAD • 4V4",
    slots: "48/50",
    gems: 20,
    time: "07:30 PM",
    prize: "₹10,000",
    glow: "purple",
    from: "#2a0d3f",
    to: "#120a24",
    prizeColor: "#c084fc",
  },
  {
    name: "LONE HUNTER",
    sub: "LONE WOLF • 1V1",
    slots: "30/50",
    gems: 10,
    time: "08:00 PM",
    prize: "₹2,000",
    glow: "blue",
    from: "#0d1e3f",
    to: "#0a1424",
    prizeColor: "#00e5ff",
  },
];

const TopTournaments = ({ onViewAll }: { onViewAll: () => void }) => (
  <section>
    <div className="mb-3 flex items-center justify-between" style={{ height: 32 }}>
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-cyan-300" />
        <h3
          className="font-display font-black uppercase text-white"
          style={{ fontSize: 14, letterSpacing: "0.14em", textShadow: "0 0 8px rgba(0,229,255,0.4)" }}
        >
          Top Tournaments
        </h3>
      </div>
      <button
        onClick={onViewAll}
        className="flex items-center gap-1 font-display text-[11px] font-bold uppercase tracking-widest text-cyan-300"
      >
        View All <ArrowRight className="h-3 w-3" />
      </button>
    </div>
    <div
      className="grid gap-[14px]"
      style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
    >
      {TOP_TOURNEYS.map((t) => (
        <NeonCard key={t.name} glow={t.glow} className="overflow-hidden" style={{ height: 275 }}>
          <div className="relative" style={{ height: 130 }}>
            <ArtPlaceholder from={t.from} to={t.to} className="absolute inset-0" />
            <span
              className="absolute left-2 top-2 grid place-items-center rounded-md font-display font-black uppercase text-white"
              style={{
                width: 42,
                height: 22,
                fontSize: 10,
                letterSpacing: "0.1em",
                background: "linear-gradient(135deg, #ff2d55, #b91c1c)",
                boxShadow: "0 0 10px rgba(255,45,85,0.7)",
              }}
            >
              HOT
            </span>
          </div>
          <div className="flex flex-col gap-1.5 px-2.5 pt-2">
            <h4
              className="font-display font-black uppercase text-white"
              style={{ fontSize: 13, letterSpacing: "0.03em" }}
            >
              {t.name}
            </h4>
            <p
              className="font-display font-semibold uppercase"
              style={{
                fontSize: 9,
                letterSpacing: "0.12em",
                color: t.prizeColor,
              }}
            >
              {t.sub}
            </p>
            <div className="mt-1 flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1" style={{ fontSize: 9 }}>
                <Users className="h-3 w-3" /> {t.slots}
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: 9 }}>
                <Gem className="h-3 w-3 text-cyan-300" /> {t.gems}
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: 8 }}>
                <Clock className="h-3 w-3" /> {t.time}
              </span>
            </div>
          </div>
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-0.5 border-t"
            style={{
              height: 54,
              borderColor: `${t.prizeColor}55`,
              background: `linear-gradient(180deg, transparent, ${t.prizeColor}14)`,
            }}
          >
            <span className="font-display text-[9px] font-bold uppercase tracking-[0.24em] text-white/60">
              Win Prize
            </span>
            <span
              className="font-display font-black"
              style={{
                fontSize: 18,
                color: t.prizeColor,
                textShadow: `0 0 10px ${t.prizeColor}88`,
              }}
            >
              {t.prize}
            </span>
          </div>
        </NeonCard>
      ))}
    </div>
  </section>
);

/* ---------------- Categories ---------------- */
type CatCfg = {
  key: Category;
  title: string;
  subtitle: string;
  icon: any;
  glow: "blue" | "purple" | "green" | "yellow" | "pink";
  color: string;
};

const CATEGORY_CFG: CatCfg[] = [
  { key: "free_match", title: "Free Matches", subtitle: "Daily • Free Entry", icon: Parachute, glow: "blue", color: "#00e5ff" },
  { key: "battle_royale", title: "Battle Royale", subtitle: "Classic Battle", icon: Parachute, glow: "purple", color: "#a855f7" },
  { key: "classic_squad", title: "Clash Squad", subtitle: "4v4 • Intense Fight", icon: Swords, glow: "purple", color: "#c084fc" },
  { key: "lone_wolf", title: "Lone Wolf", subtitle: "Solo • Survival Mode", icon: Dog, glow: "green", color: "#4ade80" },
  { key: "custom_rooms", title: "Custom Rooms", subtitle: "Create & Play", icon: DoorOpen, glow: "yellow", color: "#ffd24d" },
  { key: "weekly_rankings", title: "Weekly Rankings", subtitle: "Compete & Rank", icon: Crown, glow: "pink", color: "#ff5aa0" },
];

const Categories = ({ onOpen, onViewAll }: { onOpen: (c: Category) => void; onViewAll: () => void }) => (
  <section>
    <div className="mb-3 flex items-center justify-between" style={{ height: 32 }}>
      <div className="flex items-center gap-2">
        <Swords className="h-4 w-4 text-cyan-300" />
        <h3
          className="font-display font-black uppercase text-white"
          style={{ fontSize: 14, letterSpacing: "0.14em", textShadow: "0 0 8px rgba(0,229,255,0.4)" }}
        >
          Categories
        </h3>
      </div>
      <button
        onClick={onViewAll}
        className="flex items-center gap-1 font-display text-[11px] font-bold uppercase tracking-widest text-cyan-300"
      >
        View All <ArrowRight className="h-3 w-3" />
      </button>
    </div>
    <div
      className="grid gap-[14px]"
      style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
    >
      {CATEGORY_CFG.map((c) => (
        <NeonCard
          key={c.key}
          glow={c.glow}
          radius={16}
          onClick={() => onOpen(c.key)}
          className="overflow-hidden"
          style={{ height: 128 }}
        >
          <div className="relative flex h-full flex-col justify-between p-3">
            <ArtPlaceholder
              from={`${c.color}22`}
              to="#0a0f1c"
              className="absolute inset-0"
            />
            <div className="relative flex items-start justify-between">
              <div
                className="grid place-items-center rounded-[12px]"
                style={{
                  width: 44,
                  height: 44,
                  border: `1.2px solid ${c.color}`,
                  background: `${c.color}14`,
                  boxShadow: `0 0 12px ${c.color}66`,
                }}
              >
                <c.icon style={{ width: 24, height: 24, color: c.color }} strokeWidth={2} />
              </div>
            </div>
            <div className="relative">
              <div
                className="font-display font-black uppercase text-white leading-tight"
                style={{ fontSize: 20, letterSpacing: "0.02em", textShadow: `0 0 8px ${c.color}88` }}
              >
                {c.title}
              </div>
              <div
                className="mt-0.5 font-display font-semibold uppercase text-white/60"
                style={{ fontSize: 12, letterSpacing: "0.08em" }}
              >
                {c.subtitle}
              </div>
            </div>
          </div>
        </NeonCard>
      ))}
    </div>
  </section>
);

/* ---------------- Hunter Chat CTA ---------------- */
const HunterChatCTA = ({ unread, onOpen }: { unread: number; onOpen: () => void }) => (
  <button
    onClick={onOpen}
    className="group flex w-full items-center gap-3 px-4 transition-all duration-[250ms] hover:-translate-y-0.5"
    style={{
      height: 88,
      borderRadius: 18,
      border: "1.2px solid rgba(140,120,255,0.65)",
      background:
        "linear-gradient(120deg, rgba(0,90,180,0.55) 0%, rgba(40,20,120,0.75) 55%, rgba(120,40,180,0.65) 100%)",
      boxShadow:
        "0 0 22px rgba(0,229,255,0.3), 0 0 26px rgba(168,85,247,0.28), inset 0 0 24px rgba(255,255,255,0.05)",
    }}
  >
    <div
      className="grid shrink-0 place-items-center rounded-[14px]"
      style={{
        width: 54,
        height: 54,
        border: "1.2px solid rgba(0,229,255,0.7)",
        background: "rgba(10,15,28,0.55)",
        boxShadow: "0 0 12px rgba(0,229,255,0.45)",
      }}
    >
      <MessageSquare className="h-6 w-6 text-cyan-200" strokeWidth={2} />
    </div>
    <div className="min-w-0 flex-1 text-left">
      <div
        className="font-display font-black uppercase leading-tight"
        style={{
          fontSize: 22,
          background:
            "linear-gradient(90deg, #ffffff, #00e5ff 45%, #c084fc 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "0.04em",
        }}
      >
        Hunter Chat
      </div>
      <div
        className="mt-0.5 font-display font-semibold uppercase text-white/70"
        style={{ fontSize: 10, letterSpacing: "0.22em" }}
      >
        Chat • Connect • Dominate
      </div>
    </div>
    {unread > 0 && (
      <span
        className="grid shrink-0 place-items-center rounded-full font-display font-black text-white"
        style={{
          minWidth: 30,
          height: 30,
          padding: "0 8px",
          fontSize: 12,
          background: "linear-gradient(135deg, #10b981, #059669)",
          boxShadow: "0 0 10px rgba(16,185,129,0.7)",
        }}
      >
        {unread > 99 ? "99+" : unread}
      </span>
    )}
    <ChevronRight
      className="shrink-0 text-white/80 transition group-hover:translate-x-0.5"
      style={{ width: 36, height: 36 }}
    />
  </button>
);

/* ---------------- Page ---------------- */
const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  const [unread, setUnread] = useState(128);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("coins")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => data && setCoins(data.coins ?? 0));
  }, [user]);

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "#05070D" }}
    >
      <Particles />
      <div
        className="relative mx-auto max-w-md"
        style={{
          paddingTop: 18,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 100, // space for floating bottom nav (84px + gap)
        }}
      >
        <Header coins={coins} onWallet={() => navigate("/wallet")} />

        <div style={{ height: 20 }} />
        <MainBanner />

        <div style={{ height: 20 }} />
        <QuickActions />

        <div style={{ height: 20 }} />
        <TopTournaments onViewAll={() => navigate("/tournaments")} />

        <div style={{ height: 20 }} />
        <Categories
          onOpen={(c) => {
            playSound("pulse");
            navigate(`/category/${c}`);
          }}
          onViewAll={() => navigate("/tournaments")}
        />

        <div style={{ height: 20 }} />
        <HunterChatCTA
          unread={unread}
          onOpen={() => {
            playSound("tick");
            setUnread(0);
            navigate("/hunter-chat");
          }}
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
