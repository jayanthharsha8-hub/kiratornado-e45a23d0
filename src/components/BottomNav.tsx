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
// HOME bump is centered at x=200, spans ~140..260, peaks at y=8
// HOME bump: +15% wider (124..276), +10% taller (side-top y=24, peak y=2)
const FRAME_PATH =
  "M 14 24 \
   Q 4 24 4 34 \
   L 4 68 \
   Q 4 78 14 78 \
   L 386 78 \
   Q 396 78 396 68 \
   L 396 34 \
   Q 396 24 386 24 \
   L 286 24 \
   Q 278 24 273 18 \
   L 262 6 \
   Q 258 2 252 2 \
   L 148 2 \
   Q 142 2 138 6 \
   L 127 18 \
   Q 122 24 114 24 \
   Z";

export const BottomNav = () => {
  const { pathname } = useLocation();
  const isActive = (to: string) =>
    pathname === to || (to === "/wallet" && pathname.startsWith("/wallet"));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div
        className="relative w-full"
        style={{
          height: 76,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Single continuous frame (border + fill) */}
        <svg
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(6,11,20,0.95)" />
              <stop offset="100%" stopColor="rgba(2,4,9,0.99)" />
            </linearGradient>
            <filter id="navGlow" x="-10%" y="-30%" width="120%" height="160%">
              <feGaussianBlur stdDeviation="1.4" result="b1" />
              <feMerge>
                <feMergeNode in="b1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={FRAME_PATH} fill="url(#navFill)" />
          {/* soft outer glow */}
          <path
            d={FRAME_PATH}
            fill="none"
            stroke="#00d9ff"
            strokeWidth="2.4"
            opacity="0.32"
            filter="url(#navGlow)"
          />
          {/* crisp neon edge */}
          <path
            d={FRAME_PATH}
            fill="none"
            stroke="#00d9ff"
            strokeWidth="1.1"
            opacity="0.95"
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
