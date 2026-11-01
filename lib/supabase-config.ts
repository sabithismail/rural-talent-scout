// The project this app belongs to. Both values are public by design (the key is a publishable key,
// protected by row-level security) and are already in .env.example.
const OWN_REF = "iehvnrrfdjrpxgrvwfon";
const DEFAULT_URL = `https://${OWN_REF}.supabase.co`;
const DEFAULT_KEY = "sb_publishable_z0YtyNGP1v8C95j2LqiKLQ_c2CbxG-7";

// Each env name must stay a literal so Next can inline it into the browser bundle.
const envUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const envKey = (
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
).trim();

// Only trust the environment when it points at our own project. A different project (for example one
// created by a hosting integration) has none of our tables, so we ignore it and use the defaults.
const useEnv = envUrl.startsWith(`https://${OWN_REF}.`) && envKey.length > 20;

export const SUPABASE_URL = useEnv ? envUrl : DEFAULT_URL;
export const SUPABASE_KEY = useEnv ? envKey : DEFAULT_KEY;
