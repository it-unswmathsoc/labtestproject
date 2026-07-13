import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <p className="text-gray-800">We couldn&apos;t find that page.</p>
      <Link href="/" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
        Back to courses
      </Link>
    </div>
  );
}
