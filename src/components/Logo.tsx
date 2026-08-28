import logo from "@/assets/logo-tornado.png";
import { cn } from "@/lib/utils";

export const Logo = ({ size = 36, withText = false, className }: { size?: number; withText?: boolean; className?: string }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <img
      src={logo}
      alt="ZEOX logo"
      width={size}
      height={size}
      className="animate-spin-slow drop-shadow-[0_0_10px_hsl(var(--primary))]"
      style={{ width: size, height: size }}
    />
    {withText && (
      <div className="leading-none">
        <div className="font-display text-sm font-black uppercase text-primary text-glow tracking-widest">ZEOX</div>
        <div className="font-display text-[10px] font-bold uppercase text-foreground/80 tracking-[0.3em]">TORNADO</div>
      </div>
    )}
  </div>
);
