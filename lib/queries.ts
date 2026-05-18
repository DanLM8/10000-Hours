"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Skill,
  Session,
  PracticeTask,
  CoachMessage,
  CreateSkillInput,
  UpdateSkillInput,
  CreateSessionInput,
} from "@/types";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const queryKeys = {
  skills: ["skills"] as const,
  skill: (id: string) => ["skills", id] as const,
  sessions: (skillId: string) => ["sessions", skillId] as const,
  allSessions: ["sessions", "all"] as const,
  practiceTasks: (skillId: string) => ["practiceTasks", skillId] as const,
  coachMessages: (skillId: string) => ["coachMessages", skillId] as const,
};

// ─── Skills ──────────────────────────────────────────────────────────────────

export function useSkills() {
  return useQuery({
    queryKey: queryKeys.skills,
    queryFn: async (): Promise<Skill[]> => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSkill(id: string) {
  return useQuery({
    queryKey: queryKeys.skill(id),
    queryFn: async (): Promise<Skill> => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSkillInput): Promise<Skill> => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("skills")
        .insert({ total_goal_hrs: 10000, ...input, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateSkillInput): Promise<Skill> => {
      const { data, error } = await supabase
        .from("skills")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
      queryClient.invalidateQueries({ queryKey: queryKeys.skill(data.id) });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("skills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
    },
  });
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export function useSessions(skillId: string) {
  return useQuery({
    queryKey: queryKeys.sessions(skillId),
    queryFn: async (): Promise<Session[]> => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("skill_id", skillId)
        .order("logged_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!skillId,
  });
}

export function useLogSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSessionInput): Promise<Session> => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          logged_at: new Date().toISOString(),
          notes: null,
          ...input,
          user_id: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions(data.skill_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.allSessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
    },
  });
}

export function useAllSessions() {
  return useQuery({
    queryKey: queryKeys.allSessions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, skills(daily_goal_min)")
        .order("logged_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        daily_goal_min: (row.skills as { daily_goal_min: number } | null)?.daily_goal_min ?? 60,
      }));
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      skillId,
    }: {
      id: string;
      skillId: string;
    }): Promise<void> => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { skillId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(skillId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.allSessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.skills });
    },
  });
}

// ─── Practice Tasks ───────────────────────────────────────────────────────────

export function usePracticeTasks(skillId: string) {
  return useQuery({
    queryKey: queryKeys.practiceTasks(skillId),
    queryFn: async (): Promise<PracticeTask[]> => {
      const { data, error } = await supabase
        .from("practice_tasks")
        .select("*")
        .eq("skill_id", skillId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!skillId,
  });
}

export function useCreatePracticeTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      skillId,
      tasks,
    }: {
      skillId: string;
      tasks: Pick<PracticeTask, "title" | "description" | "duration_min">[];
    }): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = tasks.map((t) => ({
        skill_id: skillId,
        user_id: user?.id,
        title: t.title,
        description: t.description ?? null,
        duration_min: t.duration_min ?? null,
        completed: false,
      }));
      const { error } = await supabase.from("practice_tasks").insert(rows);
      if (error) throw error;
    },
    onSuccess: (_, { skillId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceTasks(skillId) });
    },
  });
}

export function useTogglePracticeTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      completed,
    }: {
      id: string;
      skillId: string;
      completed: boolean;
    }): Promise<void> => {
      const { error } = await supabase
        .from("practice_tasks")
        .update({ completed })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, skillId, completed }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.practiceTasks(skillId) });
      const previous = queryClient.getQueryData(queryKeys.practiceTasks(skillId));
      queryClient.setQueryData(
        queryKeys.practiceTasks(skillId),
        (old: PracticeTask[] = []) =>
          old.map((t) => (t.id === id ? { ...t, completed } : t))
      );
      return { previous };
    },
    onError: (_err, { skillId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.practiceTasks(skillId), context.previous);
      }
    },
    onSettled: (_data, _err, { skillId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.practiceTasks(skillId) });
    },
  });
}

// ─── Coach Messages ───────────────────────────────────────────────────────────

export function useCoachMessages(skillId: string) {
  return useQuery({
    queryKey: queryKeys.coachMessages(skillId),
    queryFn: async (): Promise<CoachMessage[]> => {
      const { data, error } = await supabase
        .from("coach_messages")
        .select("*")
        .eq("skill_id", skillId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!skillId,
  });
}

export function useSaveCoachMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      skillId,
      role,
      content,
    }: {
      skillId: string;
      role: "user" | "assistant";
      content: string;
    }): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("coach_messages").insert({
        skill_id: skillId,
        user_id: user?.id,
        role,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, { skillId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coachMessages(skillId) });
    },
  });
}
