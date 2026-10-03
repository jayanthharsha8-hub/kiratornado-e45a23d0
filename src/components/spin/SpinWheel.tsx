import { Coins, Ticket, Percent, X, Zap } from "lucide-react";
import type { SpinReward } from "@/lib/spinWheel";

const icon = { bonus_coins: Coins, br_tokens: Ticket, discount_coupon: Percent, no_luck: X };

export function SpinWheel({ rewards, rotation = 0, spinning = false }: { rewards: SpinReward[]; rotation?: number; spinning?: boolean }) {
  return <div className="spin-wheel-stage" aria-label="Eight prize spin wheel">
    <div className="spin-wheel-pointer" aria-hidden="true" />
    <div className="spin-wheel-outer">
      <div className="spin-wheel-disc" style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 5s cubic-bezier(.12,.69,.08,1)" : "none" }}>
        {Array.from({ length: 8 }, (_, index) => {
          const reward = rewards.find(r => r.slot === index + 1);
          const Icon = reward ? icon[reward.reward_type] : Zap;
          const label = reward?.name ?? "UNAVAILABLE";
          return <div key={index} className={`spin-wheel-sector ${reward?.enabled === false ? "spin-wheel-sector-off" : ""}`} style={{ transform: `rotate(${index * 45}deg) translateY(-34%) rotate(${-index * 45}deg)` }}>
            <Icon className="spin-wheel-icon" strokeWidth={1.9} aria-hidden="true" />
            <span className="spin-wheel-sector-name">{label}</span>
          </div>;
        })}
      </div>
      <div className="spin-wheel-hub" aria-hidden="true"><span>SPIN</span><i /></div>
    </div>
  </div>;
}
