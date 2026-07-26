import { cn } from "@/lib/utils";

export type GlowTone =
  | "blue"
  | "purple"
  | "mixed"
  | "red"
  | "green"
  | "yellow"
  | "orange"
  | "pink";

/** Glow intensity reduced ~40% vs the previous home design. */
const GLOWS: Record<GlowTone, { border: string; shadow: string }> = {
  blue: {
    border: "rgba(0,229,255,0.38)",
    shadow: "0 0 10px rgba(0,229,255,0.12), inset 0 0 14px rgba(0,229,255,0.04)",
  },
  purple: {
    border: "rgba(168,85,247,0.38)",
    shadow: "0 0 10px rgba(168,85,247,0.12), inset 0 0 14px rgba(168,85,247,0.04)",
  },
  mixed: {
    border: "rgba(120,160,255,0.38)",
    shadow:
      "0 0 11px rgba(0,229,255,0.11), 0 0 15px rgba(168,85,247,0.10), inset 0 0 12px rgba(120,160,255,0.03)",
  },
  red: { border: "rgba(255,80,80,0.4)", shadow: "0 0 10px rgba(255,80,80,0.13)" },
  green: { border: "rgba(80,255,140,0.38)", shadow: "0 0 10px rgba(80,255,140,0.12)" },
  yellow: { border: "rgba(255,210,80,0.4)", shadow: "0 0 10px rgba(255,210,80,0.13)" },
  orange: { border: "rgba(255,150,60,0.4)", shadow: "0 0 10px rgba(255,150,60,0.13)" },
  pink: { border: "rgba(255,90,180,0.4)", shadow: "0 0 10px rgba(255,90,180,0.13)" },
};

export const NeonCard = ({
  children,
  className,
  glow = "blue",
  radius = 16,
  onClick,
  as: As = "div" as any,
  style,
  ...rest
}: {
  children?: React.ReactNode;
  className?: string;
  glow?: GlowTone;
  radius?: number;
  onClick?: () => void;
  as?: any;
  style?: React.CSSProperties;
} & Record<string, any>) => {
  const g = GLOWS[glow];
  return (
    <As
      onClick={onClick}
      className={cn(
        "relative bg-[#0A0F1C]/85 backdrop-blur-sm transition-all duration-[250ms] hover:-translate-y-[1px]",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
      style={{
        borderRadius: radius,
        border: `1px solid ${g.border}`,
        boxShadow: g.shadow,
        ...style,
      }}
      {...rest}
    >
      {children}
    </As>
  );
};

/** Neutral placeholder shown until the admin uploads artwork. */
export const ArtPlaceholder = ({
  label,
  from = "#0b1a3a",
  to = "#1a0b3a",
  className,
  style,
}: {
  label?: string;
  from?: string;
  to?: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={cn("relative overflow-hidden", className)}
    style={{
      background: `linear-gradient(135deg, ${from} 0%, #05070D 55%, ${to} 100%)`,
      ...style,
    }}
  >
    <div
      className="absolute inset-0 opacity-30"
      style={{
        background:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 14px)",
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 50% 40%, rgba(0,229,255,0.12), transparent 60%), radial-gradient(circle at 70% 80%, rgba(168,85,247,0.11), transparent 55%)",
      }}
    />
    {label && (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-[9px] uppercase tracking-[0.3em] text-white/35">
          {label}
        </span>
      </div>
    )}
  </div>
);

/** Image with automatic placeholder fallback (never hardcodes artwork). */
export const SmartImage = ({
  src,
  alt,
  className,
  placeholderLabel,
  from,
  to,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  placeholderLabel?: string;
  from?: string;
  to?: string;
}) =>
  src ? (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
    />
  ) : (
    <ArtPlaceholder
      label={placeholderLabel}
      from={from}
      to={to}
      className={cn("h-full w-full", className)}
    />
  );

export const SectionHeader = ({
  icon: Icon,
  title,
  actionLabel,
  onAction,
}: {
  icon: any;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="mb-2 flex items-center justify-between" style={{ height: 22 }}>
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-cyan-300" />
      <h3
        className="font-display font-black uppercase text-white"
        style={{ fontSize: 12, letterSpacing: "0.14em", textShadow: "0 0 5px rgba(0,229,255,0.25)" }}
      >
        {title}
      </h3>
    </div>
    {actionLabel && (
      <button
        onClick={onAction}
        className="font-display text-[10px] font-bold uppercase tracking-widest text-cyan-300"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
