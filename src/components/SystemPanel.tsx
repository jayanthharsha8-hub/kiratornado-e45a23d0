import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SystemPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  right?: ReactNode;
}

/** Solo-Leveling style framed panel with glowing corner brackets. */
export const SystemPanel = ({ children, className, title, right }: SystemPanelProps) => (
  <div className={cn("panel p-3 animate-float-up", className)}>
    {title && (
      <div className="mb-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 border border-primary bg-primary/30 animate-pulse-glow" />
        <h3 className="font-display text-xs uppercase tracking-[0.18em] text-primary text-glow-soft">
          {title}
        </h3>
        <div className="mx-2 h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
        {right}
      </div>
    )}
    {children}
  </div>
);

