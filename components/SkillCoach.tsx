"use client";

import { useState, useRef, useEffect } from "react";
import { Skill, Session, PracticeTask } from "@/types";
import { useCoachMessages, useSaveCoachMessage } from "@/lib/queries";
import {
  calcTotalMinutes,
  calcStreak,
  formatHours,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  SparklesIcon,
  SendIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BotIcon,
  UserIcon,
  ClipboardListIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SkillCoachProps {
  skill: Skill;
  sessions: Session[];
  onSaveTasks?: (tasks: PracticeTask[]) => void;
}

function extractTasksFromMessage(content: string): PracticeTask[] {
  const lines = content.split("\n");
  const taskLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(?:[-*•]|\d+[.)]) (.+)$/);
    if (match) {
      taskLines.push(match[1].trim());
    }
  }

  if (taskLines.length < 2) return [];

  return taskLines.map((title, i) => ({
    id: String(i + 1),
    title,
  }));
}

const SUGGESTED_PROMPTS = [
  "What should I focus on in my next practice session?",
  "Can you build me a weekly practice routine?",
  "How do I stay consistent and not burn out?",
  "What milestones should I aim for in the next 30 days?",
];

export function SkillCoach({ skill, sessions, onSaveTasks }: SkillCoachProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);
  const prevIsStreamingRef = useRef(false);

  const { data: persistedMessages = [], isSuccess: messagesLoaded } = useCoachMessages(skill.id);
  const { mutate: saveMessage } = useSaveCoachMessage();

  const totalMin = calcTotalMinutes(sessions);
  const { current: streak } = calcStreak(sessions, skill.daily_goal_min);

  const recentNotes = sessions
    .filter((s) => s.notes)
    .slice(0, 5)
    .map((s) => s.notes as string);

  const skillContext = {
    name: skill.name,
    totalHours: totalMin / 60,
    streak,
    dailyGoalMin: skill.daily_goal_min,
    weeklyGoalMin: skill.weekly_goal_min,
    recentNotes,
  };

  // Seed local state from DB once — wait for query to resolve so empty results
  // don't prevent initialization, and so we never re-seed mid-conversation.
  useEffect(() => {
    if (messagesLoaded && !initializedRef.current) {
      setMessages(
        persistedMessages.map((m) => ({ role: m.role, content: m.content }))
      );
      initializedRef.current = true;
    }
  }, [messagesLoaded, persistedMessages]);

  // Save assistant message to DB when streaming finishes
  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant" && last.content) {
        saveMessage({ skillId: skill.id, role: "assistant", content: last.content });
      }
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, messages, saveMessage, skill.id]);

  // Scroll chat container (not the page) when messages update
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const el = scrollContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;
    setError(null);

    const userMessage: Message = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    // Save user message immediately
    saveMessage({ skillId: skill.id, role: "user", content: text.trim() });

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, skillContext }),
      });

      if (!res.ok) throw new Error("Failed to reach the coach.");
      if (!res.body) throw new Error("No response body.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setError("Something went wrong. Check your API key or try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className={cn(
      "rounded-xl border bg-card transition-all duration-200",
      open && "shadow-md"
    )}>
      {/* Header toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 group"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">AI Coach</span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {skill.name}
          </span>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {open
          ? <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
          : <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
        }
      </button>

      {open && (
        <div className="border-t">
          {/* Context pill */}
          <div className="px-6 py-3 bg-secondary/40 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="bg-background border rounded-full px-2 py-0.5">
              {formatHours(totalMin)} hrs logged
            </span>
            <span className="bg-background border rounded-full px-2 py-0.5">
              {streak}-day streak
            </span>
            <span className="bg-background border rounded-full px-2 py-0.5">
              {skill.daily_goal_min} min/day goal
            </span>
          </div>

          {/* Messages */}
          <div ref={scrollContainerRef} className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-2">
                  Your personal coach knows your progress. Ask anything.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-xs border rounded-lg px-3 py-2.5 hover:bg-secondary hover:border-indigo-300 transition-all text-muted-foreground hover:text-foreground leading-relaxed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              const extractedTasks =
                msg.role === "assistant" && msg.content && onSaveTasks
                  ? extractTasksFromMessage(msg.content)
                  : [];
              const isLastMessage = i === messages.length - 1;
              const showSaveButton =
                extractedTasks.length >= 2 && !isStreaming && isLastMessage;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                      <BotIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div
                      className={cn(
                        "rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-sm"
                          : "bg-secondary text-foreground rounded-tl-sm"
                      )}
                    >
                      {msg.content}
                      {msg.role === "assistant" && msg.content === "" && (
                        <span className="inline-flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      )}
                    </div>
                    {showSaveButton && (
                      <button
                        onClick={() => onSaveTasks!(extractedTasks)}
                        className="self-start flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 border border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700 rounded-lg px-3 py-1.5 transition-all bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-950/60 font-medium"
                      >
                        <ClipboardListIcon className="w-3.5 h-3.5" />
                        Save as Practice Plan
                      </button>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                </div>
              );
            })}

            {error && (
              <p className="text-xs text-rose-500 text-center">{error}</p>
            )}
          </div>

          {/* Input */}
          <div className="px-6 pb-5 pt-2 border-t flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach anything… (Enter to send)"
              rows={1}
              className="resize-none text-sm min-h-[40px] max-h-32"
              disabled={isStreaming}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 h-10 w-10"
            >
              <SendIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
