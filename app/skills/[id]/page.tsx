"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSkill, useSessions, useUpdateSkill, useDeleteSkill } from "@/lib/queries";
import { ProgressBar } from "@/components/ProgressBar";
import { Timer } from "@/components/Timer";
import { LogForm } from "@/components/LogForm";
import { SessionHistory } from "@/components/SessionHistory";
import { StreakBadge } from "@/components/StreakBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calcTotalMinutes,
  calcTodayMinutes,
  calcWeekMinutes,
  calcStreak,
  formatHours,
} from "@/lib/utils";
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SkillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: skill, isLoading: skillLoading } = useSkill(id);
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions(id);
  const { mutate: updateSkill } = useUpdateSkill();
  const { mutate: deleteSkill, isPending: isDeleting } = useDeleteSkill();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [logDuration, setLogDuration] = useState<number | undefined>(undefined);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const logFormRef = useRef<HTMLDivElement>(null);

  function handleTimerLog(durationMin: number) {
    setLogDuration(durationMin);
    setTimeout(() => {
      logFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleStartEdit() {
    setEditedName(skill?.name ?? "");
    setIsEditingName(true);
  }

  function handleSaveName() {
    if (!editedName.trim() || editedName === skill?.name) {
      setIsEditingName(false);
      return;
    }
    updateSkill(
      { id, name: editedName.trim() },
      {
        onSuccess: () => {
          toast.success("Skill name updated.");
          setIsEditingName(false);
        },
        onError: () => toast.error("Failed to update skill name."),
      }
    );
  }

  function handleDelete() {
    deleteSkill(id, {
      onSuccess: () => {
        toast.success(`"${skill?.name}" deleted.`);
        router.push("/dashboard");
      },
      onError: () => toast.error("Failed to delete skill."),
    });
  }

  if (skillLoading || sessionsLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground">Skill not found.</p>
        <Link href="/dashboard" className="text-indigo-600 underline text-sm mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const totalMin = calcTotalMinutes(sessions);
  const todayMin = calcTodayMinutes(sessions);
  const weekMin = calcWeekMinutes(sessions);
  const { current: streak, best: bestStreak, state: streakState } = calcStreak(sessions, skill.daily_goal_min);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                className="text-2xl font-bold h-auto py-1"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleSaveName}>
                <CheckIcon className="w-4 h-4 text-emerald-600" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                <XIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight truncate">{skill.name}</h1>
              <Button size="icon" variant="ghost" onClick={handleStartEdit} className="shrink-0">
                <PencilIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            </>
          )}
        </div>

        {/* Delete */}
        {!showConfirmDelete ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowConfirmDelete(true)}
            className="text-muted-foreground hover:text-rose-500 shrink-0"
          >
            <Trash2Icon className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Delete skill?</span>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, delete"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* All-time progress */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Progress to Mastery
        </h3>
        <ProgressBar
          value={totalMin}
          goal={skill.total_goal_hrs * 60}
          label="All-time"
          variant="main"
          unit="hours"
        />
        <p className="text-xs text-muted-foreground">
          {formatHours(totalMin)} of {skill.total_goal_hrs.toLocaleString()} hours logged
        </p>
      </div>

      {/* Streak */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${
          streakState === "active"
            ? "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800"
            : streakState === "at_risk"
            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
            : "bg-card"
        }`}>
          <StreakBadge streak={streak} state={streakState} size="lg" showCount={false} />
          <div>
            <p className="text-2xl font-bold tabular-nums">{streak}</p>
            <p className="text-xs text-muted-foreground">
              {streakState === "active" ? "day streak" : streakState === "at_risk" ? "days — at risk" : "day streak"}
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
          <StreakBadge streak={bestStreak} state={bestStreak > 0 ? "active" : "broken"} size="lg" showCount={false} />
          <div>
            <p className="text-2xl font-bold tabular-nums">{bestStreak}</p>
            <p className="text-xs text-muted-foreground">best streak</p>
          </div>
        </div>
      </div>

      {/* Daily + weekly goals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <ProgressBar
            value={todayMin}
            goal={skill.daily_goal_min}
            label="Today"
            variant="daily"
            unit="minutes"
          />
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <ProgressBar
            value={weekMin}
            goal={skill.weekly_goal_min}
            label="This Week"
            variant="weekly"
            unit="minutes"
          />
        </div>
      </div>

      {/* Timer */}
      <Timer
        skillId={skill.id}
        skillName={skill.name}
        onLogSession={handleTimerLog}
      />

      {/* Log Form */}
      <div ref={logFormRef}>
        <LogForm
          skillId={skill.id}
          dailyGoalMin={skill.daily_goal_min}
          defaultDuration={logDuration}
          onSuccess={() => setLogDuration(undefined)}
        />
      </div>

      {/* Session History */}
      <SessionHistory skillId={skill.id} />
    </div>
  );
}
