import { NavLink, useLocation } from "react-router-dom";
import { Trophy, Swords, Home, Wallet, User } from "lucide-react";
import { playSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

/**
 * Edge-attached bottom navigation with a single continuous frame.
 * The top border rises smoothly around the centered HOME tab,
 * matching the reference image: one connected component, not stacked pieces.
 */

type Tab = {
  to: string;
  label: string;
  Icon: typeof Home;
  center?: boolean;
};

const TABS: Tab[] = [
  { to: "/leaderboard", label: "Leaderboard", Icon: Trophy },
  { to: "/tournaments", label: "Matches", Icon: Swords },
  { to: "/home", label: "Home", Icon: Home, center: true },
  { to: "/wallet", label: "Wallet", Icon: Wallet },
  { to: "/profile", label: "Profile", Icon: User },
];

const NEON = "hsl(199 100% 58%)";

// SVG viewBox geometry — 400 wide x 80 tall
// Path traces a continuous frame: left section -> rises -> over HOME -> falls -> right section
// HOME bump enlarged: width ~170 (115..285), height ~24 (side-top y=26, peak y=2)
const FRAME_PATH =
  "M 14 26 \
   Q 4 26 4 36 \
   L 4 70 \
   Q 4 80 14 80 \
   L 386 80 \
   Q 396 80 396 70 \
   L 396 36 \
   Q 396 26 386 26 \
   L 295 26 \
   Q 287 26 282 19 \
   L 270 6 \
   Q 266 2 260 2 \
   L 140 2 \
   Q 134 2 130 6 \
   L 118 19 \
   Q 113 26 105 26 \
   Z";

export const BottomNav = ({ activeOverride }: { activeOverride?: string }) => {
  const { pathname } = useLocation();
  const isActive = (to: string) => activeOverride
    ? to === activeOverride
    : pathname === to || (to === "/wallet" && pathname.startsWith("/wallet"));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div
        className="relative w-full"
        style={{
          height: 78,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <svg
          viewBox="0 0 400 82"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(6,11,20,0.95)" />
              <stop offset="100%" stopColor="rgba(2,4,9,0.99)" />
            </linearGradient>
            <filter id="navGlow" x="-15%" y="-40%" width="130%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="b1" />
              <feMerge>
                <feMergeNode in="b1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={FRAME_PATH} fill="url(#navFill)" />
          {/* wide outer halo */}
          <path
            d={FRAME_PATH}
            fill="none"
            stroke="#00d9ff"
            strokeWidth="3.5"
            opacity="0.28"
            filter="url(#navGlow)"
          />
          {/* mid glow */}
          <path
            d={FRAME_PATH}
            fill="none"
            stroke="#33e3ff"
            strokeWidth="1.8"
            opacity="0.55"
            filter="url(#navGlow)"
          />
          {/* crisp neon edge */}
          <path
            d={FRAME_PATH}
            fill="none"
            stroke="#5ee9ff"
            strokeWidth="1.25"
            opacity="1"
          />
        </svg>

        {/* Icons row — overlays the frame */}
        <ul className="absolute inset-0 grid grid-cols-5 items-end pb-2">
          {TABS.map(({ to, label, Icon, center }) => {
            const active = isActive(to);
            return (
              <li key={to} className="flex items-center justify-center">
                <NavLink
                  to={to}
                  onClick={() => playSound("tick")}
                  aria-label={label}
                  className={cn(
                    "flex flex-col items-center justify-center gap-[3px] leading-none",
                    center && "-translate-y-2.5"
                  )}
                >
                  <Icon
                    strokeWidth={1.75}
                    className={cn(
                      "transition-colors",
                      active ? "text-primary" : "text-white/70"
                    )}
                    style={{
                      width: center ? 20 : 19,
                      height: center ? 20 : 19,
                      filter: active
                        ? `drop-shadow(0 0 2.5px ${NEON})`
                        : undefined,
                    }}
                  />
                  <span
                    className={cn(
                      "font-body transition-colors",
                      active ? "text-primary" : "text-white/70"
                    )}
                    style={{
                      fontSize: center ? 10 : 9.5,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textShadow: active ? `0 0 3px ${NEON}` : undefined,
                    }}
                  >
                    {label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
