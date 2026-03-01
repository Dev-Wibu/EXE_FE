import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function StatusBadge({ label, variant = "default", className }: StatusBadgeProps) {
  return (
    <Badge variant={variant} className={cn(className)}>
      {label}
    </Badge>
  );
}
