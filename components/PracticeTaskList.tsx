"use client";

import { usePracticeTasks, useTogglePracticeTask } from "@/lib/queries";
import {
  ClipboardListIcon,
  SparklesIcon,
  CheckCircle2Icon,
  CircleIcon,
  ClockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PracticeTaskListProps {
  skillId: string;
}

export function PracticeTaskList({ skillId }: PracticeTaskListProps) {
  const { data: tasks = [], isLoading } = usePracticeTasks(skillId);
  const { mutate: toggleTask } = useTogglePracticeTask();

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center px-6 py-4 gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <ClipboardListIcon className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm">Practice Tasks</span>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {completedCount}/{totalCount} done
          </span>
        )}
      </div>

      {/* Body */}
      <div className="border-t px-6 py-4">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 items-start animate-pulse">
                <div className="w-5 h-5 rounded-full bg-secondary shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && totalCount === 0 && (
          <div className="flex items-start gap-3 py-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ask your{" "}
              <span className="text-foreground font-medium">AI Coach</span>{" "}
              above to generate a practice plan — then use{" "}
              <span className="text-violet-600 dark:text-violet-400 font-medium">
                Save as Practice Plan
              </span>{" "}
              to populate your task list here.
            </p>
          </div>
        )}

        {/* Task list */}
        {!isLoading && totalCount > 0 && (
          <div className="space-y-2">
            {allDone && (
              <div className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-medium py-1 mb-2">
                All tasks complete — great session!
              </div>
            )}
            {tasks.map((task) => {
              const isChecked = !!task.completed;
              return (
                <button
                  key={task.id}
                  onClick={() =>
                    toggleTask({ id: task.id, skillId, completed: !isChecked })
                  }
                  className={cn(
                    "w-full flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-all border",
                    isChecked
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                      : "bg-background border-transparent hover:border-border hover:bg-secondary/40"
                  )}
                >
                  {isChecked ? (
                    <CheckCircle2Icon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <CircleIcon className="w-5 h-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium leading-snug",
                        isChecked && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p
                        className={cn(
                          "text-xs text-muted-foreground mt-0.5 leading-relaxed",
                          isChecked && "line-through"
                        )}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>
                  {task.duration_min && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 mt-0.5">
                      <ClockIcon className="w-3 h-3" />
                      {task.duration_min}m
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
