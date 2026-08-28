import zeoxLogo from "@/assets/zeox-logo.png";
import { cn } from "@/lib/utils";

export const Logo = ({ size = 36, withText = false, className }: { size?: number; withText?: boolean; className?: string }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <img
      src={zeoxLogo}
      alt="ZEOX logo"
      width={size}
      height={size}
      className="drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
      style={{ width: size, height: size }}
    />
    {withText && (
      <div className="leading-none">
        <div className="font-display text-sm font-black uppercase text-primary tracking-[0.22em]">ZEOX</div>
        <div className="font-display text-[9px] font-semibold uppercase text-foreground/60 tracking-[0.3em]">ESPORTS</div>
      </div>
    )}
  </div>
);
