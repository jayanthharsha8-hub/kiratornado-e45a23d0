import wordmark from "@/assets/kira-tornado-wordmark.png";
import { cn } from "@/lib/utils";

/** Full KIRA TORNADO emblem + wordmark + ESPORTS PLATFORM badge. */
export const HeroLogo = ({ className, size = 280 }: { className?: string; size?: number }) => (
  <div className={cn("relative mx-auto flex items-center justify-center", className)} style={{ width: size }}>
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 blur-3xl opacity-70"
      style={{ background: "radial-gradient(circle at 50% 40%, hsl(199 100% 50% / 0.45), transparent 65%)" }}
    />
    <img
      src={wordmark}
      alt="KIRA TORNADO — Esports Platform"
      className="w-full h-auto select-none drop-shadow-[0_0_24px_hsl(199_100%_55%/0.45)]"
      draggable={false}
    />
  </div>
);
