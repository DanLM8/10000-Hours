export interface Skill {
  id: string;
  name: string;
  total_goal_hrs: number;
  daily_goal_min: number;
  weekly_goal_min: number;
  created_at: string;
}

export interface Session {
  id: string;
  skill_id: string;
  duration_min: number;
  notes: string | null;
  logged_at: string;
}

export interface SkillWithStats extends Skill {
  total_minutes: number;
  today_minutes: number;
  week_minutes: number;
}

export interface CreateSkillInput {
  name: string;
  total_goal_hrs?: number;
  daily_goal_min: number;
  weekly_goal_min: number;
}

export interface UpdateSkillInput {
  id: string;
  name?: string;
  total_goal_hrs?: number;
  daily_goal_min?: number;
  weekly_goal_min?: number;
}

export interface CreateSessionInput {
  skill_id: string;
  duration_min: number;
  notes?: string;
  logged_at?: string;
}
