-- ============================================================
-- Coach Migration — Run AFTER migration_auth.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ─── Practice Tasks ──────────────────────────────────────────────────────────
create table if not exists public.practice_tasks (
  id            uuid        primary key default gen_random_uuid(),
  skill_id      uuid        not null references public.skills(id) on delete cascade,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  title         text        not null,
  description   text,
  duration_min  int,
  completed     boolean     not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists practice_tasks_skill_id_idx on public.practice_tasks (skill_id);

alter table public.practice_tasks enable row level security;

create policy "Users can view their own practice tasks"
  on public.practice_tasks for select
  using (user_id = auth.uid());

create policy "Users can create their own practice tasks"
  on public.practice_tasks for insert
  with check (user_id = auth.uid());

create policy "Users can update their own practice tasks"
  on public.practice_tasks for update
  using (user_id = auth.uid());

create policy "Users can delete their own practice tasks"
  on public.practice_tasks for delete
  using (user_id = auth.uid());

-- ─── Coach Messages ──────────────────────────────────────────────────────────
create table if not exists public.coach_messages (
  id         uuid        primary key default gen_random_uuid(),
  skill_id   uuid        not null references public.skills(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  role       text        not null check (role in ('user', 'assistant')),
  content    text        not null,
  created_at timestamptz not null default now()
);

create index if not exists coach_messages_skill_id_idx on public.coach_messages (skill_id);
create index if not exists coach_messages_created_at_idx on public.coach_messages (created_at asc);

alter table public.coach_messages enable row level security;

create policy "Users can view their own coach messages"
  on public.coach_messages for select
  using (user_id = auth.uid());

create policy "Users can create their own coach messages"
  on public.coach_messages for insert
  with check (user_id = auth.uid());

create policy "Users can delete their own coach messages"
  on public.coach_messages for delete
  using (user_id = auth.uid());
