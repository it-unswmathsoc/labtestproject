import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./env";

/** Browser client for the admin UI. createBrowserClient is already a singleton. */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL(), SUPABASE_PUBLISHABLE_KEY());
}
