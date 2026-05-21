import { NavLink, useLocation } from "react-router-dom";
import { Home, Swords, Wallet, User, BarChart3 } from "lucide-react";
import { playSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/leaderboard", label: "LEADERBOARD", icon: BarChart3 },
  { to: "/tournaments", label: "MY MATCHES", icon: Swords },
  { to: "/home", label: "HOME", icon: Home, center: true },
  { to: "/wallet", label: "WALLET", icon: Wallet },
  { to: "/profile", label: "PROFILE", icon: User },
];

// Elongated hex (flat top/bottom, sharp sides) — matches reference
const HEX_SIDE = "polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)";
const HEX_CENTER = "polygon(18% 0%, 82% 0%, 100% 50%, 82% 100%, 18% 100%, 0% 50%)";
const NEON = "hsl(199 100% 60%)";
const NEON_SOFT = "hsl(199 100% 60% / 0.55)";

export const BottomNav = () => {
  const location = useLocation();
  const isActive = (to: string) =>
    location.pathname === to || (to === "/wallet" && location.pathname.startsWith("/wallet"));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative mx-auto w-full max-w-md bg-black">
        {/* Outer frame */}
        <div
          className="relative h-[64px]"
          style={{
            background: "linear-gradient(180deg, #04070c 0%, #000 100%)",
            borderTop: `1px solid ${NEON_SOFT}`,
            boxShadow: `0 -1px 0 ${NEON_SOFT}, inset 0 1px 0 hsl(199 100% 60% / 0.18)`,
          }}
        >
          {/* Thin top accent line */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-6 right-6 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${NEON} 50%, transparent)`,
              opacity: 0.7,
            }}
          />
          {/* Side neon caps */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-r"
            style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-l"
            style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }}
          />

          <ul className="relative grid h-full grid-cols-5 px-1">
            {TABS.map(({ to, label, icon: Icon, center }) => {
              const active = isActive(to);

              if (center) {
                return (
                  <li key={to} className="relative flex items-end justify-center">
                    {/* Tiny notch indicator */}
                    <span
                      aria-hidden
                      className="absolute -top-[7px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45"
                      style={{
                        background: NEON,
                        boxShadow: `0 0 6px ${NEON}`,
                      }}
                    />
                    <NavLink
                      to={to}
                      onClick={() => playSound("tick")}
                      aria-label={label}
                      className={cn(
                        "absolute -top-[20px] flex h-[68px] w-[68px] items-center justify-center",
                        active && "animate-[nav-pulse_2.4s_ease-in-out_infinite]"
                      )}
                      style={{
                        filter: `drop-shadow(0 0 6px ${NEON}) drop-shadow(0 0 12px hsl(199 100% 60% / 0.35))`,
                      }}
                    >
                      {/* hex border */}
                      <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                          clipPath: HEX_CENTER,
                          background: NEON,
                        }}
                      />
                      {/* hex inner */}
                      <span
                        aria-hidden
                        className="absolute inset-[1.5px]"
                        style={{
                          clipPath: HEX_CENTER,
                          background:
                            "radial-gradient(ellipse at center, hsl(199 80% 12%) 0%, #02060b 80%)",
                        }}
                      />
                      <div className="relative flex flex-col items-center justify-center">
                        <Icon
                          strokeWidth={1.8}
                          className="h-[20px] w-[20px] text-primary"
                          style={{ filter: `drop-shadow(0 0 4px ${NEON})` }}
                        />
                        <span
                          className="mt-0.5 font-display text-[8px] font-bold leading-none tracking-[0.22em] text-primary"
                          style={{ textShadow: `0 0 4px ${NEON}` }}
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
                    className="group relative flex h-[54px] w-full items-center justify-center"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-x-[3px] inset-y-1"
                      style={{
                        clipPath: HEX_SIDE,
                        background: active
                          ? "linear-gradient(180deg, hsl(199 80% 12% / 0.9), hsl(199 80% 5% / 0.9))"
                          : "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))",
                        boxShadow: active
                          ? `inset 0 0 0 1px ${NEON}, inset 0 0 10px ${NEON}55`
                          : `inset 0 0 0 1px hsl(199 100% 60% / 0.18)`,
                      }}
                    />
                    <div className="relative flex flex-col items-center justify-center gap-[3px]">
                      <Icon
                        strokeWidth={1.6}
                        className={cn(
                          "h-[18px] w-[18px] transition-colors",
                          active ? "text-primary" : "text-foreground/75"
                        )}
                        style={
                          active ? { filter: `drop-shadow(0 0 4px ${NEON})` } : undefined
                        }
                      />
                      <span
                        className={cn(
                          "font-display text-[7.5px] font-semibold leading-none tracking-[0.18em] whitespace-nowrap transition-colors",
                          active ? "text-primary" : "text-foreground/75"
                        )}
                        style={
                          active ? { textShadow: `0 0 4px ${NEON}` } : undefined
                        }
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
          0%, 100% { filter: drop-shadow(0 0 6px ${NEON}) drop-shadow(0 0 12px hsl(199 100% 60% / 0.35)); }
          50% { filter: drop-shadow(0 0 9px ${NEON}) drop-shadow(0 0 18px hsl(199 100% 60% / 0.55)); }
        }
      `}</style>
    </nav>
  );
};
