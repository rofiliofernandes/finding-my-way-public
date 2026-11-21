-- Journey with: usernames, companions, shared lights, moments along the way, and safety (block, report).
-- Run this once in Supabase → SQL Editor → New query → Run (after schema.sql). Safe to run again.
--
-- Privacy, enforced here by Row Level Security (not just by the app):
--   · anyone signed in can find a username and name (that's what search is), unless one of you blocked the other;
--   · only companions (an invite that was accepted) see your journey, your lights and your moments;
--   · nobody can accept an invite for someone else, invite someone who blocked them, or read reports.
-- Everything the app does goes through the functions at the bottom, which run as the signed-in person.

create table if not exists public.profiles (
  id           uuid primary key default auth.uid() references auth.users on delete cascade,
  username     text not null unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 40),
  color        text not null default '#c9775f' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.companions (
  requester   uuid not null default auth.uid() references auth.users on delete cascade,
  addressee   uuid not null references auth.users on delete cascade,
  status      text not null default 'invited' check (status in ('invited', 'accepted')),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (requester, addressee),
  check (requester <> addressee)
);
-- one row per pair, whichever of you invited
create unique index if not exists companions_pair on public.companions (least(requester, addressee), greatest(requester, addressee));

create table if not exists public.blocks (
  blocker    uuid not null default auth.uid() references auth.users on delete cascade,
  blocked    uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);

-- a "light": a note you chose to share with your companions
create table if not exists public.lights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  book        text not null,
  chapter     int  not null,
  verse_start int,
  verse_end   int,
  body        text not null check (char_length(body) between 1 and 2000),
  note_id     text,
  created_at  timestamptz not null default now()
);
create index if not exists lights_place on public.lights (book, chapter);
create unique index if not exists lights_note on public.lights (user_id, note_id) where note_id is not null;

-- moments along the way: a weekly badge or a month on the Tree of Life
create table if not exists public.moments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  kind       text not null check (kind in ('week', 'month')),
  key        text not null check (char_length(key) <= 20),
  title      text not null check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  unique (user_id, kind, key)
);

-- a small summary of your journey, for your companions
create table if not exists public.journeys (
  user_id    uuid primary key default auth.uid() references auth.users on delete cascade,
  weeks      int  not null default 0,
  months     int  not null default 0,
  streak     int  not null default 0,
  last_read  date,
  reading    text check (char_length(reading) <= 60),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id         uuid primary key default gen_random_uuid(),
  reporter   uuid not null default auth.uid() references auth.users on delete cascade,
  reported   uuid not null references auth.users on delete cascade,
  light_id   uuid,
  reason     text check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

/* ---------- helpers (about you and one other person only) ---------- */
create or replace function public.companion_of(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from companions c where c.status = 'accepted'
    and ((c.requester = auth.uid() and c.addressee = other) or (c.requester = other and c.addressee = auth.uid())));
$$;
create or replace function public.blocked_with(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks b
    where (b.blocker = auth.uid() and b.blocked = other) or (b.blocker = other and b.blocked = auth.uid()));
$$;

/* ---------- row level security ---------- */
alter table public.profiles   enable row level security;
alter table public.companions enable row level security;
alter table public.blocks     enable row level security;
alter table public.lights     enable row level security;
alter table public.moments    enable row level security;
alter table public.journeys   enable row level security;
alter table public.reports    enable row level security;

drop policy if exists "find people" on public.profiles;
create policy "find people" on public.profiles for select to authenticated using (id = auth.uid() or not public.blocked_with(id));
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "my pairs" on public.companions;
create policy "my pairs" on public.companions for select to authenticated using (auth.uid() in (requester, addressee));
drop policy if exists "invite" on public.companions;
create policy "invite" on public.companions for insert to authenticated
  with check (requester = auth.uid() and status = 'invited' and accepted_at is null and not public.blocked_with(addressee));
drop policy if exists "accept" on public.companions;
create policy "accept" on public.companions for update to authenticated using (addressee = auth.uid()) with check (addressee = auth.uid());
drop policy if exists "leave" on public.companions;
create policy "leave" on public.companions for delete to authenticated using (auth.uid() in (requester, addressee));

drop policy if exists "own blocks" on public.blocks;
create policy "own blocks" on public.blocks for all to authenticated using (blocker = auth.uid()) with check (blocker = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['lights', 'moments', 'journeys'] loop
    execute format('drop policy if exists "companions see" on public.%I', t);
    execute format('create policy "companions see" on public.%I for select to authenticated using (user_id = auth.uid() or public.companion_of(user_id))', t);
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

drop policy if exists "send report" on public.reports;
create policy "send report" on public.reports for insert to authenticated with check (reporter = auth.uid());

/* ---------- what signed-in people may touch (anonymous visitors: nothing) ---------- */
revoke all on public.profiles, public.companions, public.blocks, public.lights, public.moments, public.journeys, public.reports from anon;
grant select, insert, update, delete on public.profiles, public.blocks, public.lights, public.moments, public.journeys to authenticated;
grant select, insert, delete on public.companions to authenticated;
revoke update on public.companions from authenticated;
grant update (status, accepted_at) on public.companions to authenticated; -- accepting can't change who invited whom
grant insert on public.reports to authenticated;

/* ---------- the app's functions (run as you, so the rules above apply) ---------- */
create or replace function public.my_profile() returns json language sql stable as $$
  select row_to_json(p) from (select id, username, display_name, color from public.profiles where id = auth.uid()) p;
$$;

create or replace function public.username_free(u text) returns boolean
language sql stable security definer set search_path = public as $$
  select lower(u) ~ '^[a-z0-9_.]{3,20}$' and not exists (select 1 from profiles where username = lower(u) and id <> auth.uid());
$$;

create or replace function public.set_profile(u text, name text, col text) returns json language plpgsql as $$
begin
  insert into public.profiles (id, username, display_name, color) values (auth.uid(), lower(trim(u)), trim(name), col)
  on conflict (id) do update set username = excluded.username, display_name = excluded.display_name, color = excluded.color, updated_at = now();
  return public.my_profile();
end $$;

-- relation from me to them: 'none' | 'invited' (I invited) | 'invites_you' | 'companion'
create or replace function public.relation(other uuid) returns text language sql stable as $$
  select coalesce((select case when c.status = 'accepted' then 'companion' when c.requester = auth.uid() then 'invited' else 'invites_you' end
    from public.companions c where (c.requester = auth.uid() and c.addressee = other) or (c.addressee = auth.uid() and c.requester = other) limit 1), 'none');
$$;

create or replace function public.search_people(q text)
returns table (id uuid, username text, display_name text, color text, relation text) language sql stable as $$
  with s as (select lower(ltrim(trim(q), '@')) as t)
  select p.id, p.username, p.display_name, p.color, public.relation(p.id)
  from public.profiles p, s
  where p.id <> auth.uid() and char_length(s.t) >= 2
    and (position(s.t in p.username) > 0 or position(s.t in lower(p.display_name)) > 0)
  order by (p.username = s.t) desc, (left(p.username, char_length(s.t)) = s.t) desc, p.username
  limit 20;
$$;

create or replace function public.my_circle()
returns table (id uuid, username text, display_name text, color text, relation text, since timestamptz) language sql stable as $$
  select p.id, p.username, p.display_name, p.color, public.relation(p.id), coalesce(c.accepted_at, c.created_at)
  from public.companions c join public.profiles p on p.id = case when c.requester = auth.uid() then c.addressee else c.requester end
  where auth.uid() in (c.requester, c.addressee)
  order by c.status = 'invited' and c.addressee = auth.uid() desc, p.display_name, p.username;
$$;

create or replace function public.journey_of(uname text) returns json language sql stable as $$
  select json_build_object(
    'id', p.id, 'username', p.username, 'display_name', p.display_name, 'color', p.color,
    'relation', public.relation(p.id), 'me', p.id = auth.uid(),
    'journey', (select row_to_json(j) from (select weeks, months, streak, last_read, reading from public.journeys where user_id = p.id) j),
    'moments', (select coalesce(json_agg(m order by m.created_at desc), '[]') from (select kind, key, title, created_at from public.moments where user_id = p.id order by created_at desc limit 60) m),
    'lights', (select coalesce(json_agg(l order by l.created_at desc), '[]') from (select id, book, chapter, verse_start, verse_end, body, created_at from public.lights where user_id = p.id order by created_at desc limit 30) l))
  from public.profiles p where p.username = lower(ltrim(trim(uname), '@'));
$$;

create or replace function public.invite(other uuid) returns text language plpgsql as $$
declare r text := public.relation(other);
begin
  if r = 'invites_you' then
    update public.companions set status = 'accepted', accepted_at = now() where requester = other and addressee = auth.uid();
  elsif r = 'none' then
    insert into public.companions (requester, addressee) values (auth.uid(), other);
  end if;
  return public.relation(other);
end $$;

create or replace function public.accept(other uuid) returns text language plpgsql as $$
begin
  update public.companions set status = 'accepted', accepted_at = now() where requester = other and addressee = auth.uid() and status = 'invited';
  return public.relation(other);
end $$;

-- declines an invite, cancels yours, or ends a companionship
create or replace function public.part(other uuid) returns text language plpgsql as $$
begin
  delete from public.companions where (requester = auth.uid() and addressee = other) or (requester = other and addressee = auth.uid());
  return 'none';
end $$;

create or replace function public.block(other uuid) returns void language plpgsql as $$
begin
  perform public.part(other);
  insert into public.blocks (blocker, blocked) values (auth.uid(), other) on conflict do nothing;
end $$;

create or replace function public.unblock(other uuid) returns void language sql as $$
  delete from public.blocks where blocker = auth.uid() and blocked = other;
$$;

create or replace function public.my_blocks() returns table (id uuid, username text, display_name text) language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.display_name from blocks b join profiles p on p.id = b.blocked where b.blocker = auth.uid() order by p.username;
$$;

create or replace function public.report(other uuid, why text, light uuid default null) returns void language sql as $$
  insert into public.reports (reported, reason, light_id) values (other, left(why, 500), light);
$$;

create or replace function public.share_light(b text, c int, vs int, ve int, body text, note text) returns uuid language plpgsql as $$
declare i uuid;
begin
  if note is not null then delete from public.lights where user_id = auth.uid() and note_id = note; end if;
  insert into public.lights (book, chapter, verse_start, verse_end, body, note_id) values (b, c, vs, ve, left(body, 2000), note) returning id into i;
  return i;
end $$;

create or replace function public.unshare_light(note text) returns void language sql as $$
  delete from public.lights where user_id = auth.uid() and note_id = note;
$$;

create or replace function public.my_lights() returns table (id uuid, note_id text) language sql stable as $$
  select id, note_id from public.lights where user_id = auth.uid();
$$;

create or replace function public.lights_on(b text, c int)
returns table (id uuid, verse_start int, verse_end int, body text, created_at timestamptz, user_id uuid, username text, display_name text, color text) language sql stable as $$
  select l.id, l.verse_start, l.verse_end, l.body, l.created_at, p.id, p.username, p.display_name, p.color
  from public.lights l join public.profiles p on p.id = l.user_id
  where l.book = b and l.chapter = c and l.user_id <> auth.uid()
  order by l.verse_start nulls first, l.created_at;
$$;

create or replace function public.add_moment(k text, kk text, t text) returns void language sql as $$
  insert into public.moments (kind, key, title) values (k, kk, left(t, 120)) on conflict (user_id, kind, key) do nothing;
$$;

create or replace function public.set_journey(w int, m int, s int, lr date, rd text) returns void language sql as $$
  insert into public.journeys (weeks, months, streak, last_read, reading) values (w, m, s, lr, left(rd, 60))
  on conflict (user_id) do update set weeks = excluded.weeks, months = excluded.months, streak = excluded.streak,
    last_read = excluded.last_read, reading = excluded.reading, updated_at = now();
$$;

-- Along the way: what your companions did lately
create or replace function public.along_the_way(lim int default 20)
returns table (kind text, title text, book text, chapter int, verse_start int, body text, created_at timestamptz, username text, display_name text, color text) language sql stable as $$
  select * from (
    select m.kind, m.title, null::text, null::int, null::int, null::text, m.created_at, p.username, p.display_name, p.color
      from public.moments m join public.profiles p on p.id = m.user_id where m.user_id <> auth.uid()
    union all
    select 'light', null, l.book, l.chapter, l.verse_start, left(l.body, 160), l.created_at, p.username, p.display_name, p.color
      from public.lights l join public.profiles p on p.id = l.user_id where l.user_id <> auth.uid()
  ) x order by created_at desc limit least(lim, 50);
$$;

-- the functions are for signed-in people only
do $$
declare f text;
begin
  foreach f in array array['my_profile()', 'username_free(text)', 'set_profile(text,text,text)', 'relation(uuid)', 'search_people(text)', 'my_circle()',
    'journey_of(text)', 'invite(uuid)', 'accept(uuid)', 'part(uuid)', 'block(uuid)', 'unblock(uuid)', 'my_blocks()', 'report(uuid,text,uuid)',
    'share_light(text,int,int,int,text,text)', 'unshare_light(text)', 'my_lights()', 'lights_on(text,int)', 'add_moment(text,text,text)',
    'set_journey(int,int,int,date,text)', 'along_the_way(int)', 'companion_of(uuid)', 'blocked_with(uuid)'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
