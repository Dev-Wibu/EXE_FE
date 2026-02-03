"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";

export type SortDirection = "asc" | "desc" | "none";

interface SortButtonProps extends Omit<React.ComponentProps<typeof Button>, "onChange"> {
  onChange?: (direction: SortDirection) => void;
  direction?: SortDirection;
  children?: React.ReactNode;
}

const CustomSortIcon = ({ direction }: { direction?: SortDirection }) => {
  const opacityUp = direction === "desc" ? 0.3 : 1;
  const opacityDown = direction === "asc" ? 0.3 : 1;

  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
      <path d="M5 6 L8 2 L11 6 Z" opacity={opacityUp} />
      <path d="M5 10 L8 14 L11 10 Z" opacity={opacityDown} />
    </svg>
  );
};

const getNextDirection = (current: SortDirection): SortDirection => {
  if (current === "none") return "asc";
  if (current === "asc") return "desc";
  return "none";
};

export function SortButton({
  onChange,
  direction = "none",
  children,
  className,
  ...props
}: SortButtonProps) {
  const handleClick = () => {
    const newDirection = getNextDirection(direction);
    onChange?.(newDirection);
  };

  return (
    <div className="flex items-center gap-1">
      <span className="whitespace-nowrap">{children}</span>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-6 w-6 p-0", className)}
        onClick={handleClick}
        {...props}>
        <CustomSortIcon direction={direction} />
      </Button>
    </div>
  );
}
