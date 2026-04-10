"use client";

import { cn } from "@/lib/utils";
import type { StreakState } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  state: StreakState;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  showLabel?: boolean;
}

const flameColors: Record<StreakState, string> = {
  active:   "text-orange-500",
  at_risk:  "text-amber-400",
  broken:   "text-muted-foreground/40",
};

const countColors: Record<StreakState, string> = {
  active:   "text-orange-500 font-bold",
  at_risk:  "text-amber-400 font-semibold",
  broken:   "text-muted-foreground/50",
};

const sizeMap = {
  sm: { icon: "w-4 h-4", text: "text-xs", gap: "gap-0.5" },
  md: { icon: "w-5 h-5", text: "text-sm", gap: "gap-1" },
  lg: { icon: "w-8 h-8", text: "text-2xl", gap: "gap-1.5" },
};

const tooltipText: Record<StreakState, string> = {
  active:  "Daily goal met — streak active!",
  at_risk: "Streak at risk — log a session today to keep it alive.",
  broken:  "No active streak — log a session to start one.",
};

// Inline SVG flame — lucide's Flame icon
function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2C9.5 6 7 8.5 7 12a5 5 0 0 0 10 0c0-1.8-.7-3.4-1.8-4.6C14.4 8.8 13 10 12 10c.5-2.5-1-5-2-5.5.5 1 .5 2.5-.5 3.5C8.5 9.5 8 11 8 12a4 4 0 0 0 8 0c0-3.5-2.5-6.5-4-10z" />
    </svg>
  );
}

export function StreakBadge({
  streak,
  state,
  size = "md",
  showCount = true,
  showLabel = false,
}: StreakBadgeProps) {
  const s = sizeMap[size];

  return (
    <div
      className={cn("flex items-center", s.gap)}
      title={tooltipText[state]}
    >
      <FlameIcon
        className={cn(
          s.icon,
          flameColors[state],
          state === "active" && "drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]"
        )}
      />
      {showCount && (
        <span className={cn(s.text, countColors[state])}>
          {streak}
        </span>
      )}
      {showLabel && (
        <span className={cn("text-xs text-muted-foreground", state === "active" && "text-orange-500/80")}>
          {state === "active" ? "day streak" : state === "at_risk" ? "days — at risk" : "no streak"}
        </span>
      )}
    </div>
  );
}
