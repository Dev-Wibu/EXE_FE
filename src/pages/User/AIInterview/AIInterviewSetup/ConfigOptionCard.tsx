import { CheckCircle2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { InterviewConfigOptionItem } from "@/interfaces/schema.types";

import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type ConfigCategoryKey,
} from "./constants";

export function ConfigOptionCard({
  item,
  isSelected,
  onSelect,
  categoryKey,
}: {
  item: InterviewConfigOptionItem;
  isSelected: boolean;
  onSelect: () => void;
  categoryKey: ConfigCategoryKey;
}) {
  const colors = CATEGORY_COLORS[categoryKey];
  return (
    <button
      onClick={onSelect}
      className={`relative flex w-full flex-col gap-1.5 rounded-lg border-2 p-4 text-left transition-all ${
        isSelected
          ? `${colors.bg} ${colors.border} shadow-sm`
          : "border-border bg-card hover:border-border/80 hover:bg-accent/50"
      }`}>
      {isSelected && (
        <CheckCircle2
          className={`absolute top-3 right-3 h-5 w-5 ${colors.text}`}
          fill="currentColor"
          strokeWidth={0}
        />
      )}
      <span className={`text-sm font-semibold ${isSelected ? colors.text : "text-foreground"}`}>
        {item.label}
      </span>
      <span className="text-muted-foreground pr-6 text-xs leading-relaxed">{item.description}</span>
    </button>
  );
}

export function ConfigSection({
  categoryKey,
  items,
  selectedKey,
  onSelect,
}: {
  categoryKey: ConfigCategoryKey;
  items: InterviewConfigOptionItem[];
  selectedKey: string | null;
  onSelect: (_key: string) => void;
}) {
  const colors = CATEGORY_COLORS[categoryKey];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg} ${colors.icon}`}>
          {CATEGORY_ICONS[categoryKey]}
        </div>
        <h4 className="text-foreground text-sm font-semibold">{CATEGORY_LABELS[categoryKey]}</h4>
      </div>
      <div
        className={`grid gap-3 ${
          items.length <= 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}>
        {items.map((item) => (
          <ConfigOptionCard
            key={item.key}
            item={item}
            isSelected={selectedKey === item.key}
            onSelect={() => onSelect(item.key)}
            categoryKey={categoryKey}
          />
        ))}
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
