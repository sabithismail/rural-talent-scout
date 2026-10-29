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
- Host the Java and Python services separately (each has a Dockerfile); Vercel runs only the website.

## Login rules
Email + 6-digit OTP, unique username (3-20 letters, numbers, underscore), password of 8+ characters with a letter and a number.

## Security notes
- **Database:** row-level security on every table, plus least-privilege grants (anonymous users can only read sports and events; players cannot write scores, status, role or verified_scout). Scouts can only watch videos of players whose parent consent is on and whose submission is scored.
- **Browser:** Content-Security-Policy, X-Frame-Options, HSTS, nosniff, Referrer-Policy and Permissions-Policy are set in `next.config.mjs`.
- **Secrets:** only the publishable Supabase key is used in the website. `SUPABASE_SERVICE_KEY`, `ADMIN_TOKEN` and `CHECKER_TOKEN` live only in the Java/Python server environment, never in git or `NEXT_PUBLIC_` variables.
- **Java service:** set `CORS_ORIGINS` to your website URL; `ADMIN_TOKEN` must be 16+ characters. **Python checker:** set `CHECKER_TOKEN` to require an `X-Checker-Token` header on `/check`.
- **Vercel:** add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` and `NEXT_PUBLIC_SCORING_URL` under Project Settings, Environment Variables.
- **Supabase dashboard checklist:** Authentication > URL Configuration (add your Vercel URL), OTP expiry 10 minutes or less, enable leaked-password protection if your plan has it, add custom SMTP before launch.
