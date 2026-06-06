import i18n from "@/lib/i18n";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSortable } from "./useSortable";

interface TestItem {
  id: number;
  name: string;
  age: number | null;
}

const testData: TestItem[] = [
  { id: 1, name: "Charlie", age: 30 },
  { id: 2, name: "Alice", age: 25 },
  { id: 3, name: "Bob", age: null },
  { id: 4, name: "Diana", age: 35 },
];

describe("useSortable", () => {
  describe("default behavior", () => {
    it("reverses data by default (noSortBehavior=reverse)", () => {
      const { result } = renderHook(() => useSortable(testData));

      expect(result.current.sortedData.map((d) => d.id)).toEqual([4, 3, 2, 1]);
    });

    it("preserves order when noSortBehavior=preserve", () => {
      const { result } = renderHook(() => useSortable(testData, { noSortBehavior: "preserve" }));

      expect(result.current.sortedData.map((d) => d.id)).toEqual([1, 2, 3, 4]);
    });

    it("starts with no sort key and direction", () => {
      const { result } = renderHook(() => useSortable(testData));

      expect(result.current.sortKey).toBeNull();
      expect(result.current.sortDirection).toBe("none");
    });
  });

  describe("defaultSort option", () => {
    it("applies default sort by name ascending", () => {
      const { result } = renderHook(() =>
        useSortable(testData, { defaultSort: { key: "name", direction: "asc" } })
      );

      expect(result.current.sortKey).toBe("name");
      expect(result.current.sortDirection).toBe("asc");
      expect(result.current.sortedData.map((d) => d.name)).toEqual([
        "Alice",
        "Bob",
        "Charlie",
        "Diana",
      ]);
    });

    it("applies default sort by name descending", () => {
      const { result } = renderHook(() =>
        useSortable(testData, { defaultSort: { key: "name", direction: "desc" } })
      );

      expect(result.current.sortedData.map((d) => d.name)).toEqual([
        "Diana",
        "Charlie",
        "Bob",
        "Alice",
      ]);
    });
  });

  describe("toggleSort", () => {
    it("cycles through asc → desc → none", () => {
      const { result } = renderHook(() => useSortable(testData));

      // First toggle: sets asc
      act(() => result.current.toggleSort("name"));
      expect(result.current.sortKey).toBe("name");
      expect(result.current.sortDirection).toBe("asc");

      // Second toggle: desc
      act(() => result.current.toggleSort("name"));
      expect(result.current.sortDirection).toBe("desc");

      // Third toggle: none (clear)
      act(() => result.current.toggleSort("name"));
      expect(result.current.sortDirection).toBe("none");
      expect(result.current.sortKey).toBeNull();
    });

    it("switches to new key with asc direction", () => {
      const { result } = renderHook(() => useSortable(testData));

      act(() => result.current.toggleSort("name"));
      expect(result.current.sortDirection).toBe("asc");

      act(() => result.current.toggleSort("age"));
      expect(result.current.sortKey).toBe("age");
      expect(result.current.sortDirection).toBe("asc");
    });

    it("sorts numbers correctly", () => {
      const { result } = renderHook(() => useSortable(testData));

      act(() => result.current.toggleSort("age"));
      // null values are treated as smallest in asc, so they go first
      const ages = result.current.sortedData.map((d) => d.age);
      expect(ages[0]).toBeNull();
      expect(ages.slice(1)).toEqual([25, 30, 35]);
    });
  });

  describe("getSortProps", () => {
    it("returns none direction for unsorted column", () => {
      const { result } = renderHook(() => useSortable(testData));

      const props = result.current.getSortProps("name");
      expect(props.direction).toBe("none");
    });

    it("returns current direction for sorted column", () => {
      const { result } = renderHook(() => useSortable(testData));

      act(() => result.current.toggleSort("name"));
      const props = result.current.getSortProps("name");
      expect(props.direction).toBe("asc");
    });

    it("onChange callback updates sort state", () => {
      const { result } = renderHook(() => useSortable(testData));

      const props = result.current.getSortProps("name");
      act(() => props.onChange("desc"));

      expect(result.current.sortKey).toBe("name");
      expect(result.current.sortDirection).toBe("desc");
    });

    it("onChange with none clears sort", () => {
      const { result } = renderHook(() => useSortable(testData));

      act(() => result.current.toggleSort("name"));
      const props = result.current.getSortProps("name");
      act(() => props.onChange("none"));

      expect(result.current.sortKey).toBeNull();
      expect(result.current.sortDirection).toBe("none");
    });

    it("onChange with asc sets ascending sort", () => {
      const { result } = renderHook(() => useSortable(testData));

      const props = result.current.getSortProps("name");
      act(() => props.onChange("asc"));

      expect(result.current.sortKey).toBe("name");
      expect(result.current.sortDirection).toBe("asc");
      expect(result.current.sortedData.map((d) => d.name)).toEqual([
        "Alice",
        "Bob",
        "Charlie",
        "Diana",
      ]);
    });
  });

  describe("null value handling", () => {
    it("sorts null values to beginning in ascending (null is smallest)", () => {
      const { result } = renderHook(() => useSortable(testData));

      act(() => result.current.toggleSort("age"));
      const ages = result.current.sortedData.map((d) => d.age);
      expect(ages[0]).toBeNull();
    });

    it("sorts null values to end in descending (null is smallest)", () => {
      const { result } = renderHook(() => useSortable(testData));

      act(() => result.current.toggleSort("age"));
      act(() => result.current.toggleSort("age")); // desc
      const ages = result.current.sortedData.map((d) => d.age);
      expect(ages[ages.length - 1]).toBeNull();
    });
  });

  describe("tieBreaker", () => {
    it("uses tieBreaker when primary values are equal", () => {
      const data: TestItem[] = [
        { id: 1, name: "A", age: 30 },
        { id: 2, name: "A", age: 20 },
        { id: 3, name: "B", age: 10 },
      ];

      const { result } = renderHook(() =>
        useSortable(data, {
          defaultSort: { key: "name", direction: "asc" },
          tieBreaker: { key: "age", direction: "desc" },
        })
      );

      // Both name="A" items should be sorted by age desc
      expect(result.current.sortedData[0].age).toBe(30);
      expect(result.current.sortedData[1].age).toBe(20);
    });
  });

  describe("getSortIconType", () => {
    it("returns none for unsorted column", () => {
      const { result } = renderHook(() => useSortable(testData));
      expect(
        result.current.getSortIconType("name", result.current.sortKey, result.current.sortDirection)
      ).toBe("none");
    });

    it("returns asc for ascending column", () => {
      const { result } = renderHook(() => useSortable(testData));
      act(() => result.current.toggleSort("name"));
      expect(
        result.current.getSortIconType("name", result.current.sortKey, result.current.sortDirection)
      ).toBe("asc");
    });

    it("returns desc for descending column", () => {
      const { result } = renderHook(() => useSortable(testData));
      act(() => result.current.toggleSort("name"));
      act(() => result.current.toggleSort("name"));
      expect(
        result.current.getSortIconType("name", result.current.sortKey, result.current.sortDirection)
      ).toBe("desc");
    });
  });

  describe("getAriaLabel", () => {
    it("returns 'sort by' message when column is not the active sort field", () => {
      const { result } = renderHook(() => useSortable(testData));
      const label = result.current.getAriaLabel("name", null, "none");
      expect(label).toContain("name");
    });

    it("returns descending label when column is sorted ascending", () => {
      const { result } = renderHook(() => useSortable(testData));
      const label = result.current.getAriaLabel("name", "name", "asc");
      expect(label).toBe(i18n.t("compUi.sortByColumnDescending", { column: "name" }));
    });

    it("returns ascending label when column is sorted descending", () => {
      const { result } = renderHook(() => useSortable(testData));
      const label = result.current.getAriaLabel("name", "name", "desc");
      expect(label).toBe(i18n.t("compUi.sortByColumnAscending", { column: "name" }));
    });

    it("returns different labels for active vs inactive columns", () => {
      const { result } = renderHook(() => useSortable(testData));
      const activeLabel = result.current.getAriaLabel("name", "name", "asc");
      const inactiveLabel = result.current.getAriaLabel("age", "name", "asc");
      expect(activeLabel).not.toBe(inactiveLabel);
      expect(inactiveLabel).toContain("age");
    });
  });

  describe("undefined value handling", () => {
    const dataWithUndefined = [
      { id: 1, name: "A", age: undefined as number | null | undefined },
      { id: 2, name: "B", age: 25 },
      { id: 3, name: "C", age: undefined as number | null | undefined },
      { id: 4, name: "D", age: 30 },
    ];

    it("sorts undefined values to beginning in ascending", () => {
      const { result } = renderHook(() =>
        useSortable(dataWithUndefined, { defaultSort: { key: "age", direction: "asc" } })
      );
      expect(result.current.sortedData[0].age).toBeUndefined();
      expect(result.current.sortedData[1].age).toBeUndefined();
      expect(result.current.sortedData[2].age).toBe(25);
      expect(result.current.sortedData[3].age).toBe(30);
    });

    it("sorts undefined values to end in descending", () => {
      const { result } = renderHook(() =>
        useSortable(dataWithUndefined, { defaultSort: { key: "age", direction: "desc" } })
      );
      expect(result.current.sortedData[result.current.sortedData.length - 1].age).toBeUndefined();
      expect(result.current.sortedData[result.current.sortedData.length - 2].age).toBeUndefined();
      expect(result.current.sortedData[0].age).toBe(30);
      expect(result.current.sortedData[1].age).toBe(25);
    });
  });

  describe("empty array", () => {
    it("returns empty array for empty input", () => {
      const { result } = renderHook(() => useSortable<TestItem>([]));
      expect(result.current.sortedData).toEqual([]);
    });

    it("toggleSort on empty array does not error", () => {
      const { result } = renderHook(() => useSortable<TestItem>([]));
      act(() => result.current.toggleSort("name"));
      expect(result.current.sortedData).toEqual([]);
      expect(result.current.sortKey).toBe("name");
    });
  });

  describe("single-item array", () => {
    it("returns single item unchanged for any sort direction", () => {
      const single: TestItem[] = [{ id: 1, name: "Only", age: 30 }];
      const { result } = renderHook(() => useSortable(single));
      expect(result.current.sortedData).toHaveLength(1);
      expect(result.current.sortedData[0].name).toBe("Only");

      act(() => result.current.toggleSort("name"));
      expect(result.current.sortedData).toHaveLength(1);

      act(() => result.current.toggleSort("name"));
      expect(result.current.sortedData).toHaveLength(1);
    });
  });

  describe("toggleSort re-ascending from none", () => {
    it("cycles back to asc after none when toggling same key", () => {
      const { result } = renderHook(() => useSortable(testData));

      // asc → desc → none → asc
      act(() => result.current.toggleSort("name")); // asc
      act(() => result.current.toggleSort("name")); // desc
      act(() => result.current.toggleSort("name")); // none
      expect(result.current.sortDirection).toBe("none");
      expect(result.current.sortKey).toBeNull();

      // The 4th branch in toggleSort: sortKey !== key → set asc
      act(() => result.current.toggleSort("name"));
      expect(result.current.sortDirection).toBe("asc");
      expect(result.current.sortKey).toBe("name");
    });
  });

  describe("string comparison", () => {
    it("sorts strings case-sensitively via localeCompare", () => {
      const data: TestItem[] = [
        { id: 1, name: "banana", age: 1 },
        { id: 2, name: "Apple", age: 2 },
        { id: 3, name: "cherry", age: 3 },
      ];
      const { result } = renderHook(() =>
        useSortable(data, { defaultSort: { key: "name", direction: "asc" } })
      );
      // localeCompare orders: Apple < banana < cherry
      expect(result.current.sortedData.map((d) => d.name)).toEqual(["Apple", "banana", "cherry"]);
    });
  });

  describe("tieBreaker with default direction", () => {
    it("tieBreaker defaults to desc when direction is omitted", () => {
      const data: TestItem[] = [
        { id: 1, name: "A", age: 30 },
        { id: 2, name: "A", age: 10 },
        { id: 3, name: "A", age: 20 },
      ];

      const { result } = renderHook(() =>
        useSortable(data, {
          defaultSort: { key: "name", direction: "asc" },
          tieBreaker: { key: "age" },
        })
      );

      // tieBreaker defaults to 'desc' when direction is omitted (source code: options.tieBreaker.direction ?? "desc")
      expect(result.current.sortedData[0].age).toBe(30);
      expect(result.current.sortedData[1].age).toBe(20);
      expect(result.current.sortedData[2].age).toBe(10);
    });
  });

  describe("null handling", () => {
    it("treats both-null values as equal (stable order)", () => {
      const data = [
        { id: 1, name: null as unknown as string, age: 10 },
        { id: 2, name: null as unknown as string, age: 20 },
        { id: 3, name: "A", age: 30 },
      ];

      const { result } = renderHook(() =>
        useSortable(data, { defaultSort: { key: "name", direction: "asc" } })
      );

      // Both null → comparator returns 0 → stable relative order preserved
      const names = result.current.sortedData.map((d) => d.name);
      expect(names.filter((n) => n === null)).toHaveLength(2);
      // Non-null item should be sorted correctly
      expect(names[names.length - 1]).toBe("A");
    });
  });

  describe("initialData changes", () => {
    it("re-sorts when initialData reference changes", () => {
      const data1: TestItem[] = [
        { id: 1, name: "B", age: 2 },
        { id: 2, name: "A", age: 1 },
      ];
      const data2: TestItem[] = [
        { id: 3, name: "Z", age: 26 },
        { id: 4, name: "A", age: 1 },
        { id: 5, name: "M", age: 13 },
      ];

      const { result, rerender } = renderHook(
        ({ data }) => useSortable(data, { defaultSort: { key: "name", direction: "asc" } }),
        { initialProps: { data: data1 } }
      );

      expect(result.current.sortedData.map((d) => d.name)).toEqual(["A", "B"]);

      rerender({ data: data2 });
      expect(result.current.sortedData.map((d) => d.name)).toEqual(["A", "M", "Z"]);
    });

    it("reverses new data when no sort is active", () => {
      const data1: TestItem[] = [
        { id: 1, name: "A", age: 1 },
        { id: 2, name: "B", age: 2 },
      ];
      const data2: TestItem[] = [
        { id: 3, name: "X", age: 24 },
        { id: 4, name: "Y", age: 25 },
        { id: 5, name: "Z", age: 26 },
      ];

      const { result, rerender } = renderHook(({ data }) => useSortable(data), {
        initialProps: { data: data1 },
      });

      // Default reverse
      expect(result.current.sortedData.map((d) => d.id)).toEqual([2, 1]);

      rerender({ data: data2 });
      expect(result.current.sortedData.map((d) => d.id)).toEqual([5, 4, 3]);
    });
  });

  describe("defaultSort changes", () => {
    it("resets sort state when defaultSort.key changes", () => {
      const { result, rerender } = renderHook(
        ({ sortKey }) =>
          useSortable(testData, {
            defaultSort: sortKey ? { key: sortKey, direction: "asc" } : undefined,
          }),
        { initialProps: { sortKey: "name" as keyof TestItem } }
      );

      expect(result.current.sortKey).toBe("name");
      expect(result.current.sortedData[0].name).toBe("Alice");

      rerender({ sortKey: "age" as keyof TestItem });
      expect(result.current.sortKey).toBe("age");
      expect(result.current.sortDirection).toBe("asc");
    });

    it("resets sort direction when defaultSort.direction changes", () => {
      const { result, rerender } = renderHook(
        ({ direction }) => useSortable(testData, { defaultSort: { key: "name", direction } }),
        { initialProps: { direction: "asc" as "asc" | "desc" } }
      );

      expect(result.current.sortDirection).toBe("asc");
      expect(result.current.sortedData[0].name).toBe("Alice");

      rerender({ direction: "desc" as "asc" | "desc" });
      expect(result.current.sortDirection).toBe("desc");
      expect(result.current.sortedData[0].name).toBe("Diana");
    });

    it("clears sort when defaultSort becomes undefined", () => {
      const initialProps = {
        opts: { defaultSort: { key: "name" as keyof TestItem, direction: "asc" as const } } as {
          defaultSort?: { key: keyof TestItem; direction: "asc" };
        },
      };
      const { result, rerender } = renderHook(({ opts }) => useSortable(testData, opts), {
        initialProps,
      });

      expect(result.current.sortKey).toBe("name");

      rerender({ opts: {} });
      expect(result.current.sortKey).toBeNull();
      expect(result.current.sortDirection).toBe("none");
    });
  });
});
