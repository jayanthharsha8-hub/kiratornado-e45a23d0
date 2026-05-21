import { NavLink, useLocation } from "react-router-dom";
import { Home, Swords, BarChart3, Wallet, User } from "lucide-react";
import { playSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/leaderboard", label: "LEADERBOARD", icon: BarChart3 },
  { to: "/tournaments", label: "MY MATCHES", icon: Swords },
  { to: "/home", label: "HOME", icon: Home, center: true },
  { to: "/wallet", label: "WALLET", icon: Wallet },
  { to: "/profile", label: "PROFILE", icon: User },
];

// Angular hexagon clip (flat top/bottom, pointed sides)
const HEX_CLIP = "polygon(14% 0%, 86% 0%, 100% 50%, 86% 100%, 14% 100%, 0% 50%)";
const NEON = "hsl(199 100% 58%)";

export const BottomNav = () => {
  const location = useLocation();
  const isActive = (to: string) =>
    location.pathname === to || (to === "/wallet" && location.pathname.startsWith("/wallet"));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 bg-black"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative mx-auto w-full max-w-md">
        {/* Outer neon frame, flush to bottom edge */}
        <div
          className="relative h-[68px] border-t border-primary/60"
          style={{
            background: "linear-gradient(180deg, #05080d 0%, #000 100%)",
            boxShadow:
              "0 -1px 0 hsl(199 100% 58% / 0.35), inset 0 1px 0 hsl(199 100% 58% / 0.25), inset 0 0 22px hsl(199 100% 58% / 0.08)",
          }}
        >
          {/* Side neon caps */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-1/2 h-9 w-[2px] -translate-y-1/2"
            style={{ background: NEON, boxShadow: `0 0 10px ${NEON}` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-1/2 h-9 w-[2px] -translate-y-1/2"
            style={{ background: NEON, boxShadow: `0 0 10px ${NEON}` }}
          />
          {/* Small notch above HOME */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 -top-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-l border-t border-primary/70 bg-black"
          />

          <ul className="relative grid h-full grid-cols-5">
            {TABS.map(({ to, label, icon: Icon, center }) => {
              const active = isActive(to);

              if (center) {
                return (
                  <li key={to} className="relative flex items-end justify-center">
                    <NavLink
                      to={to}
                      onClick={() => playSound("tick")}
                      aria-label={label}
                      className="absolute -top-[18px] flex h-[72px] w-[72px] items-center justify-center"
                      style={{
                        filter: active
                          ? `drop-shadow(0 0 10px ${NEON})`
                          : `drop-shadow(0 0 4px ${NEON}80)`,
                      }}
                    >
                      {/* hex border */}
                      <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                          clipPath: HEX_CLIP,
                          background: NEON,
                        }}
                      />
                      {/* hex inner */}
                      <span
                        aria-hidden
                        className="absolute inset-[1.5px]"
                        style={{
                          clipPath: HEX_CLIP,
                          background:
                            "radial-gradient(ellipse at center, hsl(199 70% 14%) 0%, #03060b 75%)",
                        }}
                      />
                      <div className="relative flex flex-col items-center justify-center gap-0.5">
                        <Icon
                          strokeWidth={1.8}
                          className={cn(
                            "h-[22px] w-[22px]",
                            active ? "text-primary" : "text-foreground/90"
                          )}
                          style={
                            active
                              ? { filter: `drop-shadow(0 0 6px ${NEON})` }
                              : undefined
                          }
                        />
                        <span
                          className={cn(
                            "font-display text-[8.5px] font-bold leading-none tracking-[0.18em]",
                            active ? "text-primary" : "text-foreground/90"
                          )}
                          style={
                            active
                              ? { textShadow: `0 0 6px ${NEON}` }
                              : undefined
                          }
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
                    className="group relative flex h-[58px] w-full items-center justify-center"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-x-1 inset-y-1.5"
                      style={{
                        clipPath: HEX_CLIP,
                        background: active
                          ? "linear-gradient(180deg, hsl(199 90% 14% / 0.85), hsl(199 90% 6% / 0.85))"
                          : "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))",
                        boxShadow: active
                          ? `inset 0 0 10px ${NEON}66`
                          : "inset 0 0 0 1px rgba(255,255,255,0.04)",
                      }}
                    />
                    <div className="relative flex flex-col items-center justify-center gap-1 px-1">
                      <Icon
                        strokeWidth={1.6}
                        className={cn(
                          "h-[20px] w-[20px] transition-colors",
                          active ? "text-primary" : "text-foreground/85"
                        )}
                        style={
                          active ? { filter: `drop-shadow(0 0 5px ${NEON})` } : undefined
                        }
                      />
                      <span
                        className={cn(
                          "font-display text-[8px] font-semibold leading-none tracking-[0.16em] whitespace-nowrap transition-colors",
                          active ? "text-primary" : "text-foreground/80"
                        )}
                        style={
                          active ? { textShadow: `0 0 5px ${NEON}` } : undefined
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
    </nav>
  );
};
