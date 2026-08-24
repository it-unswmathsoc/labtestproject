export function PageHeader({
  title,
  subtitle,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {/* div, not p: rendered display math is a block element and would be
          reparented out of a <p>, breaking hydration. */}
      {subtitle ? <div className="mt-1 text-gray-500">{subtitle}</div> : null}
    </div>
  );
}
