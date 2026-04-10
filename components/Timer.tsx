"use client";

import { useEffect, useState } from "react";
import { useTimerStore } from "@/store/timerStore";
import { formatElapsedMs, msToMinutes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlayIcon, SquareIcon } from "lucide-react";
import { toast } from "sonner";

interface TimerProps {
  skillId: string;
  skillName: string;
  onLogSession: (durationMin: number) => void;
}

export function Timer({ skillId, skillName, onLogSession }: TimerProps) {
  const { skillId: activeSkillId, isRunning, start, stop, reset, getElapsedMs } =
    useTimerStore();

  const [display, setDisplay] = useState("00:00:00");
  const [showConflict, setShowConflict] = useState(false);

  const isThisSkill = activeSkillId === skillId;
  const isOtherSkill = activeSkillId !== null && activeSkillId !== skillId;

  useEffect(() => {
    if (!isThisSkill) {
      setDisplay("00:00:00");
      return;
    }

    const tick = () => setDisplay(formatElapsedMs(getElapsedMs()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isThisSkill, isRunning, getElapsedMs]);

  function handleStart() {
    if (isOtherSkill) {
      setShowConflict(true);
      return;
    }
    start(skillId, skillName);
  }

  function handleStop() {
    stop();
  }

  function handleLog() {
    if (isRunning) {
      toast.error("Stop the timer before logging your session.");
      return;
    }
    const ms = getElapsedMs();
    const mins = msToMinutes(ms);
    if (mins < 1) {
      toast.error("Session must be at least 1 minute (30 seconds rounds up). Keep going!");
      return;
    }
    onLogSession(mins);
    reset();
    setDisplay("00:00:00");
  }

  const elapsedMs = isThisSkill ? getElapsedMs() : 0;
  const canLog = isThisSkill && !isRunning && elapsedMs > 0;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Session Timer
      </h3>

      <div className="text-center">
        <span className="text-6xl font-mono font-bold tabular-nums tracking-tight text-foreground">
          {isThisSkill ? display : "00:00:00"}
        </span>
      </div>

      {showConflict && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
          A timer is already running for another skill. Stop it before starting a new one.
          <button
            onClick={() => setShowConflict(false)}
            className="ml-2 underline text-amber-900 dark:text-amber-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex gap-3">
        {!isRunning || !isThisSkill ? (
          <Button
            onClick={handleStart}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isOtherSkill}
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            Start
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <SquareIcon className="w-4 h-4 mr-2" />
            Stop
          </Button>
        )}

        <Button
          onClick={handleLog}
          disabled={!canLog}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
        >
          Log Session
        </Button>
      </div>

      {isThisSkill && isRunning && (
        <p className="text-center text-xs text-muted-foreground">
          Stop the timer to enable logging.
        </p>
      )}
      {canLog && (
        <p className="text-center text-xs text-emerald-600 font-medium">
          {msToMinutes(elapsedMs)} min ready to log
        </p>
      )}
    </div>
  );
}
