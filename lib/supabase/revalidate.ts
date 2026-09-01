/**
 * Admin writes go browser -> Supabase directly, so Next never learns content
 * changed. Failures are logged and swallowed: the write already succeeded, and a
 * stale cache must not surface as a write error.
 */
export async function revalidatePaths(paths: string[]) {
  if (paths.length === 0) return;

  try {
    const response = await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    });
    if (!response.ok) {
      console.error(`revalidate failed: ${response.status}`);
    }
  } catch (error) {
    console.error("revalidate failed", error);
  }
}
