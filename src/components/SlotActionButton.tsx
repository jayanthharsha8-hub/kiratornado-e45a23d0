import { Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlotActionButtonProps {
  accent: string;
  accentSoft: string;
  selected: boolean;
  loading?: boolean;
  success?: boolean;
  slotNumber?: number | null;
  onClick: () => void;
  idleLabel?: string;
  activeLabel?: string;
  successLabel?: string;
}

/**
 * Global sticky slot confirmation button used across ALL tournament slot pages
 * (Free Matches, Battle Royale, Clash Squad, Lone Wolf, Custom Rooms, Weekly Rankings).
 * Single source of truth for the LOCK IN → SLOT LOCKED interaction.
 */
const SlotActionButton = ({
  accent,
  accentSoft,
  selected,
  loading = false,
  success = false,
  slotNumber,
  onClick,
  idleLabel = "Select a Slot",
  activeLabel = "Lock In",
  successLabel = "Slot Locked",
}: SlotActionButtonProps) => {
  const isActive = selected && !success && !loading;
  const disabled = !selected || loading || success;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-background/85 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur-md"
      style={{ boxShadow: `0 -8px 28px ${accentSoft}` }}
    >
      <div className="mx-auto max-w-md animate-fade-in">
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl font-display text-sm font-black uppercase tracking-[0.32em] transition-all duration-200 active:scale-[0.97]",
            isActive && "animate-pulse-glow",
          )}
          style={
            success
              ? {
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  color: "#FFFFFF",
                  opacity: 1,
                  textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                  border: `1px solid ${accent}`,
                  boxShadow: `0 0 24px ${accent}, 0 0 48px ${accentSoft}`,
                }
              : isActive
              ? {
                  background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
                  color: "#FFFFFF",
                  opacity: 1,
                  textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                  border: `1px solid ${accent}`,
                  boxShadow: `0 8px 32px ${accent}88, 0 0 22px ${accent}, inset 0 0 14px ${accentSoft}`,
                }
              : {
                  background: "hsl(0 0% 100% / 0.04)",
                  color: "#FFFFFF",
                  border: `1px solid ${accent}33`,
                  opacity: 1,
                }
          }
        >
          {/* Glow flash on click */}
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-active:opacity-100"
            style={{ background: `radial-gradient(circle at center, ${accent}66, transparent 70%)` }}
          />

          {success ? (
            <Check
              className="h-5 w-5"
              strokeWidth={2.5}
              style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
            />
          ) : (
            <Lock
              className="h-5 w-5"
              strokeWidth={2.25}
              style={{
                filter: isActive ? `drop-shadow(0 0 6px ${accent})` : "none",
              }}
            />
          )}

          <span className="relative">
            {success
              ? successLabel
              : loading
              ? "Locking..."
              : selected
              ? `${activeLabel}${slotNumber ? ` · Slot ${String(slotNumber).padStart(2, "0")}` : ""}`
              : idleLabel}
          </span>
        </button>
      </div>
    </div>
  );
};

export default SlotActionButton;