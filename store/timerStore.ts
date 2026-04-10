import { create } from "zustand";

interface TimerState {
  skillId: string | null;
  skillName: string | null;
  isRunning: boolean;
  startedAt: number | null;
  elapsedMs: number;
}

interface TimerActions {
  start: (skillId: string, skillName: string) => void;
  stop: () => void;
  reset: () => void;
  getElapsedMs: () => number;
}

type TimerStore = TimerState & TimerActions;

export const useTimerStore = create<TimerStore>((set, get) => ({
  skillId: null,
  skillName: null,
  isRunning: false,
  startedAt: null,
  elapsedMs: 0,

  start: (skillId, skillName) => {
    set({
      skillId,
      skillName,
      isRunning: true,
      startedAt: Date.now(),
    });
  },

  stop: () => {
    const { isRunning, startedAt, elapsedMs } = get();
    if (!isRunning || startedAt === null) return;
    set({
      isRunning: false,
      startedAt: null,
      elapsedMs: elapsedMs + (Date.now() - startedAt),
    });
  },

  reset: () => {
    set({
      skillId: null,
      skillName: null,
      isRunning: false,
      startedAt: null,
      elapsedMs: 0,
    });
  },

  getElapsedMs: () => {
    const { isRunning, startedAt, elapsedMs } = get();
    if (isRunning && startedAt !== null) {
      return elapsedMs + (Date.now() - startedAt);
    }
    return elapsedMs;
  },
}));
