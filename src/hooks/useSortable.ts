import i18n from "@/lib/i18n";
import * as React from "react";

export type SortDirection = "asc" | "desc" | "none";
type ActiveSortDirection = Exclude<SortDirection, "none">;
type NoSortBehavior = "reverse" | "preserve";

export interface UseSortableOptions<T> {
  defaultSort?: {
    key: keyof T;
    direction?: ActiveSortDirection;
  };
  noSortBehavior?: NoSortBehavior;
  tieBreaker?: {
    key: keyof T;
    direction?: ActiveSortDirection;
  };
}

// Helper functions to reduce Cognitive Complexity
const handleNullValues = (valueA: unknown, valueB: unknown, sortDirection: SortDirection) => {
  if (valueA === null || valueA === undefined) {
    return sortDirection === "asc" ? -1 : 1;
  }
  if (valueB === null || valueB === undefined) {
    return sortDirection === "asc" ? 1 : -1;
  }
  return null; // Not null values
};

const compareStrings = (valueA: string, valueB: string, sortDirection: SortDirection) => {
  return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
};

const compareOtherTypes = (valueA: unknown, valueB: unknown, sortDirection: SortDirection) => {
  // Type assertion for safe comparison
  const a = valueA as string | number;
  const b = valueB as string | number;

  if (a < b) {
    return sortDirection === "asc" ? -1 : 1;
  }
  if (a > b) {
    return sortDirection === "asc" ? 1 : -1;
  }
  return 0;
};

const compareValues = (valueA: unknown, valueB: unknown, sortDirection: SortDirection) => {
  const nullComparison = handleNullValues(valueA, valueB, sortDirection);
  if (nullComparison !== null) {
    return nullComparison;
  }

  if (typeof valueA === "string" && typeof valueB === "string") {
    return compareStrings(valueA, valueB, sortDirection);
  }

  return compareOtherTypes(valueA, valueB, sortDirection);
};

// Helper functions return string instead of JSX
const getSortIconType = (column: string, sortField: string | null, sortOrder: string) => {
  if (column !== sortField) return "none";
  if (sortOrder === "asc") return "asc";
  return "desc";
};

const getAriaLabel = (column: string, sortField: string | null, sortOrder: string) => {
  if (column !== sortField) return i18n.t("compUi.sortByColumn", { column });
  if (sortOrder === "asc") return i18n.t("compUi.sortByColumnDescending", { column });
  return i18n.t("compUi.sortByColumnAscending", { column });
};

/**
 * A hook to manage sortable data collections
 *
 * @example
 * const { sortedData, getSortProps } = useSortable(users);
 * return (
 *   <Table>
 *     <TableHeader>
 *       <TableHead {...getSortProps('name')}>Name</TableHead>
 *       <TableHead {...getSortProps('email')}>Email</TableHead>
 *     </TableHeader>
 *     <TableBody>
 *       {sortedData.map(user => (
 *         <TableRow key={user.id}>
 *           <TableCell>{user.name}</TableCell>
 *           <TableCell>{user.email}</TableCell>
 *         </TableRow>
 *       ))}
 *     </TableBody>
 *   </Table>
 * );
 */
export function useSortable<T>(initialData: T[], options?: UseSortableOptions<T>) {
  const [sortKey, setSortKey] = React.useState<keyof T | null>(() => {
    return options?.defaultSort?.key ?? null;
  });
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(() => {
    return options?.defaultSort?.direction ?? "none";
  });

  React.useEffect(() => {
    setSortKey(options?.defaultSort?.key ?? null);
    setSortDirection(options?.defaultSort?.direction ?? "none");
  }, [options?.defaultSort?.direction, options?.defaultSort?.key]);

  // Sort the data based on current sort configuration
  // Default: reverse order (newest first) when no sort is applied
  const sortedData = React.useMemo(() => {
    const noSortBehavior = options?.noSortBehavior ?? "reverse";

    if (sortDirection === "none" || !sortKey) {
      return noSortBehavior === "reverse" ? [...initialData].reverse() : [...initialData];
    }

    return [...initialData].sort((a, b) => {
      const primaryComparison = compareValues(a[sortKey], b[sortKey], sortDirection);
      if (primaryComparison !== 0) {
        return primaryComparison;
      }

      if (options?.tieBreaker?.key) {
        const tieBreakerDirection = options.tieBreaker.direction ?? "desc";
        return compareValues(
          a[options.tieBreaker.key],
          b[options.tieBreaker.key],
          tieBreakerDirection
        );
      }

      return 0;
    });
  }, [initialData, options, sortKey, sortDirection]);

  // Generate props for SortButton components
  const getSortProps = (key: keyof T) => ({
    direction: sortKey === key ? sortDirection : ("none" as SortDirection),
    onChange: (direction: SortDirection) => {
      setSortKey(direction === "none" ? null : key);
      setSortDirection(direction);
    },
  });

  // Handle sort toggle (simpler API for column headers)
  const toggleSort = (key: keyof T) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else if (sortDirection === "desc") {
      setSortKey(null);
      setSortDirection("none");
    } else {
      setSortDirection("asc");
    }
  };

  return {
    sortedData,
    sortKey,
    sortDirection,
    getSortProps,
    toggleSort,
    getSortIconType,
    getAriaLabel,
  };
}
