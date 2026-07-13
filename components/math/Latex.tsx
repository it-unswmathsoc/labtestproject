import { renderLatex } from "@/lib/math";

export function Latex({
  children,
  display = false,
}: {
  children: string;
  display?: boolean;
}) {
  const { html } = renderLatex(children, display);
  if (display) {
    return (
      <div
        className="my-2 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
