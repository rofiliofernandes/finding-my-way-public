-- Finding My Way to Jesus Christ: tables for syncing your reading history, notes and saved verses.
-- Run this once in Supabase → SQL Editor → New query → Run.
-- Each table is protected by Row Level Security: a signed-in account can only see and change its own rows.

create table if not exists public.reading_log (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  id          text not null,
  book        text not null,
  chapter     int  not null,
  verse_start int,
  verse_end   int,
  mode        text,            -- 'chapter' | 'verse' | 'random'
  read_at     timestamptz not null,
  created_at  timestamptz,
  updated_at  timestamptz not null,
  deleted     boolean not null default false,
  synced_at   timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create table if not exists public.notes (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  id          text not null,
  kind        text not null default 'note',   -- 'note' | 'reflection'
  book        text,
  chapter     int,
  verse_start int,
  verse_end   int,
  week_start  date,                           -- for weekly reflections
  body        text,
  created_at  timestamptz,
  updated_at  timestamptz not null,
  deleted     boolean not null default false,
  synced_at   timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create table if not exists public.bookmarks (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  id          text not null,                  -- e.g. 'JHN.3.16'
  book        text not null,
  chapter     int  not null,
  verse       int  not null,
  color       text,                           -- highlight colour, or null for a plain bookmark
  created_at  timestamptz,
  updated_at  timestamptz not null,
  deleted     boolean not null default false,
  synced_at   timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

-- The server stamps every write, so devices can ask "what changed since I last looked?"
create or replace function public.lectio_touch() returns trigger
language plpgsql as $$
begin
  new.synced_at := clock_timestamp();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['reading_log', 'notes', 'bookmarks'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before insert or update on public.%I for each row execute function public.lectio_touch()', t, t);
    execute format('create index if not exists %I_synced on public.%I (user_id, synced_at)', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Optional AI: a per-month request counter used by functions/api/ai.js to enforce MONTHLY_LIMIT.
create table if not exists public.ai_usage (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  month   text not null,
  calls   int  not null default 0,
  primary key (user_id, month)
);
alter table public.ai_usage enable row level security;
drop policy if exists "own usage" on public.ai_usage;
create policy "own usage" on public.ai_usage for select to authenticated using (auth.uid() = user_id);

create or replace function public.ai_use() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into public.ai_usage (user_id, month, calls) values (auth.uid(), to_char(now(), 'YYYY-MM'), 1)
  on conflict (user_id, month) do update set calls = public.ai_usage.calls + 1
  returning calls into n;
  return n;
end $$;
revoke all on function public.ai_use() from public;
grant execute on function public.ai_use() to authenticated;
