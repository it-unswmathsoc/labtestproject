// These must be referenced as static literals: Next inlines NEXT_PUBLIC_* vars into
// the browser bundle by textual substitution, so a dynamic process.env[name] lookup
// resolves to undefined client-side while still working on the server.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function SUPABASE_URL(): string {
  if (!URL) throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_URL");
  return URL;
}

export function SUPABASE_PUBLISHABLE_KEY(): string {
  if (!PUBLISHABLE_KEY) {
    throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  return PUBLISHABLE_KEY;
}
