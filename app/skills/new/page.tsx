"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateSkill } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export default function NewSkillPage() {
  const router = useRouter();
  const { mutate: createSkill, isPending } = useCreateSkill();

  const [name, setName] = useState("");
  const [dailyGoal, setDailyGoal] = useState("60");
  const [weeklyGoalHrs, setWeeklyGoalHrs] = useState("7");
  const [totalGoal, setTotalGoal] = useState("10000");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const daily = parseInt(dailyGoal, 10);
    const weeklyHrs = parseFloat(weeklyGoalHrs);
    const total = parseInt(totalGoal, 10);

    if (!name.trim()) return toast.error("Skill name is required.");
    if (isNaN(daily) || daily < 1) return toast.error("Daily goal must be at least 1 minute.");
    if (isNaN(weeklyHrs) || weeklyHrs < 0.5) return toast.error("Weekly goal must be at least 0.5 hours.");
    if (isNaN(total) || total < 1) return toast.error("Total goal must be at least 1 hour.");

    const weeklyMin = Math.round(weeklyHrs * 60);

    createSkill(
      { name: name.trim(), daily_goal_min: daily, weekly_goal_min: weeklyMin, total_goal_hrs: total },
      {
        onSuccess: (skill) => {
          toast.success(`"${skill.name}" created!`);
          router.push(`/skills/${skill.id}`);
        },
        onError: () => toast.error("Failed to create skill. Check your Supabase connection."),
      }
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Skill</h1>
        <p className="text-muted-foreground mt-1">
          Set up a skill and define your practice goals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Skill Name</Label>
          <Input
            id="name"
            placeholder="e.g. Guitar, Python, Chess"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Practice Goals
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="daily">Daily goal (minutes)</Label>
              <Input
                id="daily"
                type="number"
                min={1}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                e.g. 60 = 1 hour/day
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weekly">Weekly goal (hours)</Label>
              <Input
                id="weekly"
                type="number"
                min={0.5}
                step={0.5}
                value={weeklyGoalHrs}
                onChange={(e) => setWeeklyGoalHrs(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="total">Total goal (hours)</Label>
            <Input
              id="total"
              type="number"
              min={1}
              value={totalGoal}
              onChange={(e) => setTotalGoal(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Default is 10,000 hours (the mastery milestone).
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isPending ? "Creating..." : "Create Skill"}
          </Button>
        </div>
      </form>
    </div>
  );
}
