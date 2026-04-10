-- ============================================================
-- Auth Migration — Run AFTER schema.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ─── Add user_id to skills ───────────────────────────────────────────────────
alter table public.skills
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- ─── Add user_id to sessions ─────────────────────────────────────────────────
alter table public.sessions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- ─── Enable Row Level Security ───────────────────────────────────────────────
alter table public.skills   enable row level security;
alter table public.sessions enable row level security;

-- ─── Skills RLS Policies ─────────────────────────────────────────────────────
create policy "Users can view their own skills"
  on public.skills for select
  using (user_id = auth.uid());

create policy "Users can create their own skills"
  on public.skills for insert
  with check (user_id = auth.uid());

create policy "Users can update their own skills"
  on public.skills for update
  using (user_id = auth.uid());

create policy "Users can delete their own skills"
  on public.skills for delete
  using (user_id = auth.uid());

-- ─── Sessions RLS Policies ───────────────────────────────────────────────────
create policy "Users can view their own sessions"
  on public.sessions for select
  using (user_id = auth.uid());

create policy "Users can create their own sessions"
  on public.sessions for insert
  with check (user_id = auth.uid());

create policy "Users can delete their own sessions"
  on public.sessions for delete
  using (user_id = auth.uid());

-- ─── Revoke anon blanket access (RLS now controls access) ────────────────────
-- The anon key still works — RLS policies gate what data it can see.
-- No changes needed to grants; RLS takes precedence.
