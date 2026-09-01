import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export default async function proxy(request: NextRequest) {
  // Built from cloned request headers so refreshed cookies reach Server Components
  // in this same request, not just the browser on the next one.
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: request.headers } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser() validates against the Auth server, so a deleted or revoked user is
  // rejected rather than passing on a still-unexpired token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!request.nextUrl.pathname.startsWith("/admin")) return response;

  if (!user) return redirectToLogin(request);

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return admin ? response : redirectToLogin(request, "not-an-admin");
}

function redirectToLogin(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (reason) url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
