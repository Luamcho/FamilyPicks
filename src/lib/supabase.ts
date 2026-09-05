import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Para llamadas directas por fetch (p. ej. a edge functions) fuera del SDK. */
export const supabaseUrl = url;
export const supabaseAnonKey = anonKey;

/** True once a real Supabase project is wired via env vars. Until then the app
 *  runs in demo mode with the sample data in `mock.ts`. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
