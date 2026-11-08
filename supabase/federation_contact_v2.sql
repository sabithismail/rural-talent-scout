-- Applied 2026-11-08 as migration federation_contact_v2_review_fixes. Review fixes: atomic rate limit, audit columns, empty search_path, revoke feedback, facts RPC for the draft API.

alter table public.outreach_log add column if not exists guardian_ok boolean;
alter table public.outreach_log add column if not exists age_at_send int;
create index if not exists outreach_log_player_time on public.outreach_log(player_id, created_at);
alter table public.federations drop constraint if exists federations_source_https;
alter table public.federations add constraint federations_source_https check (source_url is null or source_url ~ '^https://');

create or replace function public.prepare_outreach(p_submission uuid, p_federation int, p_guardian_ok boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  s record; pr record; f record; recent int;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0)); -- serialise calls per user so the daily cap cannot be raced
  select id, player_id, status, score, share_token, sport_id, created_at into s from public.submissions where id = p_submission and player_id = uid;
  if not found then raise exception 'not_found'; end if;
  if s.status <> 'scored' or s.score is null or round(s.score) < 70 then raise exception 'not_eligible_score'; end if;
  select full_name, age, village, district, state, parent_consent into pr from public.profiles where id = uid;
  if not found or pr.parent_consent is not true then raise exception 'not_eligible_consent'; end if;
  if (pr.age is null or pr.age < 18) and p_guardian_ok is not true then raise exception 'guardian_needed'; end if;
  select id, state, body_name, email, confidence into f from public.federations where id = p_federation;
  if not found then raise exception 'federation_not_found'; end if;
  select count(*) into recent from public.outreach_log where player_id = uid and created_at > now() - interval '24 hours';
  if recent >= 5 then raise exception 'rate_limited'; end if;
  insert into public.outreach_log(player_id, submission_id, federation_id, guardian_ok, age_at_send)
    values (uid, s.id, f.id, p_guardian_ok, pr.age);
  return jsonb_build_object(
    'token', s.share_token,
    'score', round(s.score),
    'sport', (select name from public.sports where id = s.sport_id),
    'name', pr.full_name, 'age', pr.age, 'village', pr.village, 'district', pr.district, 'state', pr.state,
    'date', s.created_at,
    'federation', jsonb_build_object('id', f.id, 'state', f.state, 'body_name', f.body_name, 'email', f.email, 'confidence', f.confidence)
  );
end $$;

create or replace function public.verify_score(p_token uuid)
returns jsonb language sql security definer stable set search_path = '' as $$
  select jsonb_build_object(
    'first_name', split_part(btrim(pr.full_name), ' ', 1),
    'district', pr.district, 'state', pr.state,
    'sport', sp.name, 'score', round(s.score), 'date', s.created_at)
  from public.submissions s
  join public.profiles pr on pr.id = s.player_id
  join public.sports sp on sp.id = s.sport_id
  where s.share_token = p_token and s.status = 'scored' and pr.parent_consent is true
$$;

create or replace function public.revoke_share_link(p_submission uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  update public.submissions set share_token = gen_random_uuid() where id = p_submission and player_id = auth.uid();
  get diagnostics n = row_count;
  if n = 0 then raise exception 'not_found'; end if;
end $$;

-- Facts for the AI draft, only for a link this user prepared in the last 24 hours (so the API never trusts the browser).
create or replace function public.get_outreach_facts(p_token uuid)
returns jsonb language sql security definer stable set search_path = '' as $$
  select jsonb_build_object(
    'name', pr.full_name, 'minor', (pr.age is null or pr.age < 18),
    'district', pr.district, 'state', pr.state,
    'sport', sp.name, 'score', round(s.score),
    'fedBody', f.body_name)
  from public.outreach_log ol
  join public.submissions s on s.id = ol.submission_id and s.player_id = ol.player_id
  join public.profiles pr on pr.id = ol.player_id
  join public.sports sp on sp.id = s.sport_id
  join public.federations f on f.id = ol.federation_id
  where s.share_token = p_token and ol.player_id = auth.uid() and ol.created_at > now() - interval '24 hours'
  order by ol.created_at desc limit 1
$$;

revoke all on function public.get_outreach_facts(uuid) from public, anon, authenticated;
grant execute on function public.get_outreach_facts(uuid) to authenticated;
revoke all on function public.prepare_outreach(uuid,int,boolean), public.revoke_share_link(uuid), public.verify_score(uuid) from public, anon, authenticated;
grant execute on function public.prepare_outreach(uuid,int,boolean), public.revoke_share_link(uuid) to authenticated;
grant execute on function public.verify_score(uuid) to anon, authenticated;

-- Tokens: no direct reads or writes for any API role; anon gets nothing on submissions.
revoke all on public.submissions from anon;
revoke insert (share_token), update (share_token) on public.submissions from authenticated, anon;

-- Data fixes: West Bengal role is unclear, extra short aliases, drop a truncated alias.
update public.federations set confidence = 'closest' where state = 'West Bengal';
update public.federations set keys = array_remove(keys, 'dadraandnagarhaveliand');
update public.federations f set keys = (select array(select distinct unnest(f.keys || v.extra))) from (values
  ('Tamil Nadu', array['tn']), ('West Bengal', array['wb']), ('Himachal Pradesh', array['hp']),
  ('Uttarakhand', array['uk','ua']), ('Karnataka', array['ka']), ('Maharashtra', array['mh']),
  ('Kerala', array['kl']), ('Telangana', array['ts','tg']), ('Odisha', array['od']),
  ('Rajasthan', array['rj']), ('Gujarat', array['gj']), ('Haryana', array['hr']),
  ('Punjab', array['pb']), ('Bihar', array['br']), ('Chhattisgarh', array['cg']),
  ('Jharkhand', array['jh']), ('Andhra Pradesh', array['andhra'])
) as v(st, extra) where f.state = v.st;
