-- Applied 2026-11-20 as migration notifications_admin_limits.
-- 1) in-app + email notifications (scored / rejected / shortlisted), 2) one admin who approves scouts,
-- 3) length limits so one very long unbroken string cannot be stored.

-- ---------- length limits ----------
alter table public.profiles
  add constraint profiles_full_name_len check (char_length(full_name) <= 80),
  add constraint profiles_village_len check (char_length(village) <= 80),
  add constraint profiles_district_len check (char_length(district) <= 80),
  add constraint profiles_state_len check (char_length(state) <= 80),
  add constraint profiles_school_len check (char_length(school_or_club) <= 100);
alter table public.submissions add constraint submissions_notes_len check (char_length(notes) <= 500);

-- ---------- single admin ----------
create table if not exists public.admin_users (email text primary key check (email = lower(email)));
create unique index if not exists admin_users_only_one on public.admin_users ((true));
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
insert into public.admin_users (email) values ('ismailsabith68@gmail.com') on conflict do nothing;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u join public.admin_users a on a.email = lower(u.email)
     where u.id = auth.uid() and u.email_confirmed_at is not null)
$$;

create or replace function public.am_i_admin() returns boolean
language sql stable security definer set search_path = '' as $$ select private.is_admin() $$;

create or replace function public.admin_scouts()
returns table (id uuid, full_name text, username text, email text, verified_scout boolean, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  return query
    select p.id, p.full_name, p.username, u.email::text, p.verified_scout, u.created_at
      from public.profiles p join auth.users u on u.id = p.id
     where p.role = 'scout'
     order by p.verified_scout, u.created_at desc
     limit 200;
end $$;

create or replace function public.admin_set_scout_verified(p_user uuid, p_verified boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'not_admin'; end if;
  update public.profiles set verified_scout = p_verified where id = p_user and role = 'scout';
  if not found then raise exception 'not_found'; end if;
end $$;

revoke all on function public.am_i_admin(), public.admin_scouts(), public.admin_set_scout_verified(uuid, boolean) from public, anon;
grant execute on function public.am_i_admin(), public.admin_scouts(), public.admin_set_scout_verified(uuid, boolean) to authenticated;
revoke all on function private.is_admin() from public, anon;

-- ---------- notifications ----------
alter table public.profiles add column if not exists email_notifications boolean not null default true;
grant update (email_notifications) on public.profiles to authenticated;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('scored','rejected','shortlisted')),
  submission_id uuid references public.submissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  emailed_at timestamptz
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unsent_idx on public.notifications (created_at) where emailed_at is null;
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
create policy "own notifications read" on public.notifications for select using (user_id = (select auth.uid()));

create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null
$$;
revoke all on function public.mark_notifications_read() from public, anon;
grant execute on function public.mark_notifications_read() to authenticated;

create or replace function private.notify_on_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.status in ('scored','rejected') then
    insert into public.notifications (user_id, kind, submission_id) values (new.player_id, new.status, new.id);
  end if;
  return new;
end $$;
drop trigger if exists submissions_notify on public.submissions;
create trigger submissions_notify after update of status on public.submissions
  for each row execute function private.notify_on_status();

create or replace function private.notify_on_shortlist() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- a scout toggling the button must not spam the player: one per week
  if not exists (select 1 from public.notifications n where n.user_id = new.player_id and n.kind = 'shortlisted'
                  and n.created_at > now() - interval '7 days') then
    insert into public.notifications (user_id, kind) values (new.player_id, 'shortlisted');
  end if;
  return new;
end $$;
drop trigger if exists shortlists_notify on public.shortlists;
create trigger shortlists_notify after insert on public.shortlists
  for each row execute function private.notify_on_shortlist();

-- Email job (service key only)
create or replace function public.pending_email_notifications()
returns table (id uuid, kind text, email text, full_name text, lang text, sport text, score numeric, wanted boolean)
language sql security definer set search_path = '' as $$
  select n.id, n.kind, u.email::text, p.full_name, p.preferred_language, s.name, sub.score, p.email_notifications
    from public.notifications n
    join auth.users u on u.id = n.user_id
    join public.profiles p on p.id = n.user_id
    left join public.submissions sub on sub.id = n.submission_id
    left join public.sports s on s.id = sub.sport_id
   where n.emailed_at is null and n.created_at > now() - interval '2 days'
   order by n.created_at limit 50
$$;
create or replace function public.mark_notifications_emailed(p_ids uuid[]) returns void
language sql security definer set search_path = '' as $$
  update public.notifications set emailed_at = now() where id = any(p_ids)
$$;
revoke all on function public.pending_email_notifications(), public.mark_notifications_emailed(uuid[]) from public, anon, authenticated;
grant execute on function public.pending_email_notifications(), public.mark_notifications_emailed(uuid[]) to service_role;
