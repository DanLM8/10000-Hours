"use client";

import { useState } from "react";
import { Session } from "@/types";
import { useSessions, useDeleteSession } from "@/lib/queries";
import { formatMinutes } from "@/lib/utils";
import { Trash2Icon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DEFAULT_VISIBLE = 3;

// ─── Date grouping helpers ────────────────────────────────────────────────────

function getISOWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

type GroupKey = "this_week" | "last_week" | "this_month" | "older";

const GROUP_LABELS: Record<GroupKey, string> = {
  this_week:  "This Week",
  last_week:  "Last Week",
  this_month: "This Month",
  older:      "Older",
};

function getGroupKey(dateStr: string): GroupKey {
  const date = new Date(dateStr);
  const now = new Date();

  const thisWeekStart = getISOWeekStart(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  if (date >= thisWeekStart) return "this_week";
  if (date >= lastWeekStart && date < lastWeekEnd) return "last_week";
  if (date >= thisMonthStart) return "this_month";
  return "older";
}

function groupSessions(sessions: Session[]): { key: GroupKey; sessions: Session[] }[] {
  const map: Partial<Record<GroupKey, Session[]>> = {};
  const order: GroupKey[] = ["this_week", "last_week", "this_month", "older"];

  for (const s of sessions) {
    const key = getGroupKey(s.logged_at);
    if (!map[key]) map[key] = [];
    map[key]!.push(s);
  }

  return order
    .filter((k) => (map[k]?.length ?? 0) > 0)
    .map((k) => ({ key: k, sessions: map[k]! }));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
  });
}

// ─── Session row ─────────────────────────────────────────────────────────────

function SessionRow({
  session,
  onDelete,
}: {
  session: Session;
  onDelete: (s: Session) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-secondary/50 transition-colors group">
      <div className="flex items-center gap-4 min-w-0">
        <div className="shrink-0">
          <p className="text-sm font-semibold">{formatMinutes(session.duration_min)}</p>
          <p className="text-xs text-muted-foreground">{formatDate(session.logged_at)}</p>
        </div>
        {session.notes && (
          <p className="text-sm text-muted-foreground line-clamp-1 hidden sm:block truncate max-w-xs">
            {session.notes}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(session)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-500 h-7 w-7 shrink-0"
      >
        <Trash2Icon className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Session group ────────────────────────────────────────────────────────────

function SessionGroup({
  label,
  sessions,
  onDelete,
}: {
  label: string;
  sessions: Session[];
  onDelete: (s: Session) => void;
}) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const totalMin = sessions.reduce((sum, s) => sum + s.duration_min, 0);
  const visible = showAll ? sessions : sessions.slice(0, DEFAULT_VISIBLE);
  const hasMore = sessions.length > DEFAULT_VISIBLE;

  return (
    <div className="space-y-2">
      {/* Group header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-1.5 group/header"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground group-hover/header:text-foreground transition-colors">
            {label}
          </span>
          <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-indigo-500">{formatMinutes(totalMin)}</span>
          {open
            ? <ChevronUpIcon className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Session rows */}
      {open && (
        <div className="space-y-1.5">
          {visible.map((s) => (
            <SessionRow key={s.id} session={s} onDelete={onDelete} />
          ))}

          {hasMore && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full text-xs text-muted-foreground hover:text-indigo-500 transition-colors py-1.5 text-center"
            >
              {showAll
                ? "Show less"
                : `Show ${sessions.length - DEFAULT_VISIBLE} more session${sessions.length - DEFAULT_VISIBLE !== 1 ? "s" : ""}`
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SessionHistoryProps {
  skillId: string;
}

export function SessionHistory({ skillId }: SessionHistoryProps) {
  const { data: sessions = [], isLoading } = useSessions(skillId);
  const { mutate: deleteSession } = useDeleteSession();

  function handleDelete(session: Session) {
    deleteSession(
      { id: session.id, skillId },
      {
        onSuccess: () => toast.success("Session deleted."),
        onError:   () => toast.error("Failed to delete session."),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Session History
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Session History
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No sessions logged yet. Start the timer or log a session above.
        </p>
      </div>
    );
  }

  const groups = groupSessions(sessions);
  const totalMin = sessions.reduce((sum, s) => sum + s.duration_min, 0);

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Session History
        </h3>
        <span className="text-xs text-muted-foreground">
          {sessions.length} sessions · {formatMinutes(totalMin)} total
        </span>
      </div>

      <div className="space-y-4 divide-y divide-border">
        {groups.map(({ key, sessions: groupSessions }) => (
          <div key={key} className="pt-4 first:pt-0">
            <SessionGroup
              label={GROUP_LABELS[key]}
              sessions={groupSessions}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
