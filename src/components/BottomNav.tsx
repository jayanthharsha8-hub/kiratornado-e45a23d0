import { NavLink, useLocation } from "react-router-dom";
import { Trophy, Swords, Home, Wallet, User } from "lucide-react";
import { playSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

/**
 * Edge-attached bottom navigation.
 * - Fixed to the bottom edge (no floating card, no detached shadow)
 * - Glassmorphic dark navy bar with soft neon-blue border
 * - 5 tabs with a raised futuristic HOME center tab
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
const NEON_SOFT = "hsl(199 100% 58% / 0.25)";

const NAV_H = 64;
// Raised home shape (trapezoid-like). Reduced height ~17%.
const HOME_CLIP =
  "polygon(18% 18%, 82% 18%, 96% 60%, 88% 100%, 12% 100%, 4% 60%)";

export const BottomNav = () => {
  const { pathname } = useLocation();
  const isActive = (to: string) =>
    pathname === to || (to === "/wallet" && pathname.startsWith("/wallet"));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="relative w-full backdrop-blur-xl"
        style={{
          height: NAV_H,
          background:
            "linear-gradient(180deg, rgba(6,11,20,0.88) 0%, rgba(2,4,9,0.96) 100%)",
          borderTop: `1px solid ${NEON_SOFT}`,
        }}
      >
        {/* soft neon top hairline */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${NEON} 50%, transparent)`,
            opacity: 0.35,
          }}
        />
        {/* subtle ambient glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 70% at 50% 100%, hsl(199 100% 50% / 0.08), transparent 70%)",
          }}
        />

        <ul className="relative z-10 grid h-full w-full max-w-md mx-auto grid-cols-5 items-center">
          {TABS.map(({ to, label, Icon, center }) => {
            const active = isActive(to);

            if (center) {
              return (
                <li key={to} className="flex items-center justify-center">
                  <NavLink
                    to={to}
                    onClick={() => playSound("tick")}
                    aria-label={label}
                    className="relative flex items-center justify-center"
                    style={{ width: 64, height: 52, marginTop: -10 }}
                  >
                    {/* outer neon edge */}
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        clipPath: HOME_CLIP,
                        background: active
                          ? `linear-gradient(180deg, ${NEON}, hsl(199 100% 45%))`
                          : `${NEON_SOFT}`,
                      }}
                    />
                    {/* inner fill */}
                    <span
                      aria-hidden
                      className="absolute inset-[1.5px]"
                      style={{
                        clipPath: HOME_CLIP,
                        background: active
                          ? "radial-gradient(ellipse at center, hsl(199 90% 14%) 0%, #03070c 90%)"
                          : "linear-gradient(180deg, #0a0f16 0%, #02050a 100%)",
                        boxShadow: active
                          ? `inset 0 0 8px hsl(199 100% 58% / 0.45)`
                          : undefined,
                      }}
                    />
                    <div className="relative flex flex-col items-center justify-center gap-[2px] leading-none">
                      <Icon
                        strokeWidth={1.75}
                        className={cn(
                          "transition-colors",
                          active ? "text-primary" : "text-white/85"
                        )}
                        style={{
                          width: 18,
                          height: 18,
                          filter: active
                            ? `drop-shadow(0 0 3px ${NEON})`
                            : undefined,
                        }}
                      />
                      <span
                        className={cn(
                          "font-body transition-colors",
                          active ? "text-primary" : "text-white/85"
                        )}
                        style={{
                          fontSize: 9.5,
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          textShadow: active ? `0 0 3px ${NEON}` : undefined,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  </NavLink>
                </li>
              );
            }

            return (
              <li key={to} className="flex items-center justify-center">
                <NavLink
                  to={to}
                  onClick={() => playSound("tick")}
                  aria-label={label}
                  className="group flex h-full w-full flex-col items-center justify-center gap-[3px]"
                >
                  <Icon
                    strokeWidth={1.75}
                    className={cn(
                      "transition-colors",
                      active ? "text-primary" : "text-white/55"
                    )}
                    style={{
                      width: 20,
                      height: 20,
                      filter: active
                        ? `drop-shadow(0 0 2.5px ${NEON})`
                        : undefined,
                    }}
                  />
                  <span
                    className={cn(
                      "font-body transition-colors",
                      active ? "text-primary" : "text-white/55"
                    )}
                    style={{
                      fontSize: 9.5,
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
