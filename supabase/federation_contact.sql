-- Federation contact feature: federations directory, outreach log, share tokens, 2 RPCs.

create table if not exists public.federations (
  id serial primary key,
  state text not null unique,
  keys text[] not null,
  body_name text not null,
  email text not null check (email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
  kind text not null check (kind in ('official_gov','olympic_assoc','state_assoc','district_office','other')),
  confidence text not null check (confidence in ('official','closest')),
  source_url text,
  note text
);
alter table public.federations enable row level security;
create policy "signed-in read federations" on public.federations for select to authenticated using (true);
revoke all on public.federations from anon, authenticated;
grant select (id, state, keys, body_name, email, kind, confidence, source_url, note) on public.federations to authenticated;

create table if not exists public.outreach_log (
  id bigserial primary key,
  player_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  federation_id int not null references public.federations(id),
  created_at timestamptz not null default now()
);
alter table public.outreach_log enable row level security;
create policy "players read own outreach" on public.outreach_log for select to authenticated using (player_id = (select auth.uid()));
revoke all on public.outreach_log from anon, authenticated;
grant select on public.outreach_log to authenticated;

alter table public.submissions add column if not exists share_token uuid not null default gen_random_uuid();
create unique index if not exists submissions_share_token_key on public.submissions(share_token);
-- share_token is deliberately NOT granted to any API role; it is only reachable through the RPCs below.

create or replace function public.prepare_outreach(p_submission uuid, p_federation int, p_guardian_ok boolean default false)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  s record; pr record; f record; recent int;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select id, player_id, status, score, share_token, sport_id, created_at into s from submissions where id = p_submission and player_id = uid;
  if not found then raise exception 'not_found'; end if;
  if s.status <> 'scored' or s.score is null or s.score < 70 then raise exception 'not_eligible_score'; end if;
  select full_name, age, village, district, state, parent_consent into pr from profiles where id = uid;
  if not found or pr.parent_consent is not true then raise exception 'not_eligible_consent'; end if;
  if (pr.age is null or pr.age < 18) and p_guardian_ok is not true then raise exception 'guardian_needed'; end if;
  select id, state, body_name, email, confidence into f from federations where id = p_federation;
  if not found then raise exception 'federation_not_found'; end if;
  select count(*) into recent from outreach_log where player_id = uid and created_at > now() - interval '24 hours';
  if recent >= 5 then raise exception 'rate_limited'; end if;
  insert into outreach_log(player_id, submission_id, federation_id) values (uid, s.id, f.id);
  return jsonb_build_object(
    'token', s.share_token,
    'score', round(s.score),
    'sport', (select name from sports where id = s.sport_id),
    'name', pr.full_name, 'age', pr.age, 'village', pr.village, 'district', pr.district, 'state', pr.state,
    'date', s.created_at,
    'federation', jsonb_build_object('id', f.id, 'state', f.state, 'body_name', f.body_name, 'email', f.email, 'confidence', f.confidence)
  );
end $$;

create or replace function public.verify_score(p_token uuid)
returns jsonb language sql security definer stable set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'first_name', split_part(pr.full_name, ' ', 1),
    'district', pr.district, 'state', pr.state,
    'sport', sp.name, 'score', round(s.score), 'date', s.created_at)
  from submissions s
  join profiles pr on pr.id = s.player_id
  join sports sp on sp.id = s.sport_id
  where s.share_token = p_token and s.status = 'scored' and pr.parent_consent is true
$$;

create or replace function public.revoke_share_link(p_submission uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  update submissions set share_token = gen_random_uuid() where id = p_submission and player_id = auth.uid();
end $$;

revoke all on function public.prepare_outreach(uuid,int,boolean), public.verify_score(uuid), public.revoke_share_link(uuid) from public, anon, authenticated;
grant execute on function public.prepare_outreach(uuid,int,boolean) to authenticated;
grant execute on function public.revoke_share_link(uuid) to authenticated;
grant execute on function public.verify_score(uuid) to anon, authenticated;

insert into public.federations(state,keys,body_name,email,kind,confidence,source_url,note) values
('Andhra Pradesh',array['andhrapradesh','ap'],'Department of Youth Services, Andhra Pradesh (state office)','dysapys@gmail.com','other','closest','https://www.youthservices.ap.gov.in/ContactUs.html','Youth services office; SAAP has no email listed.'),
('Arunachal Pradesh',array['arunachalpradesh','arunachal'],'Dept of Secondary Education, Arunachal Pradesh (school sports)','sportsdse@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','School-education sports contact.'),
('Assam',array['assam'],'Directorate of Sports & Youth Welfare, Assam','dsyw.assam@assam.gov.in','official_gov','official','https://www.sgfi.org.in/Home/ContactUs','From the SGFI table; not seen on an Assam government page.'),
('Bihar',array['bihar'],'Department of Sports, Government of Bihar (Director, Sports)','director.sports-bih@gov.in','official_gov','official','https://betastate.bihar.gov.in/sports',null),
('Chhattisgarh',array['chhattisgarh','chattisgarh'],'Chhattisgarh Rugby Football Association (state sports association)','cgrugby@gmail.com','state_assoc','closest','https://rugbyindia.in/wp-content/uploads/Rugby-India-State-Association-Details-2026.pdf','Single-sport association; no state sports directorate email found.'),
('Goa',array['goa'],'Directorate of Sports and Youth Affairs, Goa','dir-spor.goa@nic.in','official_gov','official','https://www.goa.gov.in/department/sports-and-youth-affairs/',null),
('Gujarat',array['gujarat'],'Sports Authority of Gujarat (SAG), Gandhinagar','sgfi-sag@gujarat.gov.in','official_gov','official','https://www.sgfi.org.in/Home/ContactUs','Listed as SAG''s school-games contact.'),
('Haryana',array['haryana'],'Department of Sports & Youth Affairs, Haryana','ps-sports@hry.gov.in','official_gov','official','https://haryanasports.gov.in/contact-us/',null),
('Himachal Pradesh',array['himachalpradesh','himachal'],'Rugby Association Himachal Pradesh (state sports association)','himachalpradeshrugby@gmail.com','state_assoc','closest','https://rugbyindia.in/wp-content/uploads/Rugby-India-State-Association-Details-2026.pdf','Single-sport association; no state sports department email found.'),
('Jharkhand',array['jharkhand'],'Sports Authority of Jharkhand','sajha9@gmail.com','other','closest','https://www.indgovtjobs.in/2024/11/sports-authority-of-jharkhand.html','From a job-listing site, late 2024; may be outdated.'),
('Karnataka',array['karnataka'],'Karnataka school and PU education sports office','dpue.sports@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','Not the Dept of Youth Empowerment and Sports; no official DYES email found.'),
('Kerala',array['kerala'],'Kerala Olympic Association, Thiruvananthapuram','keralasoa@gmail.com','olympic_assoc','official','https://keralaolympic.org/sports-organizations.php','State Olympic body; the Kerala State Sports Council lists no email.'),
('Madhya Pradesh',array['madhyapradesh','mp'],'Directorate of Public Instruction, MP (school sports wing)','physicaldpi@mp.gov.in','other','closest','https://www.sgfi.org.in/Home/ContactUs','School sports, not the main sports directorate.'),
('Maharashtra',array['maharashtra'],'Directorate of Sports & Youth Services, Maharashtra (as listed by SGFI)','dsysdesk4@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','Third-party listing; not confirmed on a state page.'),
('Manipur',array['manipur'],'Directorate of Youth Affairs and Sports, Manipur (as listed by SGFI)','yasofficemanipur@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','Third-party listing; may be outdated.'),
('Meghalaya',array['meghalaya'],'Directorate of Sports & Youth Affairs, Meghalaya','dsyamegh@gmail.com','official_gov','official','https://megsports.gov.in/contacts.html',null),
('Mizoram',array['mizoram'],'Directorate of School Education, Mizoram','dirsemz@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','School-education directorate; weak match.'),
('Nagaland',array['nagaland'],'Department of Youth Resources & Sports, Nagaland (Director)','diryr-ngl@nic.in','official_gov','official','https://nagaland.gov.in/hods',null),
('Odisha',array['odisha','orissa'],'Odisha school sports association (SGFI unit)','schoolsports01association@gmail.com','state_assoc','closest','https://www.sgfi.org.in/Home/ContactUs','Weak match; not the Sports & Youth Services Dept.'),
('Punjab',array['punjab'],'Department of Sports and Youth Services, Punjab (Director Sports)','dir.sportspb@punjab.gov.in','official_gov','official','https://punjab.gov.in/?p=1283',null),
('Rajasthan',array['rajasthan'],'Rajasthan State Sports Council, Jaipur','rsscjaipur@gmail.com','official_gov','official','https://www.rssc.in/upload/uploadNews/19801_Advertisement%20KISCE%20Manpower%20(1).pdf','From the council''s own notice letterhead.'),
('Sikkim',array['sikkim'],'Sports & Youth Affairs Department, Sikkim','syasikkim@gmail.com','official_gov','official','https://sikkim.gov.in/departments/sports-and-youth-affairs-department',null),
('Tamil Nadu',array['tamilnadu'],'Sports Development Authority of Tamil Nadu (SDAT)','sportstn@eth.net','official_gov','official','https://tn.gov.in/rti/rti_tamil/proactive/ywsd/handbook-SDA.pdf','From an RTI handbook; may be old.'),
('Telangana',array['telangana'],'Commissioner of School Education, Telangana','tg.cdse@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','School education; nothing found for the Sports Authority of Telangana.'),
('Tripura',array['tripura'],'Directorate of Youth Affairs & Sports, Tripura (as listed by SGFI)','yasdirector14@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','Third-party listing; may be outdated.'),
('Uttar Pradesh',array['uttarpradesh','up'],'Department of Secondary Education, Uttar Pradesh (school sports)','desecedu@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','School sports, not the UP Sports Directorate.'),
('Uttarakhand',array['uttarakhand','uttaranchal'],'Directorate of Secondary Education, Uttarakhand (sports)','sportssecondaryschooluk@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','School sports office.'),
('West Bengal',array['westbengal','bengal'],'Department of Youth Services and Sports, West Bengal','dssportswb@gmail.com','official_gov','official','https://wbsportsandyouth.gov.in/contactus','One of six addresses on that page; exact role not stated.'),
('Andaman and Nicobar Islands',array['andamanandnicobarislands','andamanandnicobar','andaman','nicobar','an','aandn'],'Directorate of Sports & Youth Affairs, A&N Administration','directorsportsani@gmail.com','official_gov','official','https://andamannicobar.gov.in/pdf/SYA_Sou%20Motu%20RTI.pdf',null),
('Chandigarh',array['chandigarh'],'Directorate of School Education, Chandigarh (AEO Sports)','aeosports@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','School sports office, not the UT sports department.'),
('Dadra and Nagar Haveli and Daman and Diu',array['dadraandnagarhavelianddamananddiu','dadraandnagarhaveli','damananddiu','daman','diu','dnh','dd','dnhdd','dnhanddd','dadraandnagarhaveliand'],'Directorate of Youth Affairs & Sports, DNH and DD','sports-dmn-dd@nic.in','official_gov','official','https://www.sgfi.org.in/Home/ContactUs','From the SGFI table.'),
('Delhi',array['delhi','newdelhi','nctofdelhi','nctdelhi'],'Directorate of Education, Delhi (sports branch)','ddesportsdelhi@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','School sports, not the Directorate of Sports and Youth Services.'),
('Jammu and Kashmir',array['jammuandkashmir','jammukashmir','jk','jandk'],'Directorate of Youth Services & Sports, J&K (as listed by SGFI)','dir-sports@rediffmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','Third-party listing; may be outdated.'),
('Ladakh',array['ladakh'],'Department of Youth Services & Sports, Ladakh (Joint Director)','ladakhsports22@gmail.com','official_gov','official','https://ladakh.gov.in/youth-services-and-sports/page/7',null),
('Lakshadweep',array['lakshadweep'],'Directorate of Sports & Youth Affairs, Kavaratti','sya.kvt.utl@gmail.com','other','closest','https://www.sgfi.org.in/Home/ContactUs','Third-party listing.'),
('Puducherry',array['puducherry','pondicherry'],'Secretary, Dept of Youth Affairs & Sports, Puducherry','secyeands@py.gov.in','official_gov','official','https://nss.gov.in/sites/default/files/U.T.%20OF%20PUDUCHERRY.pdf','From an old directory; may be outdated.')
on conflict (state) do nothing;

-- Share tokens must not be readable through the table API: replace the old table-wide SELECT with explicit columns.
revoke select on public.submissions from authenticated;
grant select (id, player_id, sport_id, video_path, notes, status, metric_value, score, analysis, created_at, reported_value, video_hash) on public.submissions to authenticated;
