import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin writes go browser -> Supabase directly, so Next never learns content
 * changed. This closes the loop. Admin-gated: an open endpoint here would be a
 * cache-buster for anyone.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { paths } = (await request.json()) as { paths?: unknown };
  if (!Array.isArray(paths) || paths.some((p) => typeof p !== "string")) {
    return NextResponse.json({ error: "paths must be string[]" }, { status: 400 });
  }

  for (const path of paths as string[]) revalidatePath(path);

  return NextResponse.json({ revalidated: true, paths });
}
