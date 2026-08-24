import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./env";

/** Auth-aware server client. Callers become dynamic — never use it on ISR pages. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL(), SUPABASE_PUBLISHABLE_KEY(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
