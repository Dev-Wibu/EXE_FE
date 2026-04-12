import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search, X } from "lucide-react";

interface MentorFiltersProps {
  searchQuery: string;
  onSearchChange: (_value: string) => void;
  selectedExpertise: string;
  expertiseOptions: string[];
  onSelectExpertise: (_value: string) => void;
  onReset: () => void;
  matchedCount: number;
}

export function MentorFilters({
  searchQuery,
  onSearchChange,
  selectedExpertise,
  expertiseOptions,
  onSelectExpertise,
  onReset,
  matchedCount,
}: MentorFiltersProps) {
  const hasActiveFilters = searchQuery.trim().length > 0 || selectedExpertise !== "all";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/85">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm theo tên, kỹ năng hoặc công ty..."
              className="h-11 border-slate-200 bg-white pr-10 pl-11 text-sm focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="h-9 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {matchedCount} kết quả
            </Badge>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                onClick={onReset}>
                Đặt lại
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={selectedExpertise === "all" ? "default" : "outline"}
            className={
              selectedExpertise === "all"
                ? "h-9 rounded-full bg-blue-600 px-4 hover:bg-blue-700"
                : "h-9 rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            }
            onClick={() => onSelectExpertise("all")}>
            <Filter className="mr-1 h-3.5 w-3.5" />
            Tất cả
          </Button>

          {expertiseOptions.map((expertise) => (
            <Button
              key={expertise}
              type="button"
              size="sm"
              variant={selectedExpertise === expertise ? "default" : "outline"}
              className={
                selectedExpertise === expertise
                  ? "h-9 rounded-full bg-indigo-600 px-4 hover:bg-indigo-700"
                  : "h-9 rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              }
              onClick={() => onSelectExpertise(expertise)}>
              {expertise}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
