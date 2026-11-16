-- Applied 2026-11-16 as migration video_visibility_scout_feed_retention.
-- 1) players choose public/private per video, 2) scouts get a feed RPC that includes the player's email
--    (public + parent consent only), 3) storage usage + retention bookkeeping for the cleanup job.

alter table public.submissions
  add column if not exists visibility text not null default 'private' check (visibility in ('public','private')),
  add column if not exists video_compressed_at timestamptz,
  add column if not exists video_deleted_at timestamptz;

-- Players cannot update submissions directly (score/status are server-owned), so visibility goes through an RPC.
create or replace function public.set_video_visibility(p_submission uuid, p_visibility text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_visibility not in ('public','private') then raise exception 'bad_visibility'; end if;
  update public.submissions set visibility = p_visibility
   where id = p_submission and player_id = auth.uid() and video_deleted_at is null;
  if not found then raise exception 'not_found'; end if;
end $$;
revoke all on function public.set_video_visibility(uuid, text) from public, anon;
grant execute on function public.set_video_visibility(uuid, text) to authenticated;

-- Scouts only see public, scored, consented, still-stored videos.
drop policy if exists "scouts read scored submissions of consented players" on public.submissions;
create policy "scouts read public scored submissions" on public.submissions for select
  using (private.is_verified_scout() and status = 'scored' and visibility = 'public' and video_deleted_at is null
         and exists (select 1 from public.profiles p where p.id = submissions.player_id and p.parent_consent));

drop policy if exists "scouts read consented scored videos" on storage.objects;
create policy "scouts read public scored videos" on storage.objects for select
  using (bucket_id = 'videos' and private.is_verified_scout() and exists (
    select 1 from public.submissions s join public.profiles p on p.id = s.player_id
     where s.video_path = objects.name and s.status = 'scored' and s.visibility = 'public'
       and s.video_deleted_at is null and p.parent_consent));

-- Feed for scouts: one row per public scored video, with the player's email so a scout can write directly.
create or replace function public.scout_feed(p_sport int default null, p_min numeric default 0, p_state text default null, p_limit int default 100)
returns table (submission_id uuid, player_id uuid, full_name text, age int, village text, district text, state text,
               sport_id int, score numeric, metric_value numeric, created_at timestamptz, email text)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_verified_scout() then raise exception 'not_scout'; end if;
  return query
    select s.id, s.player_id, p.full_name, p.age, p.village, p.district, p.state, s.sport_id, s.score,
           s.metric_value, s.created_at, u.email::text
      from public.submissions s
      join public.profiles p on p.id = s.player_id
      join auth.users u on u.id = s.player_id
     where s.status = 'scored' and s.visibility = 'public' and s.video_deleted_at is null and p.parent_consent
       and s.score >= coalesce(p_min, 0)
       and (p_sport is null or s.sport_id = p_sport)
       and (p_state is null or p_state = '' or p.state ilike '%' || p_state || '%')
     order by s.score desc, s.created_at desc
     limit least(coalesce(p_limit, 100), 200);
end $$;
revoke all on function public.scout_feed(int, numeric, text, int) from public, anon;
grant execute on function public.scout_feed(int, numeric, text, int) to authenticated;

-- Used by the cleanup job (service key only): bytes held by the videos bucket.
create or replace function public.storage_usage() returns bigint
language sql security definer set search_path = '' as $$
  select coalesce(sum((metadata->>'size')::bigint), 0) from storage.objects where bucket_id = 'videos'
$$;
revoke all on function public.storage_usage() from public, anon, authenticated;
grant execute on function public.storage_usage() to service_role;
