-- ============================================================
-- 10,000 Hour Tracker — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Skills ──────────────────────────────────────────────────────────────────
create table if not exists public.skills (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  total_goal_hrs   int  not null default 10000,
  daily_goal_min   int  not null default 60,
  weekly_goal_min  int  not null default 420,
  created_at       timestamptz not null default now()
);

-- ─── Sessions ────────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id             uuid primary key default gen_random_uuid(),
  skill_id       uuid not null references public.skills(id) on delete cascade,
  duration_min   int  not null check (duration_min > 0),
  notes          text,
  logged_at      timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists sessions_skill_id_idx  on public.sessions (skill_id);
create index if not exists sessions_logged_at_idx on public.sessions (logged_at desc);

-- ─── Row Level Security (disabled for single-user phase) ─────────────────────
-- RLS is off now. When auth is added:
--   1. alter table public.skills   enable row level security;
--   2. alter table public.sessions enable row level security;
--   3. Add user_id uuid column to both tables
--   4. Create policies: using (user_id = auth.uid())

-- ─── Grant anon access (needed for Supabase anon key) ────────────────────────
grant usage  on schema public to anon;
grant select, insert, update, delete on public.skills   to anon;
grant select, insert, update, delete on public.sessions to anon;
