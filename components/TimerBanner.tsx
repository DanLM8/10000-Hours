"use client";

import { useEffect, useState } from "react";
import { useTimerStore } from "@/store/timerStore";
import { formatElapsedMs } from "@/lib/utils";
import { TimerIcon } from "lucide-react";
import Link from "next/link";

export function TimerBanner() {
  const { skillId, skillName, isRunning, getElapsedMs } = useTimerStore();
  const [display, setDisplay] = useState("00:00:00");

  useEffect(() => {
    if (!isRunning) return;
    const tick = () => setDisplay(formatElapsedMs(getElapsedMs()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isRunning, getElapsedMs]);

  if (!isRunning || !skillId) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-indigo-600 text-white py-2.5 px-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TimerIcon className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">
            Timer running:{" "}
            <span className="font-semibold">{skillName}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono font-bold text-sm tabular-nums">{display}</span>
          <Link
            href={`/skills/${skillId}`}
            className="text-xs underline underline-offset-2 hover:text-indigo-200 transition-colors"
          >
            Go to skill
          </Link>
        </div>
      </div>
    </div>
  );
}
