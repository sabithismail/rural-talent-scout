-- Applied 2026-11-22 as migration leaderboard_and_pose.
alter table public.submissions add column if not exists pose jsonb;
grant select (pose) on public.submissions to authenticated;

alter table public.profiles add column if not exists show_on_leaderboard boolean not null default false;
grant update (show_on_leaderboard) on public.profiles to authenticated;

-- Best scored result per opted-in player. First name and place only. Under-18s also need guardian consent.
create or replace function public.leaderboard(p_sport int, p_state text default null, p_band text default null,
                                              p_gender text default null, p_limit int default 50)
returns table (rank bigint, first_name text, district text, state text, age_band text, score numeric)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  return query
    with best as (
      select distinct on (s.player_id) s.player_id, s.score
        from public.submissions s
       where s.sport_id = p_sport and s.status = 'scored'
       order by s.player_id, s.score desc
    ), joined as (
      select split_part(p.full_name, ' ', 1) as fname, p.district as d, p.state as st,
             case when p.age < 14 then 'u14' when p.age < 18 then '14-17' else '18+' end as band,
             p.gender as g, b.score as sc
        from best b join public.profiles p on p.id = b.player_id
       where p.show_on_leaderboard and (p.age >= 18 or p.parent_consent) and p.age is not null
    )
    select row_number() over (order by j.sc desc, j.fname)::bigint, j.fname, j.d, j.st, j.band, j.sc
      from joined j
     where (p_state is null or p_state = '' or j.st ilike '%' || p_state || '%')
       and (p_band is null or p_band = '' or j.band = p_band)
       and (p_gender is null or p_gender = '' or j.g = p_gender)
     order by j.sc desc, j.fname
     limit least(coalesce(p_limit, 50), 100);
end $$;
revoke all on function public.leaderboard(int, text, text, text, int) from public, anon;
grant execute on function public.leaderboard(int, text, text, text, int) to authenticated;
