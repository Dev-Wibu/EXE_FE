import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mutable backing store; mock returns a fresh copy on each call so React sees a new reference
let searchParamsStore = new URLSearchParams();
const mockSetSearchParams = vi.fn((next: URLSearchParams) => {
  searchParamsStore = new URLSearchParams(next);
});

vi.mock("react-router-dom", () => ({
  useSearchParams: vi.fn(() => [new URLSearchParams(searchParamsStore), mockSetSearchParams]),
}));

import {
  createPaginationListKey,
  getPageInfo,
  useHybridPageSize,
  usePagination,
  useUrlPagination,
} from "./usePagination";

describe("usePagination", () => {
  beforeEach(() => {
    searchParamsStore = new URLSearchParams();
    mockSetSearchParams.mockClear();
  });

  describe("basic state", () => {
    it("calculates total pages correctly", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 25, pageSize: 10 }));

      expect(result.current.totalPages).toBe(3);
    });

    it("starts on page 1 by default", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 50, pageSize: 10 }));

      expect(result.current.currentPage).toBe(1);
    });

    it("starts on specified initialPage", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 50, pageSize: 10, initialPage: 3 })
      );

      expect(result.current.currentPage).toBe(3);
    });

    it("normalizes initialPage to valid range", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 20, pageSize: 10, initialPage: 99 })
      );

      expect(result.current.currentPage).toBe(2); // clamped to totalPages
    });

    it("uses at least 1 for totalPages when totalCount is 0", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 0, pageSize: 10 }));

      expect(result.current.totalPages).toBe(1);
    });
  });

  describe("index calculations", () => {
    it("calculates startIndex and endIndex", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 25, pageSize: 10 }));

      // Page 1: items 0–9
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(9);
    });

    it("calculates indices for last partial page", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 25, pageSize: 10, initialPage: 3 })
      );

      // Page 3: items 20–24
      expect(result.current.startIndex).toBe(20);
      expect(result.current.endIndex).toBe(24);
    });
  });

  describe("hasNextPage / hasPrevPage", () => {
    it("hasNextPage is false on last page", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 10, pageSize: 10 }));

      expect(result.current.hasNextPage).toBe(false);
    });

    it("hasPrevPage is false on first page", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 20, pageSize: 10 }));

      expect(result.current.hasPrevPage).toBe(false);
    });

    it("hasNextPage is true when not on last page", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 30, pageSize: 10 }));

      expect(result.current.hasNextPage).toBe(true);
    });

    it("hasPrevPage is true when not on first page", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 30, pageSize: 10, initialPage: 2 })
      );

      expect(result.current.hasPrevPage).toBe(true);
    });
  });

  describe("setPage", () => {
    it("navigates to specified page", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 50, pageSize: 10 }));

      act(() => result.current.setPage(3));
      expect(result.current.currentPage).toBe(3);
    });

    it("clamps page to valid range (too high)", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 20, pageSize: 10 }));

      act(() => result.current.setPage(99));
      expect(result.current.currentPage).toBe(2);
    });

    it("clamps page to valid range (too low)", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 20, pageSize: 10, initialPage: 2 })
      );

      act(() => result.current.setPage(0));
      expect(result.current.currentPage).toBe(1);
    });

    it("calls onPageChange callback via nextPage", () => {
      const onPageChange = vi.fn();
      const { result } = renderHook(() =>
        usePagination({ totalCount: 30, pageSize: 10, onPageChange })
      );

      act(() => result.current.nextPage());
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("calls onPageChange callback via prevPage", () => {
      const onPageChange = vi.fn();
      const { result } = renderHook(() =>
        usePagination({ totalCount: 30, pageSize: 10, initialPage: 2, onPageChange })
      );

      act(() => result.current.prevPage());
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it("calls onPageChange callback via goToLastPage", () => {
      const onPageChange = vi.fn();
      const { result } = renderHook(() =>
        usePagination({ totalCount: 30, pageSize: 10, onPageChange })
      );

      act(() => result.current.goToLastPage());
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("does not call onPageChange via nextPage when on last page", () => {
      const onPageChange = vi.fn();
      const { result } = renderHook(() =>
        usePagination({ totalCount: 10, pageSize: 10, onPageChange })
      );

      act(() => result.current.nextPage());
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("does not call onPageChange via prevPage when on first page", () => {
      const onPageChange = vi.fn();
      const { result } = renderHook(() =>
        usePagination({ totalCount: 30, pageSize: 10, onPageChange })
      );

      act(() => result.current.prevPage());
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("calls onPageChange callback", () => {
      const onPageChange = vi.fn();
      const { result } = renderHook(() =>
        usePagination({ totalCount: 50, pageSize: 10, onPageChange })
      );

      act(() => result.current.setPage(3));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("does not call onPageChange if page does not change", () => {
      const onPageChange = vi.fn();
      const { result } = renderHook(() =>
        usePagination({ totalCount: 50, pageSize: 10, onPageChange })
      );

      act(() => result.current.setPage(1)); // already on page 1
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe("nextPage / prevPage", () => {
    it("nextPage increments page", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 30, pageSize: 10 }));

      act(() => result.current.nextPage());
      expect(result.current.currentPage).toBe(2);
    });

    it("nextPage does nothing on last page", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 10, pageSize: 10 }));

      act(() => result.current.nextPage());
      expect(result.current.currentPage).toBe(1);
    });

    it("prevPage decrements page", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 30, pageSize: 10, initialPage: 2 })
      );

      act(() => result.current.prevPage());
      expect(result.current.currentPage).toBe(1);
    });

    it("prevPage does nothing on first page", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 30, pageSize: 10 }));

      act(() => result.current.prevPage());
      expect(result.current.currentPage).toBe(1);
    });
  });

  describe("goToFirstPage / goToLastPage", () => {
    it("goToFirstPage navigates to page 1", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 30, pageSize: 10, initialPage: 3 })
      );

      act(() => result.current.goToFirstPage());
      expect(result.current.currentPage).toBe(1);
    });

    it("goToLastPage navigates to last page", () => {
      const { result } = renderHook(() => usePagination({ totalCount: 30, pageSize: 10 }));

      act(() => result.current.goToLastPage());
      expect(result.current.currentPage).toBe(3);
    });
  });

  describe("reset", () => {
    it("resets to initial page", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 50, pageSize: 10, initialPage: 3 })
      );

      act(() => result.current.setPage(1));
      expect(result.current.currentPage).toBe(1);

      act(() => result.current.reset());
      expect(result.current.currentPage).toBe(3);
    });
  });

  describe("visiblePages", () => {
    it("shows all pages when totalPages <= maxVisiblePages", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 20, pageSize: 10, maxVisiblePages: 5 })
      );

      expect(result.current.visiblePages).toEqual([1, 2]);
    });

    it("includes ellipsis when pages exceed maxVisiblePages", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 100, pageSize: 10, maxVisiblePages: 5 })
      );

      expect(result.current.visiblePages).toContain("ellipsis");
      expect(result.current.visiblePages[0]).toBe(1);
      expect(result.current.visiblePages[result.current.visiblePages.length - 1]).toBe(10);
    });

    it("handles maxVisiblePages = 3 (minimum) with many pages", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 100, pageSize: 5, maxVisiblePages: 3, initialPage: 5 })
      );

      // 20 total pages, maxVisiblePages=3 → halfVisible=0
      // Should show: [1, "ellipsis", 5, "ellipsis", 20] or similar minimal layout
      expect(result.current.visiblePages[0]).toBe(1);
      expect(result.current.visiblePages).toContain("ellipsis");
      expect(result.current.visiblePages[result.current.visiblePages.length - 1]).toBe(20);
    });

    it("shows single page when totalPages is 1", () => {
      const { result } = renderHook(() =>
        usePagination({ totalCount: 5, pageSize: 10, maxVisiblePages: 5 })
      );

      expect(result.current.visiblePages).toEqual([1]);
      expect(result.current.totalPages).toBe(1);
    });
  });

  describe("validation", () => {
    it("throws when totalCount is negative", () => {
      expect(() => {
        renderHook(() => usePagination({ totalCount: -1, pageSize: 10 }));
      }).toThrow("totalCount must be non-negative");
    });

    it("throws when pageSize is zero", () => {
      expect(() => {
        renderHook(() => usePagination({ totalCount: 10, pageSize: 0 }));
      }).toThrow("pageSize must be positive");
    });

    it("throws when maxVisiblePages is less than 3", () => {
      expect(() => {
        renderHook(() => usePagination({ totalCount: 10, pageSize: 5, maxVisiblePages: 2 }));
      }).toThrow("maxVisiblePages must be at least 3");
    });
  });
});

describe("createPaginationListKey", () => {
  it("joins segments with underscore", () => {
    expect(createPaginationListKey("users", 1)).toBe("users_1");
  });

  it("sanitizes invalid characters", () => {
    // "User List!_admin" → lowercase → "user list!_admin" → replace non-alphanum → "user_list__admin"
    expect(createPaginationListKey("User List!", "admin")).toBe("user_list__admin");
  });

  it("returns default for empty segments", () => {
    expect(createPaginationListKey("")).toBe("default");
  });
});

describe("getPageInfo", () => {
  it("returns 'no items' message when totalCount is 0", () => {
    const result = getPageInfo({
      totalCount: 0,
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
      startIndex: 0,
      endIndex: -1,
      hasNextPage: false,
      hasPrevPage: false,
      visiblePages: [1],
    });
    // Should NOT contain any numeric range like "1-0" or "0--1"
    expect(result).not.toMatch(/\d+-\d+/);
  });

  it("formats range for single page", () => {
    const result = getPageInfo({
      totalCount: 5,
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
      startIndex: 0,
      endIndex: 4,
      hasNextPage: false,
      hasPrevPage: false,
      visiblePages: [1],
    });
    expect(result).toBe("1-5 / 5");
  });

  it("formats range for first page of multi-page", () => {
    const result = getPageInfo({
      totalCount: 25,
      currentPage: 1,
      totalPages: 3,
      pageSize: 10,
      startIndex: 0,
      endIndex: 9,
      hasNextPage: true,
      hasPrevPage: false,
      visiblePages: [1, 2, 3],
    });
    expect(result).toBe("1-10 / 25");
  });

  it("formats range for last partial page", () => {
    const result = getPageInfo({
      totalCount: 25,
      currentPage: 3,
      totalPages: 3,
      pageSize: 10,
      startIndex: 20,
      endIndex: 24,
      hasNextPage: false,
      hasPrevPage: true,
      visiblePages: [1, 2, 3],
    });
    expect(result).toBe("21-25 / 25");
  });

  it("formats range for middle page", () => {
    const result = getPageInfo({
      totalCount: 100,
      currentPage: 5,
      totalPages: 10,
      pageSize: 10,
      startIndex: 40,
      endIndex: 49,
      hasNextPage: true,
      hasPrevPage: true,
      visiblePages: [1, "ellipsis", 5, 6, "ellipsis", 10],
    });
    expect(result).toBe("41-50 / 100");
  });
});
describe("usePagination — endIndex with totalCount=0", () => {
  it("endIndex is -1 when totalCount is 0", () => {
    const { result } = renderHook(() => usePagination({ totalCount: 0, pageSize: 10 }));
    expect(result.current.endIndex).toBe(-1);
  });
});

describe("useHybridPageSize", () => {
  beforeEach(() => {
    window.localStorage.clear();
    searchParamsStore.sort();
    for (const k of [...searchParamsStore.keys()]) searchParamsStore.delete(k);
    mockSetSearchParams.mockClear();
  });

  it("returns defaultPageSize when no URL param or localStorage", () => {
    const { result } = renderHook(() =>
      useHybridPageSize({ key: "test-list", defaultPageSize: 20 })
    );
    expect(result.current[0]).toBe(20);
  });

  it("reads page size from URL param", () => {
    searchParamsStore.set("ps_test-list", "25");
    const { result } = renderHook(() =>
      useHybridPageSize({ key: "test-list", defaultPageSize: 10 })
    );
    expect(result.current[0]).toBe(25);
  });

  it("reads page size from localStorage when URL param is absent", () => {
    window.localStorage.setItem("pagination_page_size_test-list", "30");
    const { result } = renderHook(() =>
      useHybridPageSize({ key: "test-list", defaultPageSize: 10 })
    );
    expect(result.current[0]).toBe(30);
  });

  it("URL param takes precedence over localStorage", () => {
    searchParamsStore.set("ps_test-list", "25");
    window.localStorage.setItem("pagination_page_size_test-list", "30");
    const { result } = renderHook(() =>
      useHybridPageSize({ key: "test-list", defaultPageSize: 10 })
    );
    expect(result.current[0]).toBe(25);
  });

  it("ignores disallowed page sizes in URL", () => {
    searchParamsStore.set("ps_test-list", "99");
    const { result } = renderHook(() =>
      useHybridPageSize({
        key: "test-list",
        defaultPageSize: 10,
        allowedPageSizes: [10, 20, 50],
      })
    );
    expect(result.current[0]).toBe(10);
  });

  it("ignores negative values in URL param", () => {
    searchParamsStore.set("ps_test-list", "-5");
    const { result } = renderHook(() =>
      useHybridPageSize({ key: "test-list", defaultPageSize: 10 })
    );
    expect(result.current[0]).toBe(10);
  });

  it("setHybridPageSize updates the value", () => {
    const { result, rerender } = renderHook(() =>
      useHybridPageSize({ key: "test-list", defaultPageSize: 10 })
    );

    act(() => result.current[1](20));
    // Mock setSearchParams doesn't trigger re-render, force one so hook reads updated params
    rerender();
    expect(result.current[0]).toBe(20);
  });

  it("setHybridPageSize rejects disallowed sizes", () => {
    const { result } = renderHook(() =>
      useHybridPageSize({
        key: "test-list",
        defaultPageSize: 10,
        allowedPageSizes: [10, 20, 50],
      })
    );

    act(() => result.current[1](99));
    expect(result.current[0]).toBe(10);
  });

  it("setHybridPageSize persists to localStorage", () => {
    const { result } = renderHook(() =>
      useHybridPageSize({ key: "test-list", defaultPageSize: 10 })
    );

    act(() => result.current[1](50));
    expect(window.localStorage.getItem("pagination_page_size_test-list")).toBe("50");
  });

  it("falls back to first allowed size when defaultPageSize is invalid", () => {
    const { result } = renderHook(() =>
      useHybridPageSize({
        key: "test-list",
        defaultPageSize: 99,
        allowedPageSizes: [10, 20, 50],
      })
    );
    expect(result.current[0]).toBe(10);
  });

  it("sanitizes key to lowercase with underscores", () => {
    searchParamsStore.set("ps_my_list", "15");
    const { result } = renderHook(() =>
      useHybridPageSize({ key: "My List!", defaultPageSize: 10 })
    );
    expect(result.current[0]).toBe(15);
  });
});

describe("useUrlPagination", () => {
  beforeEach(() => {
    searchParamsStore.sort();
    for (const k of [...searchParamsStore.keys()]) searchParamsStore.delete(k);
    mockSetSearchParams.mockClear();
  });

  it("defaults to page 1 when no URL param", () => {
    const { result } = renderHook(() => useUrlPagination({ totalCount: 50, pageSize: 10 }));
    expect(result.current.currentPage).toBe(1);
  });

  it("reads initial page from URL param", () => {
    searchParamsStore.set("page", "3");
    const { result } = renderHook(() => useUrlPagination({ totalCount: 50, pageSize: 10 }));
    expect(result.current.currentPage).toBe(3);
  });

  it("uses custom pageParam name", () => {
    searchParamsStore.set("p", "2");
    const { result } = renderHook(() => useUrlPagination({ totalCount: 50, pageSize: 10 }, "p"));
    expect(result.current.currentPage).toBe(2);
  });

  it("setPage updates URL params with correct page number", () => {
    const { result } = renderHook(() => useUrlPagination({ totalCount: 50, pageSize: 10 }));

    act(() => result.current.setPage(3));
    expect(mockSetSearchParams).toHaveBeenCalled();
    const lastCall = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1];
    const params = lastCall[0] as URLSearchParams;
    expect(params.get("page")).toBe("3");
  });

  it("removes page param when navigating to page 1", () => {
    searchParamsStore.set("page", "3");
    const { result } = renderHook(() => useUrlPagination({ totalCount: 50, pageSize: 10 }));

    act(() => result.current.setPage(1));
    expect(mockSetSearchParams).toHaveBeenCalled();
    const lastCall = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1];
    const params = lastCall[0] as URLSearchParams;
    expect(params.get("page")).toBeNull();
  });

  it("clamps initial page from URL to valid range", () => {
    searchParamsStore.set("page", "999");
    const { result } = renderHook(() => useUrlPagination({ totalCount: 20, pageSize: 10 }));
    expect(result.current.currentPage).toBe(2); // clamped to totalPages
  });

  it("nextPage updates URL params", () => {
    const { result } = renderHook(() => useUrlPagination({ totalCount: 30, pageSize: 10 }));

    act(() => result.current.nextPage());
    expect(mockSetSearchParams).toHaveBeenCalled();
    const lastCall = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1];
    const params = lastCall[0] as URLSearchParams;
    expect(params.get("page")).toBe("2");
  });

  it("prevPage removes page param when navigating to page 1", () => {
    searchParamsStore.set("page", "2");
    const { result } = renderHook(() => useUrlPagination({ totalCount: 30, pageSize: 10 }));

    act(() => result.current.prevPage());
    expect(mockSetSearchParams).toHaveBeenCalled();
    const lastCall = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1];
    const params = lastCall[0] as URLSearchParams;
    expect(params.get("page")).toBeNull();
  });

  it("goToLastPage updates URL params", () => {
    const { result } = renderHook(() => useUrlPagination({ totalCount: 30, pageSize: 10 }));

    act(() => result.current.goToLastPage());
    expect(mockSetSearchParams).toHaveBeenCalled();
    const lastCall = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1];
    const params = lastCall[0] as URLSearchParams;
    expect(params.get("page")).toBe("3");
  });

  it("nextPage does not update URL when on last page", () => {
    searchParamsStore.set("page", "3");
    const { result } = renderHook(() => useUrlPagination({ totalCount: 30, pageSize: 10 }));

    mockSetSearchParams.mockClear();
    act(() => result.current.nextPage());
    expect(mockSetSearchParams).not.toHaveBeenCalled();
  });
});
