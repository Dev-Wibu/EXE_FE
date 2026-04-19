import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export interface PaginationConfig {
  initialPage?: number;
  totalCount: number;
  pageSize: number;
  maxVisiblePages?: number;
  onPageChange?: (page: number) => void;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  visiblePages: (number | "ellipsis")[];
}

export interface PaginationActions {
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  reset: () => void;
}

export interface UsePaginationReturn extends PaginationState, PaginationActions {}

export interface HybridPageSizeConfig {
  key: string;
  defaultPageSize: number;
  allowedPageSizes?: number[];
}

const PAGE_SIZE_STORAGE_KEY_PREFIX = "pagination_page_size_";
const PAGE_SIZE_QUERY_PARAM_PREFIX = "ps_";
const DEFAULT_PAGE_SIZE = 10;

const sanitizePersistenceKey = (rawKey: string): string => {
  const sanitized = rawKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || "default";
};

const parsePositiveInteger = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const normalizeAllowedPageSizes = (allowedPageSizes?: number[]): number[] | null => {
  if (!allowedPageSizes || allowedPageSizes.length === 0) {
    return null;
  }

  const uniquePositiveNumbers = Array.from(
    new Set(allowedPageSizes.filter((size) => Number.isInteger(size) && size > 0))
  );

  return uniquePositiveNumbers.length > 0 ? uniquePositiveNumbers : null;
};

export const createPaginationListKey = (...segments: Array<string | number>): string => {
  const combined = segments.map(String).join("_");
  return sanitizePersistenceKey(combined);
};

export const usePagination = ({
  initialPage = 1,
  totalCount,
  pageSize,
  maxVisiblePages = 5,
  onPageChange,
}: PaginationConfig): UsePaginationReturn => {
  // Validate inputs
  if (totalCount < 0) throw new Error("totalCount must be non-negative");
  if (pageSize <= 0) throw new Error("pageSize must be positive");
  if (maxVisiblePages < 3) throw new Error("maxVisiblePages must be at least 3");

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Normalize initial page
  const normalizedInitialPage = Math.max(1, Math.min(initialPage, totalPages));

  // State management
  const [currentPage, setCurrentPage] = useState(normalizedInitialPage);

  // Memoized calculations
  const paginationState = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalCount - 1);

    return {
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [currentPage, pageSize, totalCount, totalPages]);

  // Generate visible pages with ellipsis
  const visiblePages = useMemo((): (number | "ellipsis")[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [];
    const halfVisible = Math.floor((maxVisiblePages - 3) / 2); // Reserve space for first, last, and ellipsis

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    let startPage = Math.max(2, currentPage - halfVisible);
    let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

    // Adjust range if too close to boundaries
    if (startPage === 2 && endPage < totalPages - 1) {
      endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);
    }
    if (endPage === totalPages - 1 && startPage > 2) {
      startPage = Math.max(2, endPage - maxVisiblePages + 3);
    }

    // Add left ellipsis
    if (startPage > 2) {
      pages.push("ellipsis");
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add right ellipsis
    if (endPage < totalPages - 1) {
      pages.push("ellipsis");
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  // Actions
  const setPage = useCallback(
    (page: number) => {
      const newPage = Math.max(1, Math.min(page, totalPages));
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
        onPageChange?.(newPage);
      }
    },
    [currentPage, totalPages, onPageChange]
  );

  const nextPage = useCallback(() => {
    if (paginationState.hasNextPage) {
      setPage(currentPage + 1);
    }
  }, [currentPage, paginationState.hasNextPage, setPage]);

  const prevPage = useCallback(() => {
    if (paginationState.hasPrevPage) {
      setPage(currentPage - 1);
    }
  }, [currentPage, paginationState.hasPrevPage, setPage]);

  const goToFirstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const goToLastPage = useCallback(() => {
    setPage(totalPages);
  }, [setPage, totalPages]);

  const reset = useCallback(() => {
    setPage(normalizedInitialPage);
  }, [setPage, normalizedInitialPage]);

  return {
    // State
    currentPage,
    totalPages,
    pageSize,
    totalCount,
    startIndex: paginationState.startIndex,
    endIndex: paginationState.endIndex,
    hasNextPage: paginationState.hasNextPage,
    hasPrevPage: paginationState.hasPrevPage,
    visiblePages,

    // Actions
    setPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    reset,
  };
};

export const useHybridPageSize = ({
  key,
  defaultPageSize,
  allowedPageSizes,
}: HybridPageSizeConfig) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const listKey = useMemo(() => sanitizePersistenceKey(key), [key]);
  const pageSizeQueryParam = useMemo(() => `${PAGE_SIZE_QUERY_PARAM_PREFIX}${listKey}`, [listKey]);
  const pageSizeStorageKey = useMemo(() => `${PAGE_SIZE_STORAGE_KEY_PREFIX}${listKey}`, [listKey]);

  const normalizedAllowedPageSizes = useMemo(
    () => normalizeAllowedPageSizes(allowedPageSizes),
    [allowedPageSizes]
  );

  const normalizedDefaultPageSize = useMemo(() => {
    if (
      Number.isInteger(defaultPageSize) &&
      defaultPageSize > 0 &&
      (!normalizedAllowedPageSizes || normalizedAllowedPageSizes.includes(defaultPageSize))
    ) {
      return defaultPageSize;
    }

    return normalizedAllowedPageSizes?.[0] ?? DEFAULT_PAGE_SIZE;
  }, [defaultPageSize, normalizedAllowedPageSizes]);

  const isAllowedPageSize = useCallback(
    (value: number): boolean => {
      if (!Number.isInteger(value) || value <= 0) {
        return false;
      }

      return !normalizedAllowedPageSizes || normalizedAllowedPageSizes.includes(value);
    },
    [normalizedAllowedPageSizes]
  );

  const readPageSizeFromUrl = useCallback(
    (params: URLSearchParams): number | null => {
      const parsed = parsePositiveInteger(params.get(pageSizeQueryParam));
      if (parsed === null || !isAllowedPageSize(parsed)) {
        return null;
      }

      return parsed;
    },
    [isAllowedPageSize, pageSizeQueryParam]
  );

  const readPageSizeFromStorage = useCallback((): number | null => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const parsed = parsePositiveInteger(window.localStorage.getItem(pageSizeStorageKey));
      if (parsed === null || !isAllowedPageSize(parsed)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }, [isAllowedPageSize, pageSizeStorageKey]);

  const pageSizeFromUrl = readPageSizeFromUrl(searchParams);
  const pageSizeFromStorage = readPageSizeFromStorage();
  const pageSize = pageSizeFromUrl ?? pageSizeFromStorage ?? normalizedDefaultPageSize;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(pageSizeStorageKey, String(pageSize));
    } catch {
      // Ignore storage write failures (private mode/quota exceeded)
    }
  }, [pageSize, pageSizeStorageKey]);

  useEffect(() => {
    const expectedUrlValue = pageSize === normalizedDefaultPageSize ? null : String(pageSize);
    const currentUrlValue = searchParams.get(pageSizeQueryParam);

    if (currentUrlValue === expectedUrlValue) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    if (expectedUrlValue === null) {
      nextSearchParams.delete(pageSizeQueryParam);
    } else {
      nextSearchParams.set(pageSizeQueryParam, expectedUrlValue);
    }

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [normalizedDefaultPageSize, pageSize, pageSizeQueryParam, searchParams, setSearchParams]);

  const setHybridPageSize = useCallback(
    (nextPageSize: number) => {
      if (!isAllowedPageSize(nextPageSize)) {
        return;
      }

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(pageSizeStorageKey, String(nextPageSize));
        } catch {
          // Ignore storage write failures (private mode/quota exceeded)
        }
      }

      const expectedUrlValue =
        nextPageSize === normalizedDefaultPageSize ? null : String(nextPageSize);
      const currentUrlValue = searchParams.get(pageSizeQueryParam);
      if (currentUrlValue === expectedUrlValue) {
        return;
      }

      const nextSearchParams = new URLSearchParams(searchParams);
      if (expectedUrlValue === null) {
        nextSearchParams.delete(pageSizeQueryParam);
      } else {
        nextSearchParams.set(pageSizeQueryParam, expectedUrlValue);
      }

      if (nextSearchParams.toString() !== searchParams.toString()) {
        setSearchParams(nextSearchParams, { replace: true });
      }
    },
    [
      isAllowedPageSize,
      normalizedDefaultPageSize,
      pageSizeQueryParam,
      pageSizeStorageKey,
      searchParams,
      setSearchParams,
    ]
  );

  return [pageSize, setHybridPageSize] as const;
};

// Utility function for generating page info text
export const getPageInfo = (state: PaginationState): string => {
  if (state.totalCount === 0) return "No items";
  const start = state.startIndex + 1;
  const end = state.endIndex + 1;
  return `${start}-${end} / ${state.totalCount}`;
};

/**
 * Helper hook for URL-based pagination
 * Syncs pagination state with URL search params
 */
export const useUrlPagination = (
  config: Omit<PaginationConfig, "initialPage" | "onPageChange">,
  pageParam = "page"
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get(pageParam) || "1", 10);

  const onPageChange = useCallback(
    (page: number) => {
      const newParams = new URLSearchParams(searchParams);
      if (page === 1) {
        newParams.delete(pageParam);
      } else {
        newParams.set(pageParam, page.toString());
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams, pageParam]
  );

  return usePagination({
    ...config,
    initialPage,
    onPageChange,
  });
};
