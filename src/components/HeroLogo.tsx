import wordmark from "@/assets/kira-tornado-wordmark.png";
import { cn } from "@/lib/utils";

/** Transparent KIRA TORNADO emblem with soft cyan aura. */
export const HeroLogo = ({ className, size = 280 }: { className?: string; size?: number }) => (
  <div className={cn("relative mx-auto flex items-center justify-center", className)} style={{ width: size }}>
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 blur-2xl opacity-40"
      style={{ background: "radial-gradient(ellipse at 50% 45%, hsl(199 100% 55% / 0.35), transparent 60%)" }}
    />
    <img
      src={wordmark}
      alt="KIRA TORNADO — Esports Platform"
      className="w-full h-auto select-none mix-blend-screen"
      draggable={false}
      style={{ background: "transparent" }}
    />
  </div>
);
