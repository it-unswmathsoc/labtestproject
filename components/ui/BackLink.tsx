import Link from "next/link";

/**
 * Navigates up the content hierarchy rather than through browser history, so
 * the destination is nameable and a page reached by a direct link still leads
 * somewhere sensible.
 */
export function BackLink({
  href,
  children,
}: {
  href: string;
  /** The destination, named — "All courses", not "Back". */
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <Link href={href} className="text-sm text-blue-600 hover:underline">
        {/* Decorative: the link's accessible name is the destination itself. */}
        <span aria-hidden="true">← </span>
        {children}
      </Link>
    </div>
  );
}
