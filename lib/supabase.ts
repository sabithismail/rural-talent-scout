import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  // Fail with a clear message instead of "supabaseUrl is required".
  throw new Error(
    "Supabase settings are missing. Create a file named .env.local in the project root (next to package.json) " +
      "with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY, then restart npm run dev. See .env.example."
  );
}

export const supabase = createClient(url, key);
