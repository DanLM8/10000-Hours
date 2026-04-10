"use client";

import { cn, calcProgressPercent, formatHours, formatMinutes } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  goal: number;
  label: string;
  variant?: "main" | "daily" | "weekly";
  unit?: "minutes" | "hours";
}

export function ProgressBar({
  value,
  goal,
  label,
  variant = "daily",
  unit = "minutes",
}: ProgressBarProps) {
  const percent = calcProgressPercent(value, goal);
  const goalMet = percent >= 100;

  const displayValue =
    unit === "hours" ? `${formatHours(value)} hrs` : formatMinutes(value);
  const displayGoal =
    unit === "hours" ? `${formatHours(goal)} hrs` : formatMinutes(goal);

  if (variant === "main") {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className="text-sm font-semibold">
            {displayValue}
            <span className="text-muted-foreground font-normal"> / {displayGoal}</span>
          </span>
        </div>
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              goalMet ? "bg-emerald-500" : "bg-indigo-500"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percent}% complete</span>
          <span>{formatHours(goal - value)} hrs remaining</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "text-xs font-semibold",
            goalMet ? "text-emerald-500" : "text-foreground"
          )}
        >
          {displayValue}
          <span className="text-muted-foreground font-normal"> / {displayGoal}</span>
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            goalMet ? "bg-emerald-500" : "bg-indigo-400"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
