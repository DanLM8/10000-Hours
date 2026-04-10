import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Session } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Time Formatting ────────────────────────────────────────────────────────

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return hours % 1 === 0 ? `${hours}` : hours.toFixed(1);
}

export function formatElapsedMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function msToMinutes(ms: number): number {
  return Math.round(ms / 60000);
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

export function isToday(dateStr: string): boolean {
  const today = new Date();
  const date = new Date(dateStr);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function isThisWeek(dateStr: string): boolean {
  const now = new Date();
  const date = new Date(dateStr);
  // ISO week: Monday = 0 offset
  const startOfWeek = new Date(now);
  const day = now.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  startOfWeek.setDate(now.getDate() + diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
}

// ─── Stat Calculations ────────────────────────────────────────────────────────

export function calcTotalMinutes(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + s.duration_min, 0);
}

export function calcTodayMinutes(sessions: Session[]): number {
  return sessions
    .filter((s) => isToday(s.logged_at))
    .reduce((sum, s) => sum + s.duration_min, 0);
}

export function calcWeekMinutes(sessions: Session[]): number {
  return sessions
    .filter((s) => isThisWeek(s.logged_at))
    .reduce((sum, s) => sum + s.duration_min, 0);
}

export function calcProgressPercent(value: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

// ─── Streak Calculation ───────────────────────────────────────────────────────

export type StreakState = "active" | "at_risk" | "broken";

export interface StreakResult {
  current: number;
  best: number;
  state: StreakState;
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function offsetDay(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function buildQualifyingDays(sessions: Session[], dailyGoalMin: number): Set<string> {
  const dayTotals = new Map<string, number>();
  for (const s of sessions) {
    const day = toLocalDateStr(new Date(s.logged_at));
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + s.duration_min);
  }
  const qualifying = new Set<string>();
  for (const [day, total] of dayTotals) {
    if (total >= dailyGoalMin) qualifying.add(day);
  }
  return qualifying;
}

function countConsecutiveDaysBack(qualifying: Set<string>, startDate: Date): number {
  let count = 0;
  let cursor = new Date(startDate);
  while (qualifying.has(toLocalDateStr(cursor))) {
    count++;
    cursor = offsetDay(cursor, -1);
  }
  return count;
}

function calcBestStreak(qualifying: Set<string>): number {
  if (qualifying.size === 0) return 0;
  const sorted = Array.from(qualifying).sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T12:00:00");
    const curr = new Date(sorted[i] + "T12:00:00");
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

export function calcStreak(sessions: Session[], dailyGoalMin: number): StreakResult {
  const qualifying = buildQualifyingDays(sessions, dailyGoalMin);
  const best = calcBestStreak(qualifying);

  const today = new Date();
  const yesterday = offsetDay(today, -1);
  const todayStr = toLocalDateStr(today);
  const yesterdayStr = toLocalDateStr(yesterday);

  if (qualifying.has(todayStr)) {
    const current = countConsecutiveDaysBack(qualifying, today);
    return { current, best: Math.max(best, current), state: "active" };
  }

  if (qualifying.has(yesterdayStr)) {
    const current = countConsecutiveDaysBack(qualifying, yesterday);
    return { current, best, state: "at_risk" };
  }

  return { current: 0, best, state: "broken" };
}

// Global streak: a day qualifies if at least one skill met its daily goal
export interface SessionWithGoal extends Session {
  daily_goal_min: number;
}

export function calcGlobalStreak(sessions: SessionWithGoal[]): StreakResult {
  // Build qualifying days: days where at least one skill met its goal
  const daySkillTotals = new Map<string, Map<string, number>>();

  for (const s of sessions) {
    const day = toLocalDateStr(new Date(s.logged_at));
    if (!daySkillTotals.has(day)) daySkillTotals.set(day, new Map());
    const skillMap = daySkillTotals.get(day)!;
    skillMap.set(s.skill_id, (skillMap.get(s.skill_id) ?? 0) + s.duration_min);
  }

  // Build a synthetic session list for the global qualifying check
  const globalSessions: Session[] = [];
  for (const [day, skillMap] of daySkillTotals) {
    for (const [skillId, total] of skillMap) {
      const goal = sessions.find((s) => s.skill_id === skillId)?.daily_goal_min ?? 0;
      if (total >= goal) {
        globalSessions.push({
          id: `${day}-${skillId}`,
          skill_id: skillId,
          duration_min: total,
          notes: null,
          logged_at: day + "T12:00:00",
        });
        break; // one qualifying skill per day is enough
      }
    }
  }

  return calcStreak(globalSessions, 0); // goal is 0 because we already filtered above
}

// ─── Milestone Detection ──────────────────────────────────────────────────────

export const STREAK_MILESTONES = [7, 15, 30, 50, 75, 100];

export function getMilestoneMessage(streak: number): string | null {
  const messages: Record<number, string> = {
    7:   "7-day streak! You're building a real habit.",
    15:  "15 days straight! You're locked in.",
    30:  "30-day streak! One full month of mastery.",
    50:  "50 days! You're in rare company.",
    75:  "75 days! Your discipline is extraordinary.",
    100: "100-day streak! You are unstoppable.",
  };
  return messages[streak] ?? null;
}

