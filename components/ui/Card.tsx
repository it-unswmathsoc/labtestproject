import Link from "next/link";

export function Card({
  href,
  title,
  subtitle,
  children,
}: {
  href?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const inner = (
    <div className="h-full rounded-xl border border-gray-200 p-5 transition hover:border-gray-400 hover:shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      {children ? <div className="mt-3 text-sm text-gray-700">{children}</div> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
