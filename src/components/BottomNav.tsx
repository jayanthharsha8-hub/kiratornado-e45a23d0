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
const FRAME_PATH =
  "M 14 22 \
   Q 4 22 4 32 \
   L 4 66 \
   Q 4 76 14 76 \
   L 386 76 \
   Q 396 76 396 66 \
   L 396 32 \
   Q 396 22 386 22 \
   L 266 22 \
   Q 258 22 254 16 \
   L 244 6 \
   Q 240 2 234 2 \
   L 166 2 \
   Q 160 2 156 6 \
   L 146 16 \
   Q 142 22 134 22 \
   Z";

export const BottomNav = () => {
  const { pathname } = useLocation();
  const isActive = (to: string) =>
    pathname === to || (to === "/wallet" && pathname.startsWith("/wallet"));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative w-full mx-auto max-w-md" style={{ height: 72 }}>
        {/* Single continuous frame (border + fill) */}
        <svg
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(6,11,20,0.92)" />
              <stop offset="100%" stopColor="rgba(2,4,9,0.98)" />
            </linearGradient>
            <linearGradient id="navStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(199 100% 68%)" />
              <stop offset="100%" stopColor="hsl(199 100% 45%)" />
            </linearGradient>
            <filter id="navGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={FRAME_PATH} fill="url(#navFill)" />
          <path
            d={FRAME_PATH}
            fill="none"
            stroke="url(#navStroke)"
            strokeWidth="1.25"
            opacity="0.75"
            filter="url(#navGlow)"
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
