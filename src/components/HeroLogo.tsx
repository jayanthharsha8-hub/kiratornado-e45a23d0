import zeoxLogo from "@/assets/zeox-logo.png";
import { cn } from "@/lib/utils";

/** ZEOX emblem with a subtle electric-blue aura. */
export const HeroLogo = ({ className, size = 280 }: { className?: string; size?: number }) => (
  <div className={cn("relative mx-auto flex items-center justify-center", className)} style={{ width: size }}>
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 blur-2xl opacity-40"
      style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(199 100% 55% / 0.3), transparent 62%)" }}
    />
    <img
      src={zeoxLogo}
      alt="ZEOX — Esports Platform"
      className="w-full h-auto select-none"
      draggable={false}
    />
  </div>
);
