import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./env";

/**
 * Cookie-less anon client for public content reads.
 *
 * Deliberately not the SSR cookie client: the browse pages set
 * `export const revalidate = 3600`, and reading cookies would opt them out of
 * static rendering and silently disable ISR. RLS restricts this client to
 * published content.
 */
export const publicClient = createClient<Database>(
  SUPABASE_URL(),
  SUPABASE_PUBLISHABLE_KEY(),
  { auth: { persistSession: false, autoRefreshToken: false } }
);
