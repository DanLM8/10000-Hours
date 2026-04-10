"use client";

export const dynamic = "force-dynamic";

import { useSkills, useSessions, useAllSessions } from "@/lib/queries";
import { SkillCard } from "@/components/SkillCard";
import { StreakBadge } from "@/components/StreakBadge";
import { Skill } from "@/types";
import { calcGlobalStreak } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { PlusCircleIcon } from "lucide-react";

function SkillCardWrapper({ skill }: { skill: Skill }) {
  const { data: sessions = [] } = useSessions(skill.id);
  return <SkillCard skill={skill} sessions={sessions} />;
}

function GlobalStreakBanner() {
  const { data: allSessions = [] } = useAllSessions();
  const { current, state } = calcGlobalStreak(allSessions);

  if (current === 0 && state === "broken") return null;

  return (
    <div className={`
      flex items-center gap-3 rounded-xl border px-5 py-3
      ${state === "active"
        ? "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800"
        : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
      }
    `}>
      <StreakBadge streak={current} state={state} size="lg" showCount={false} />
      <p className="font-semibold text-sm">
        {state === "active" ? `${current}-day ` : `${current} days — `}
        <Tooltip>
          <TooltipTrigger>
            <span className="underline decoration-dotted underline-offset-4 cursor-help">
              global streak
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-center">
            Consecutive days you&apos;ve met at least one skill&apos;s daily goal.
          </TooltipContent>
        </Tooltip>
        {state === "active" ? " — keep it going!" : " at risk — practice something today!"}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: skills = [], isLoading, isError } = useSkills();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Skills</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:bg-rose-950 dark:border-rose-800">
          <p className="text-rose-700 dark:text-rose-300 font-medium">
            Failed to load skills. Check your Supabase environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Skills</h1>
          <p className="text-muted-foreground mt-1">
            {skills.length === 0
              ? "Add your first skill to start tracking."
              : `Tracking ${skills.length} skill${skills.length !== 1 ? "s" : ""} toward mastery.`}
          </p>
        </div>
        <Link
          href="/skills/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <PlusCircleIcon className="w-4 h-4" />
          Add Skill
        </Link>
      </div>

      {skills.length > 0 && <GlobalStreakBanner />}

      {skills.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-16 text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-950 rounded-full flex items-center justify-center mb-4">
            <PlusCircleIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No skills yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Add a skill you want to master — guitar, coding, chess, or anything else.
          </p>
          <Link
            href="/skills/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <PlusCircleIcon className="w-4 h-4" />
            Add your first skill
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <SkillCardWrapper key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}
