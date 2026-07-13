import Link from "next/link";
import { AdminStoreProvider } from "@/components/admin/AdminStoreProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminStoreProvider>
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-3">
        <Link href="/admin" className="font-semibold text-gray-900">
          Admin · Lab Tests
        </Link>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          View site →
        </Link>
      </div>
      {children}
    </AdminStoreProvider>
  );
}
