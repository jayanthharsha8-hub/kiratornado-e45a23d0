import { NavLink, useLocation } from "react-router-dom";
import { Trophy, Swords, Home, Wallet, User } from "lucide-react";
import { playSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

/**
 * Premium esports bottom navigation.
 * - 5 perfectly equal hex tabs, HOME centered and 8% larger
 * - Tight, contained neon glow (never overflows nav height)
 * - Rajdhani labels for clean, readable futuristic look
 */

const TABS = [
  { to: "/leaderboard", label: "Leaderboard", Icon: Trophy },
  { to: "/tournaments", label: "Matches", Icon: Swords },
  { to: "/home", label: "Home", Icon: Home, center: true },
  { to: "/wallet", label: "Wallet", Icon: Wallet },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

const HEX = "polygon(14% 0%, 86% 0%, 100% 50%, 86% 100%, 14% 100%, 0% 50%)";
const NEON = "hsl(199 100% 58%)";
const NEON_DIM = "hsl(199 100% 58% / 0.35)";

const NAV_H = 68; // overall nav height (px)
const TAB_H = 52; // standard tab height
const TAB_H_CENTER = Math.round(TAB_H * 1.08); // HOME 8% larger ≈ 56

export const BottomNav = () => {
  const { pathname } = useLocation();
  const isActive = (to: string) =>
    pathname === to || (to === "/wallet" && pathname.startsWith("/wallet"));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto w-full max-w-md">
        <div
          className="relative flex items-center"
          style={{
            height: NAV_H,
            background:
              "linear-gradient(180deg, #05080d 0%, #000000 100%)",
            borderTop: `1px solid ${NEON_DIM}`,
            boxShadow: `0 -6px 18px -8px ${NEON_DIM}`,
          }}
        >
          {/* thin neon top accent */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${NEON} 50%, transparent)`,
              opacity: 0.6,
            }}
          />

          <ul className="relative z-10 grid h-full w-full grid-cols-5 items-center gap-1.5 px-3">
            {TABS.map(({ to, label, Icon, center }) => {
              const active = isActive(to);
              const h = center ? TAB_H_CENTER : TAB_H;

              return (
                <li key={to} className="flex items-center justify-center">
                  <NavLink
                    to={to}
                    onClick={() => playSound("tick")}
                    aria-label={label}
                    className={cn(
                      "group relative flex w-full items-center justify-center",
                      active && center && "animate-[nav-pulse_2.6s_ease-in-out_infinite]"
                    )}
                    style={{ height: h }}
                  >
                    {/* hex border */}
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        clipPath: HEX,
                        background: active
                          ? `linear-gradient(180deg, ${NEON}, hsl(199 100% 45%))`
                          : "hsl(199 100% 58% / 0.32)",
                      }}
                    />
                    {/* hex inner */}
                    <span
                      aria-hidden
                      className="absolute inset-[1px]"
                      style={{
                        clipPath: HEX,
                        background: active
                          ? "radial-gradient(ellipse at center, hsl(199 90% 14%) 0%, #03070c 85%)"
                          : "linear-gradient(180deg, #0a0f16 0%, #02050a 100%)",
                      }}
                    />
                    {/* tight inner glow when active (contained) */}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-[1px]"
                        style={{
                          clipPath: HEX,
                          boxShadow: `inset 0 0 8px hsl(199 100% 58% / 0.55)`,
                        }}
                      />
                    )}

                    {/* content */}
                    <div className="relative flex flex-col items-center justify-center gap-[3px] leading-none">
                      <Icon
                        strokeWidth={1.75}
                        className={cn(
                          "transition-colors",
                          active ? "text-primary" : "text-foreground/70"
                        )}
                        style={{
                          width: center ? 19 : 17,
                          height: center ? 19 : 17,
                          filter: active
                            ? `drop-shadow(0 0 3px ${NEON})`
                            : undefined,
                        }}
                      />
                      <span
                        className={cn(
                          "font-body uppercase whitespace-nowrap transition-colors",
                          active ? "text-primary" : "text-foreground/70"
                        )}
                        style={{
                          fontSize: center ? 9 : 8.5,
                          fontWeight: 600,
                          letterSpacing: "0.14em",
                          textShadow: active ? `0 0 4px ${NEON}` : undefined,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes nav-pulse {
          0%, 100% { filter: drop-shadow(0 0 2px ${NEON}); }
          50%      { filter: drop-shadow(0 0 5px ${NEON}); }
        }
      `}</style>
    </nav>
  );
};
