# Rural Talent Scout

A platform where rural sports players pick a sport, upload a drill video and get a 0-100 score that scouts can see.

## Parts
| Part | Tech | Folder |
|---|---|---|
| Website + phone app (one installable PWA) | Next.js 15, TypeScript | `app/`, `components/`, `lib/` |
| Database, login, video storage | Supabase (Auth, Postgres + RLS, private bucket) | project `iehvnrrfdjrpxgrvwfon` |
| Scoring engine (the Java micro project) | Java 17, Spring Boot 3 | `scoring-service/` |
| Video validity checker | Python, FastAPI, OpenCV | `video-checker/` |

## Pipeline
`pending` (player uploads) -> Python checker -> `validated` or `rejected` -> Java engine -> `scored` (0-100).

Score = clamp((value - floor) / (elite - floor), 0, 1) x 100, using age band and gender benchmarks.
Benchmarks are starter values from published norms; tune them in `scoring-service/src/main/resources/catalog.csv`.
Honest limit: the result number is self-reported, the checker only verifies the video is genuine and plausible.

## Run
    npm install && npm run dev                     # website, uses .env.local
    cd scoring-service && mvn spring-boot:run      # http://localhost:8080  (mvn test for tests)
    cd video-checker && pytest                     # checker tests
Set `NEXT_PUBLIC_SCORING_URL` to wherever the Java service is hosted.
Scoring job: `POST /api/jobs/score-pending` with header `X-Admin-Token`; env `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ADMIN_TOKEN`.

## Setup you must do
- Supabase > Authentication > Email Templates > Confirm signup: use `{{ .Token }}` in the body so the 6-digit code is emailed.
- Supabase email sending is rate-limited on the free tier; add custom SMTP before a real launch.
- Put the four photos in `public/photos/` (see the README there).
- Add team members and their Instagram / LinkedIn / GitHub in `lib/team.ts`.
- Host the scoring pipeline (see **Hosting the scoring pipeline** below); Vercel runs only the website.

## Login rules
Email + 6-digit OTP, unique username (3-20 letters, numbers, underscore), password of 8+ characters with a letter and a number.

## Security notes
- **Database:** row-level security on every table, plus least-privilege grants (anonymous users can only read sports and events; players cannot write scores, status, role or verified_scout). Scouts can only watch videos of players whose parent consent is on and whose submission is scored.
- **Browser:** Content-Security-Policy, X-Frame-Options, HSTS, nosniff, Referrer-Policy and Permissions-Policy are set in `next.config.mjs`.
- **Secrets:** only the publishable Supabase key is used in the website. `SUPABASE_SERVICE_KEY`, `ADMIN_TOKEN` and `CHECKER_TOKEN` live only in the Java/Python server environment, never in git or `NEXT_PUBLIC_` variables.
- **Java service:** set `CORS_ORIGINS` to your website URL; `ADMIN_TOKEN` must be 16+ characters. **Python checker:** set `CHECKER_TOKEN` to require an `X-Checker-Token` header on `/check`.
- **Vercel:** add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` and `NEXT_PUBLIC_SCORING_URL` under Project Settings, Environment Variables.
- **Supabase dashboard checklist:** Authentication > URL Configuration (add your Vercel URL), OTP expiry 10 minutes or less, enable leaked-password protection if your plan has it, add custom SMTP before launch.


## Contact your state sports body (score 70+)

A player with a scored video of 70 or more and parent/guardian consent can prepare an email to the sports body of their state.

- The website prepares the text. The player sends it from their own mail app (Gmail compose link, `mailto:` or copy), so it comes from their own address and does not fail SPF/DKIM like a spoofed sender would.
- The email carries a proof link `/verify/<token>`. The page shows only first name, district, state, sport, score and date, and only while the video is scored and consent is on. The player can switch the link off.
- `supabase/federation_contact.sql` creates `federations` (36 states and union territories), `outreach_log` and the RPCs `prepare_outreach`, `verify_score`, `revoke_share_link`. Eligibility, ownership and a limit of 5 prepared messages per day are enforced in the database.
- Every federation row has a source URL and a flag: `official` (a state sports department, authority, council or Olympic body) or `closest` (the nearest public contact, for example a school-sports office or a single-sport association). The page tells the player which one they are looking at. Addresses were collected from public pages and not tested by sending mail, so re-check them before relying on them.
- `/api/draft` asks Claude (set `ANTHROPIC_API_KEY` on the server) to phrase the email from the verified facts only. Output is checked (link present, score unchanged, no extra links or addresses); otherwise a plain template is used.


## Hosting the scoring pipeline

Uploads move `pending` -> `validated` (Python checker) -> `scored` (Java service). Both steps run every 5 minutes from a GitHub Actions schedule (`.github/workflows/pipeline.yml`), so only the Java service needs a host.

1. **Render:** New > Blueprint > pick this repo (it reads `render.yaml`). When asked, paste `SUPABASE_SERVICE_KEY` (Supabase > Project Settings > API > service_role). Render generates `ADMIN_TOKEN`; copy it from the service's Environment tab.
2. **GitHub:** repo > Settings > Secrets and variables > Actions > add `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ADMIN_TOKEN` (same as Render) and `SCORING_URL` (the `https://...onrender.com` address, no slash).
3. **Vercel:** set `NEXT_PUBLIC_SCORING_URL` to the same Render address and redeploy.
4. Run the workflow once by hand (Actions > Score pending uploads > Run workflow) and check it is green.

The free Render plan sleeps when idle; the 5-minute schedule keeps it mostly awake, and a cold start takes about a minute.
