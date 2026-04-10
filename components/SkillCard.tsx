"use client";

import Link from "next/link";
import { Skill, Session } from "@/types";
import { ProgressBar } from "@/components/ProgressBar";
import { StreakBadge } from "@/components/StreakBadge";
import {
  calcTotalMinutes,
  calcWeekMinutes,
  calcStreak,
  formatHours,
} from "@/lib/utils";
import { ClockIcon } from "lucide-react";

interface SkillCardProps {
  skill: Skill;
  sessions: Session[];
}

export function SkillCard({ skill, sessions }: SkillCardProps) {
  const totalMin = calcTotalMinutes(sessions);
  const weekMin = calcWeekMinutes(sessions);
  const { current: streak, state: streakState } = calcStreak(sessions, skill.daily_goal_min);

  return (
    <Link href={`/skills/${skill.id}`}>
      <div className="group rounded-xl border bg-card p-5 space-y-4 hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg group-hover:text-indigo-600 transition-colors">
              {skill.name}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <ClockIcon className="w-3.5 h-3.5" />
              {formatHours(totalMin)} hrs logged
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StreakBadge streak={streak} state={streakState} size="md" showCount={streak > 0} />
          </div>
        </div>

        <ProgressBar
          value={totalMin}
          goal={skill.total_goal_hrs * 60}
          label="All-time progress"
          variant="main"
          unit="hours"
        />

        <ProgressBar
          value={weekMin}
          goal={skill.weekly_goal_min}
          label="This week"
          variant="weekly"
          unit="minutes"
        />
      </div>
    </Link>
  );
}
