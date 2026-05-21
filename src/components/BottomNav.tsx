import { NavLink, useLocation } from "react-router-dom";
import { Home, Swords, BarChart3, Wallet, User } from "lucide-react";
import { playSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { to: "/tournaments", label: "My Matches", icon: Swords },
  { to: "/home", label: "Home", icon: Home, center: true },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

// Hexagon clip path (flat top/bottom, angular sides)
const HEX_CLIP = "polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)";

export const BottomNav = () => {
  const location = useLocation();

  const isActive = (to: string) =>
    location.pathname === to || (to === "/wallet" && location.pathname.startsWith("/wallet"));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="relative mx-auto max-w-md px-3 pb-2 pt-4">
        {/* Outer neon frame */}
        <div
          className="relative h-[78px] rounded-[14px] border border-primary/50 bg-black/85 backdrop-blur-xl"
          style={{
            boxShadow:
              "0 0 22px hsl(199 100% 55% / 0.45), inset 0 0 18px hsl(199 100% 55% / 0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Top notch above HOME */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 -top-[7px] h-3 w-3 -translate-x-1/2 rotate-45 border-t border-l border-primary/70 bg-black"
            style={{ boxShadow: "0 0 10px hsl(199 100% 55% / 0.7)" }}
          />
          {/* Glow accents on corners */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-1 top-1/2 h-10 w-2 -translate-y-1/2 rounded-full"
            style={{ background: "hsl(199 100% 55%)", boxShadow: "0 0 18px hsl(199 100% 55% / 0.9)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-1 top-1/2 h-10 w-2 -translate-y-1/2 rounded-full"
            style={{ background: "hsl(199 100% 55%)", boxShadow: "0 0 18px hsl(199 100% 55% / 0.9)" }}
          />

          {/* Tabs grid */}
          <div className="relative grid h-full grid-cols-5 items-center">
            {TABS.map(({ to, label, icon: Icon, center }) => {
              const active = isActive(to);

              if (center) {
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => playSound("tick")}
                    className="relative flex items-center justify-center"
                  >
                    {/* Big hexagon HOME */}
                    <div
                      className="absolute -top-[26px] flex h-[78px] w-[78px] items-center justify-center"
                      style={{ filter: active ? "drop-shadow(0 0 16px hsl(199 100% 55% / 0.95))" : "drop-shadow(0 0 10px hsl(199 100% 55% / 0.55))" }}
                    >
                      {/* Outer hex border */}
                      <div
                        className="absolute inset-0"
                        style={{
                          clipPath: HEX_CLIP,
                          background:
                            "linear-gradient(180deg, hsl(199 100% 65%), hsl(199 100% 45%))",
                        }}
                      />
                      {/* Inner hex */}
                      <div
                        className="absolute inset-[2px] flex flex-col items-center justify-center gap-1 bg-black"
                        style={{
                          clipPath: HEX_CLIP,
                          background:
                            "radial-gradient(ellipse at center, hsl(199 100% 18%) 0%, #050a14 70%)",
                        }}
                      >
                        <Icon
                          strokeWidth={1.75}
                          className={cn(
                            "h-[26px] w-[26px] transition-all",
                            active ? "text-primary" : "text-foreground"
                          )}
                          style={{
                            filter: "drop-shadow(0 0 8px hsl(199 100% 55% / 0.9))",
                          }}
                        />
                        <span
                          className="font-display text-[9px] font-bold uppercase tracking-[0.22em] text-primary"
                          style={{ textShadow: "0 0 8px hsl(199 100% 55% / 0.9)" }}
                        >
                          {label}
                        </span>
                      </div>
                    </div>
                    <span className="sr-only">{label}</span>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => playSound("tick")}
                  className="group relative flex h-full items-center justify-center"
                >
                  <div
                    className={cn(
                      "relative flex h-[68px] w-full max-w-[78px] flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-[0.94]"
                    )}
                    style={{
                      clipPath: HEX_CLIP,
                      background: active
                        ? "linear-gradient(180deg, hsl(199 100% 16% / 0.85), hsl(199 100% 8% / 0.85))"
                        : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                    }}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                          clipPath: HEX_CLIP,
                          boxShadow: "inset 0 0 14px hsl(199 100% 55% / 0.6)",
                        }}
                      />
                    )}
                    <Icon
                      strokeWidth={1.6}
                      className={cn(
                        "h-[22px] w-[22px] transition-all duration-300",
                        active
                          ? "text-primary drop-shadow-[0_0_8px_hsl(199_100%_55%/0.9)]"
                          : "text-foreground/85 group-hover:text-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "font-display text-[8.5px] font-semibold uppercase leading-none tracking-[0.18em] transition-all",
                        active
                          ? "text-primary"
                          : "text-foreground/80 group-hover:text-foreground"
                      )}
                      style={
                        active
                          ? { textShadow: "0 0 8px hsl(199 100% 55% / 0.85)" }
                          : undefined
                      }
                    >
                      {label}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
