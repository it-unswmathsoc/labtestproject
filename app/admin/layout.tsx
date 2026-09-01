import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminStoreProvider } from "@/components/admin/AdminStoreProvider";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { createClient } from "@/lib/supabase/server";

// RLS is the real boundary; this just means admins see a login screen instead of
// silent write failures.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/login?error=not-an-admin");

  return (
    <AdminStoreProvider>
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-3">
        <Link href="/admin" className="font-semibold text-gray-900">
          Admin · Lab Tests
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <SignOutButton />
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            View site →
          </Link>
        </div>
      </div>
      {children}
    </AdminStoreProvider>
  );
}
