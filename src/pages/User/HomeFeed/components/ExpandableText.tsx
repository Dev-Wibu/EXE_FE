import { useState } from "react";

import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  /** CSS class to clamp (e.g. "line-clamp-3"). Applied when collapsed. */
  clampClass?: string;
  className?: string;
}

/**
 * Renders text with a Facebook-style "Xem thêm" / "Thu gọn" toggle.
 * When collapsed the text is clamped to the given number of lines.
 */
export function ExpandableText({
  text,
  clampClass = "line-clamp-3",
  className,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={className}>
      <p className={cn("whitespace-pre-wrap", !expanded && clampClass)}>{text}</p>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-0.5 text-sm font-medium text-[#0047AB] hover:underline dark:text-[#66B2FF]">
        {expanded ? "Thu gọn" : "Xem thêm"}
      </button>
    </div>
  );
}
