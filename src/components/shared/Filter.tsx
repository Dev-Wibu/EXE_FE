"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Filter as FilterIcon, X } from "lucide-react";
import * as React from "react";

// ==================== Interfaces ====================

export interface FilterOption {
  value: string;
  label: string;
  type: "select" | "dateRange" | "numberRange";
  selectOptions?: { value: string; label: string }[];
  placeholder?: string;
  numberRangeConfig?: {
    fromPlaceholder?: string;
    toPlaceholder?: string;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
  };
}

export interface FilterCriteria {
  field: string;
  value:
    | string
    | { from: Date | undefined; to: Date | undefined }
    | { from: number | undefined; to: number | undefined };
  label: string;
  type: "select" | "dateRange" | "numberRange";
}

export interface FilterGroup {
  name: string;
  label: string;
  options: FilterOption[];
}

export interface FilterProps {
  filterOptions: FilterOption[] | FilterGroup[];
  onFilterChange: (criteria: FilterCriteria[]) => void;
  className?: string;
  showActiveFilters?: boolean;
  groupMode?: boolean;
}

// ==================== Helper Components ====================

interface SelectFilterProps {
  option: FilterOption;
  value: string;
  onValueChange: (value: string) => void;
}

const SelectFilter = ({ option, value, onValueChange }: SelectFilterProps) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">{option.label}</label>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={option.placeholder || "Chọn..."} />
      </SelectTrigger>
      <SelectContent>
        {option.selectOptions?.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

interface DateRangeFilterProps {
  option: FilterOption;
  value: { from: Date | undefined; to: Date | undefined };
  onValueChange: (value: { from: Date | undefined; to: Date | undefined }) => void;
}

const DateRangeFilter = ({ option, value, onValueChange }: DateRangeFilterProps) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">{option.label}</label>
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value.from && "text-muted-foreground"
            )}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.from ? format(value.from, "dd/MM/yyyy", { locale: vi }) : "Từ ngày"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value.from}
            onSelect={(date) => onValueChange({ ...value, from: date })}
            locale={vi}
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value.to && "text-muted-foreground"
            )}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.to ? format(value.to, "dd/MM/yyyy", { locale: vi }) : "Đến ngày"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value.to}
            onSelect={(date) => onValueChange({ ...value, to: date })}
            locale={vi}
          />
        </PopoverContent>
      </Popover>
    </div>
  </div>
);

interface NumberRangeFilterProps {
  option: FilterOption;
  value: { from: number | undefined; to: number | undefined };
  onValueChange: (value: { from: number | undefined; to: number | undefined }) => void;
}

const NumberRangeFilter = ({ option, value, onValueChange }: NumberRangeFilterProps) => {
  const config = option.numberRangeConfig || {};

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{option.label}</label>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder={config.fromPlaceholder || "Từ"}
          min={config.min}
          max={config.max}
          step={config.step}
          value={value.from ?? ""}
          onChange={(e) =>
            onValueChange({ ...value, from: e.target.value ? Number(e.target.value) : undefined })
          }
        />
        <Input
          type="number"
          placeholder={config.toPlaceholder || "Đến"}
          min={config.min}
          max={config.max}
          step={config.step}
          value={value.to ?? ""}
          onChange={(e) =>
            onValueChange({ ...value, to: e.target.value ? Number(e.target.value) : undefined })
          }
        />
        {config.suffix && (
          <span className="text-muted-foreground flex items-center text-sm">{config.suffix}</span>
        )}
      </div>
    </div>
  );
};

// ==================== Active Filter Badge ====================

interface ActiveFilterBadgeProps {
  filter: FilterCriteria;
  onRemove: () => void;
}

const ActiveFilterBadge = ({ filter, onRemove }: ActiveFilterBadgeProps) => {
  const getDisplayValue = () => {
    if (filter.type === "select") {
      return String(filter.value);
    }
    if (filter.type === "dateRange") {
      const dateValue = filter.value as { from: Date | undefined; to: Date | undefined };
      const fromStr = dateValue.from ? format(dateValue.from, "dd/MM/yyyy") : "";
      const toStr = dateValue.to ? format(dateValue.to, "dd/MM/yyyy") : "";
      return `${fromStr} - ${toStr}`;
    }
    if (filter.type === "numberRange") {
      const numValue = filter.value as { from: number | undefined; to: number | undefined };
      return `${numValue.from ?? ""} - ${numValue.to ?? ""}`;
    }
    return "";
  };

  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {filter.label}: {getDisplayValue()}
      <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={onRemove}>
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
};

// ==================== Main Filter Component ====================

type FilterValues = Record<
  string,
  | string
  | { from: Date | undefined; to: Date | undefined }
  | { from: number | undefined; to: number | undefined }
>;

function isFilterGroup(options: FilterOption[] | FilterGroup[]): options is FilterGroup[] {
  return options.length > 0 && "options" in options[0];
}

export function Filter({
  filterOptions,
  onFilterChange,
  className,
  showActiveFilters = true,
  groupMode = false,
}: FilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempValues, setTempValues] = React.useState<FilterValues>({});
  const [activeFilters, setActiveFilters] = React.useState<FilterCriteria[]>([]);

  // Get all options (flat list)
  const getAllOptions = (): FilterOption[] => {
    if (isFilterGroup(filterOptions)) {
      return filterOptions.flatMap((group) => group.options);
    }
    return filterOptions;
  };

  // Initialize temp values from active filters
  React.useEffect(() => {
    const values: FilterValues = {};
    activeFilters.forEach((filter) => {
      values[filter.field] = filter.value;
    });
    setTempValues(values);
  }, [activeFilters]);

  // Handle value change for a specific filter
  const handleValueChange = (
    field: string,
    value:
      | string
      | { from: Date | undefined; to: Date | undefined }
      | { from: number | undefined; to: number | undefined }
  ) => {
    setTempValues((prev) => ({ ...prev, [field]: value }));
  };

  // Apply filters
  const handleApply = () => {
    const options = getAllOptions();
    const newFilters: FilterCriteria[] = [];

    Object.entries(tempValues).forEach(([field, value]) => {
      const option = options.find((opt) => opt.value === field);
      if (!option) return;

      // Check if value is not empty
      const isEmpty =
        value === "" ||
        value === undefined ||
        (typeof value === "object" && "from" in value && !value.from && !value.to);

      if (!isEmpty) {
        newFilters.push({
          field,
          value,
          label: option.label,
          type: option.type,
        });
      }
    });

    setActiveFilters(newFilters);
    onFilterChange(newFilters);
    setIsOpen(false);
  };

  // Clear all filters
  const handleClearAll = () => {
    setTempValues({});
    setActiveFilters([]);
    onFilterChange([]);
  };

  // Remove a single filter
  const handleRemoveFilter = (field: string) => {
    const newFilters = activeFilters.filter((f) => f.field !== field);
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
    setTempValues((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  // Render filter input based on type
  const renderFilterInput = (option: FilterOption) => {
    const value = tempValues[option.value];

    switch (option.type) {
      case "select":
        return (
          <SelectFilter
            key={option.value}
            option={option}
            value={(value as string) || ""}
            onValueChange={(v) => handleValueChange(option.value, v)}
          />
        );
      case "dateRange":
        return (
          <DateRangeFilter
            key={option.value}
            option={option}
            value={
              (value as { from: Date | undefined; to: Date | undefined }) || {
                from: undefined,
                to: undefined,
              }
            }
            onValueChange={(v) => handleValueChange(option.value, v)}
          />
        );
      case "numberRange":
        return (
          <NumberRangeFilter
            key={option.value}
            option={option}
            value={
              (value as { from: number | undefined; to: number | undefined }) || {
                from: undefined,
                to: undefined,
              }
            }
            onValueChange={(v) => handleValueChange(option.value, v)}
          />
        );
      default:
        return null;
    }
  };

  // Render filter content
  const renderFilterContent = () => {
    if (groupMode && isFilterGroup(filterOptions)) {
      return (
        <Tabs defaultValue={filterOptions[0]?.name} className="w-full">
          <TabsList className="w-full">
            {filterOptions.map((group) => (
              <TabsTrigger key={group.name} value={group.name} className="flex-1">
                {group.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {filterOptions.map((group) => (
            <TabsContent key={group.name} value={group.name} className="space-y-4">
              {group.options.map(renderFilterInput)}
            </TabsContent>
          ))}
        </Tabs>
      );
    }

    const options = getAllOptions();
    return <div className="space-y-4">{options.map(renderFilterInput)}</div>;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FilterIcon className="h-4 w-4" />
              Bộ lọc
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">Bộ lọc</h4>
              {renderFilterContent()}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleApply}>
                  Áp dụng
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFilters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            Xóa tất cả
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {showActiveFilters && activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <ActiveFilterBadge
              key={filter.field}
              filter={filter}
              onRemove={() => handleRemoveFilter(filter.field)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
