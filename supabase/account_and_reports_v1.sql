-- Applied 2026-11-13 as migrations account_deletion_and_federation_reports and get_share_token_for_whatsapp. Account deletion, wrong-email reports, WhatsApp share token.

-- Players may delete their own video files (needed so "delete my account" can remove them).
drop policy if exists "players delete own videos" on storage.objects;
create policy "players delete own videos" on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Deleting the login cascades to profile, submissions, shortlists and the outreach log.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- Players can flag a federation address that bounced or belongs to the wrong body.
create table if not exists public.federation_reports (
  id bigint generated always as identity primary key,
  federation_id int not null references public.federations(id) on delete cascade,
  reporter uuid references auth.users(id) on delete set null,
  reason text not null check (reason in ('bounced', 'wrong_body', 'other')),
  created_at timestamptz not null default now()
);
alter table public.federation_reports enable row level security; -- no policies: only the function below writes
revoke all on public.federation_reports from anon, authenticated;
create index if not exists federation_reports_fed on public.federation_reports(federation_id);
create index if not exists federation_reports_reporter_time on public.federation_reports(reporter, created_at);

create or replace function public.report_federation_email(p_federation int, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); recent int;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if p_reason is null or p_reason not in ('bounced', 'wrong_body', 'other') then raise exception 'bad_reason'; end if;
  perform pg_advisory_xact_lock(hashtextextended('report:' || uid::text, 0));
  if not exists (select 1 from public.federations where id = p_federation) then raise exception 'federation_not_found'; end if;
  if exists (select 1 from public.federation_reports where reporter = uid and federation_id = p_federation and created_at > now() - interval '24 hours') then
    return; -- already reported today; not an error
  end if;
  select count(*) into recent from public.federation_reports where reporter = uid and created_at > now() - interval '24 hours';
  if recent >= 5 then raise exception 'rate_limited'; end if;
  insert into public.federation_reports(federation_id, reporter, reason) values (p_federation, uid, p_reason);
end $$;
revoke all on function public.report_federation_email(int, text) from public, anon, authenticated;
grant execute on function public.report_federation_email(int, text) to authenticated;

-- Returns the proof-link token to the owner of a scored result with consent on (used for the WhatsApp share).
create or replace function public.get_share_token(p_submission uuid)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare t uuid;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select s.share_token into t
  from public.submissions s join public.profiles p on p.id = s.player_id
  where s.id = p_submission and s.player_id = auth.uid() and s.status = 'scored' and p.parent_consent is true;
  if t is null then raise exception 'not_eligible'; end if;
  return t;
end $$;
revoke all on function public.get_share_token(uuid) from public, anon, authenticated;
grant execute on function public.get_share_token(uuid) to authenticated;
