import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  // Do not throw here: that would also break `next build` on a host with no env vars yet.
  console.error(
    "Supabase settings are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY " +
      "to .env.local (local) or to the host's Environment Variables (Vercel), then restart/redeploy. See .env.example."
  );
}

export const supabase = createClient(url || "https://missing-env.invalid", key || "missing-env");
