import { parseRichText } from "@/lib/math";
import { Latex } from "./Latex";

export function RichText({ children }: { children: string }) {
  const segments = parseRichText(children);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.value}</span>;
        }
        return (
          <Latex key={i} display={seg.type === "displayMath"}>
            {seg.value}
          </Latex>
        );
      })}
    </>
  );
}
