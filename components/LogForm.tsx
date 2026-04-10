"use client";

import { useState, useEffect } from "react";
import { useLogSession, useSessions } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { calcStreak, getMilestoneMessage } from "@/lib/utils";
import type { Session } from "@/types";

interface LogFormProps {
  skillId: string;
  dailyGoalMin: number;
  defaultDuration?: number;
  onSuccess?: () => void;
}

export function LogForm({ skillId, dailyGoalMin, defaultDuration, onSuccess }: LogFormProps) {
  const [duration, setDuration] = useState(defaultDuration?.toString() ?? "");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { mutate: logSession, isPending } = useLogSession();
  const { data: existingSessions = [] } = useSessions(skillId);

  useEffect(() => {
    if (defaultDuration !== undefined) {
      setDuration(defaultDuration.toString());
    }
  }, [defaultDuration]);

  function checkMilestone(newSession: Session) {
    const allSessions = [...existingSessions, newSession];
    const { current } = calcStreak(allSessions, dailyGoalMin);
    const message = getMilestoneMessage(current);
    if (message) {
      setTimeout(() => {
        toast.success(`🔥 ${message}`, {
          description: `${current}-day streak on this skill!`,
          duration: 6000,
        });
      }, 600);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(duration, 10);
    if (isNaN(mins) || mins < 1) {
      toast.error("Please enter a valid duration (minimum 1 minute).");
      return;
    }

    const logged_at = new Date(date + "T12:00:00").toISOString();

    logSession(
      { skill_id: skillId, duration_min: mins, notes: notes.trim() || undefined, logged_at },
      {
        onSuccess: (newSession) => {
          toast.success("Session logged!");
          checkMilestone(newSession);
          setDuration("");
          setNotes("");
          setDate(new Date().toISOString().split("T")[0]);
          onSuccess?.();
        },
        onError: () => toast.error("Failed to log session. Check your Supabase connection."),
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Log a Session
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            placeholder="e.g. 60"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="What did you work on?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {isPending ? "Saving..." : "Save Session"}
      </Button>
    </form>
  );
}
